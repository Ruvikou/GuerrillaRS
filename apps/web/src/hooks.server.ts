// Guerrilla RS - Server Hooks (Middleware de Autenticación)
// USO 1: Fundamentos Privacy-First
// REGLA CRÍTICA: NUNCA confiar en cliente para permisos. Verificar accessLevel en BD en CADA request.

import type { Handle, RequestEvent } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { jwtVerify, importSPKI } from 'jose';
import { prisma } from '$lib/server/db';
import {
	AccessLevel,
	getPermissions,
	type JWTPayload,
	type AuthenticatedUser
} from '$lib/types/auth';

// Clave pública para verificar JWT (en producción, cargar desde env/vault)
const JWT_PUBLIC_KEY_PEM = process.env.JWT_PUBLIC_KEY || '';

/**
 * Middleware de seguridad principal
 * Verifica JWT y hace fetch fresca de BD para anti-tampering
 */
const authHandler: Handle = async ({ event, resolve }) => {
	// Inicializar locals con valores por defecto (PÚBLICO)
	event.locals.user = null;
	event.locals.accessLevel = AccessLevel.PUBLIC;
	event.locals.permissions = getPermissions(AccessLevel.PUBLIC);

	// 1. Extraer token de cookie
	const token = event.cookies.get('session');

	if (!token) {
		// Sin token = usuario público
		return resolve(event);
	}

	try {
		// 2. Verificar firma JWT
		const publicKey = await importSPKI(JWT_PUBLIC_KEY_PEM, 'ES256');
		const { payload } = await jwtVerify(token, publicKey);

		const jwtPayload = payload as unknown as JWTPayload;

		// 3. FETCH FRESCA DE BD: NUNCA confiar en cliente
		// Esta es la línea más importante de seguridad del sistema
		const user = await prisma.user.findUnique({
			where: { id: jwtPayload.userId },
			select: {
				id: true,
				username: true,
				email: true,
				accessLevel: true,
				verifiedAt: true,
				avatarUrl: true,
				deletedAt: true
			}
		});

		// 4. Verificar que el usuario existe y no está eliminado
		if (!user || user.deletedAt) {
			// Token válido pero usuario no existe o está eliminado
			await logSecurityEvent('INVALID_TOKEN_USER', jwtPayload.userId, event);
			event.cookies.delete('session', { path: '/' });
			return resolve(event);
		}

		// 5. VERIFICACIÓN DOBLE: JWT + BD deben coincidir (ANTI-TAMPERING)
		// Si alguien modifica el JWT para elevar sus privilegios, esto lo detecta
		if (jwtPayload.accessLevel !== user.accessLevel) {
			await logSecurityEvent('LEVEL_MISMATCH', user.id, event, {
				jwtLevel: jwtPayload.accessLevel,
				dbLevel: user.accessLevel
			});
			// Invalidar sesión
			event.cookies.delete('session', { path: '/' });
			await prisma.session.deleteMany({ where: { token } });
			return resolve(event);
		}

		// 6. Verificar que la sesión existe en BD (no revocada)
		const session = await prisma.session.findUnique({
			where: { token },
			select: { expiresAt: true }
		});

		if (!session || session.expiresAt < new Date()) {
			// Sesión expirada o revocada
			event.cookies.delete('session', { path: '/' });
			return resolve(event);
		}

		// 7. Todo verificado: poblar locals
		const authenticatedUser: AuthenticatedUser = {
			id: user.id,
			username: user.username,
			email: user.email,
			accessLevel: user.accessLevel as AccessLevel,
			verifiedAt: user.verifiedAt,
			avatarUrl: user.avatarUrl
		};

		event.locals.user = authenticatedUser;
		event.locals.accessLevel = user.accessLevel as AccessLevel;
		event.locals.permissions = getPermissions(user.accessLevel as AccessLevel);

		// 8. Log de acceso (solo para rutas sensibles)
		if (isSensitiveRoute(event.url.pathname)) {
			await logSecurityEvent('ACCESS_SENSITIVE_ROUTE', user.id, event, {
				path: event.url.pathname
			});
		}
	} catch (error) {
		// Error de verificación JWT (token inválido, expirado, etc.)
		console.error('JWT verification error:', error);
		event.cookies.delete('session', { path: '/' });
	}

	return resolve(event);
};

/**
 * Middleware de rate limiting básico
 * Protege contra abuso de endpoints
 */
const rateLimitHandler: Handle = async ({ event, resolve }) => {
	// Skip rate limiting para recursos estáticos
	if (event.url.pathname.startsWith('/_app/') || event.url.pathname.startsWith('/static/')) {
		return resolve(event);
	}

	// Rate limiting específico para endpoints de auth
	if (event.url.pathname.startsWith('/api/auth/')) {
		// Aquí se implementaría rate limiting con Redis
		// Por ahora, solo logueamos
		const ipHash = await hashIp(event.getClientAddress());
		console.log(`Auth attempt from ${ipHash} to ${event.url.pathname}`);
	}

	return resolve(event);
};

/**
 * Middleware de headers de seguridad
 */
const securityHeadersHandler: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);

	// Headers de seguridad críticos
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set(
		'Content-Security-Policy',
		"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; media-src 'self' blob:; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';"
	);
	response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

	// HSTS (solo en producción con HTTPS)
	if (process.env.NODE_ENV === 'production') {
		response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
	}

	return response;
};

/**
 * Log de eventos de seguridad
 * Guarda en AuditLog para trazabilidad
 */
async function logSecurityEvent(
	action: string,
	userId: string | null,
	event: RequestEvent,
	metadata: Record<string, unknown> = {}
): Promise<void> {
	try {
		const ipHash = await hashIp(event.getClientAddress());
		const userAgentHash = await hashString(event.request.headers.get('user-agent') || '');

		await prisma.auditLog.create({
			data: {
				action,
				userId,
				metadata: {
					ipHash,
					userAgentHash,
					path: event.url.pathname,
					method: event.request.method,
					...metadata
				},
				severity: action.includes('MISMATCH') || action.includes('INVALID') ? 'WARNING' : 'INFO'
			}
		});
	} catch (error) {
		console.error('Failed to log security event:', error);
	}
}

/**
 * Determina si una ruta es sensible y requiere log
 */
function isSensitiveRoute(pathname: string): boolean {
	const sensitivePaths = [
		'/admin',
		'/api/verify',
		'/api/auth/change-password',
		'/api/auth/delete-account'
	];
	return sensitivePaths.some((path) => pathname.startsWith(path));
}

/**
 * Hash de IP para anonimización en logs
 */
async function hashIp(ip: string): Promise<string> {
	const encoder = new TextEncoder();
	const data = encoder.encode(ip + process.env.SESSION_SALT);
	const hashBuffer = await crypto.subtle.digest('SHA-256', data);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
}

/**
 * Hash de string genérico
 */
async function hashString(str: string): Promise<string> {
	const encoder = new TextEncoder();
	const data = encoder.encode(str + process.env.SESSION_SALT);
	const hashBuffer = await crypto.subtle.digest('SHA-256', data);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
}

// Exportar secuencia de middlewares
export const handle = sequence(rateLimitHandler, authHandler, securityHeadersHandler);
