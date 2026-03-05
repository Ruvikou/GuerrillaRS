// Guerrilla RS - API Endpoints de Autenticación
// USO 1: Fundamentos Privacy-First
// Endpoints: POST /login, POST /register, POST /logout

import { json, error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/server/db';
import { AccessLevel, type JWTPayload } from '$lib/types/auth';
import { hash, verify } from 'argon2';
import { SignJWT, importPKCS8 } from 'jose';
import { createHash, randomBytes } from 'crypto';

// Clave privada para firmar JWT (en producción, cargar desde env/vault)
const JWT_PRIVATE_KEY_PEM = process.env.JWT_PRIVATE_KEY || '';
const JWT_EXPIRY = '15m'; // Access token: 15 minutos
const REFRESH_EXPIRY = '7d'; // Refresh token: 7 días
const SESSION_COOKIE_NAME = 'session';

/**
 * POST /api/auth/register
 * Registro de nuevo usuario
 * Crea usuario con accessLevel = UNVERIFIED
 */
export const POST: RequestHandler = async ({ request, cookies, getClientAddress }) => {
	const body = await request.json().catch(() => ({}));
	const { username, email, password, age } = body;

	// Validaciones básicas
	if (!username || !email || !password) {
		throw error(400, { message: 'Faltan campos requeridos' });
	}

	if (password.length < 12) {
		throw error(400, { message: 'La contraseña debe tener al menos 12 caracteres' });
	}

	if (!isValidEmail(email)) {
		throw error(400, { message: 'Email inválido' });
	}

	if (!isValidUsername(username)) {
		throw error(400, { message: 'Usuario inválido (solo letras, números, guiones)' });
	}

	// Verificar edad mínima declarada (verificación real en /api/verify)
	if (!age || age < 16) {
		throw error(400, { message: 'Debes declarar tener al menos 16 años' });
	}

	try {
		// Verificar si usuario/email ya existe
		const existing = await prisma.user.findFirst({
			where: {
				OR: [{ username }, { email }]
			}
		});

		if (existing) {
			throw error(409, {
				message: existing.username === username
					? 'Nombre de usuario no disponible'
					: 'Email ya registrado'
			});
		}

		// Hash de contraseña con Argon2id
		const passwordHash = await hash(password, {
			type: 2, // Argon2id
			memoryCost: 65536, // 64 MB
			timeCost: 3,
			parallelism: 4
		});

		// Crear usuario con accessLevel UNVERIFIED (REGLA: nunca isAdmin)
		const user = await prisma.user.create({
			data: {
				username,
				email,
				passwordHash,
				accessLevel: AccessLevel.UNVERIFIED,
				dailyTimeLimitSeconds: 1800 // 30 minutos para no verificados
			},
			select: {
				id: true,
				username: true,
				email: true,
				accessLevel: true,
				createdAt: true
			}
		});

		// Crear sesión y cookies
		await createSession(user.id, user.accessLevel, cookies, getClientAddress());

		// Log de auditoría
		await logAuditEvent('USER_REGISTERED', user.id, getClientAddress(), {
			username,
			email: hashEmail(email)
		});

		return json({
			success: true,
			message: 'Usuario registrado exitosamente',
			user: {
				id: user.id,
				username: user.username,
				accessLevel: user.accessLevel,
				requiresVerification: true
			}
		}, { status: 201 });
	} catch (err) {
		// Re-lanzar errores de SvelteKit
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}

		console.error('Registration error:', err);
		throw error(500, { message: 'Error al registrar usuario' });
	}
};

/**
 * POST /api/auth/login
 * Inicio de sesión
 * Verifica credenciales y crea sesión JWT
 */
export const PUT: RequestHandler = async ({ request, cookies, getClientAddress }) => {
	const body = await request.json().catch(() => ({}));
	const { username, password, rememberMe } = body;

	if (!username || !password) {
		throw error(400, { message: 'Usuario y contraseña requeridos' });
	}

	try {
		// Buscar usuario (por username o email)
		const user = await prisma.user.findFirst({
			where: {
				OR: [
					{ username },
					{ email: username }
				]
			},
			select: {
				id: true,
				username: true,
				email: true,
				passwordHash: true,
				accessLevel: true,
				verifiedAt: true,
				deletedAt: true,
				dailyTimeLimitSeconds: true
			}
		});

		// Usuario no encontrado o eliminado
		if (!user || user.deletedAt) {
			// Timing attack protection: hacer hash igual de lento
			await hash('dummy', { type: 2 });
			throw error(401, { message: 'Credenciales inválidas' });
		}

		// Verificar contraseña
		const validPassword = await verify(user.passwordHash!, password);

		if (!validPassword) {
			throw error(401, { message: 'Credenciales inválidas' });
		}

		// Crear sesión
		const sessionExpiry = rememberMe ? REFRESH_EXPIRY : JWT_EXPIRY;
		await createSession(user.id, user.accessLevel, cookies, getClientAddress(), sessionExpiry);

		// Log de auditoría
		await logAuditEvent('USER_LOGIN', user.id, getClientAddress());

		return json({
			success: true,
			user: {
				id: user.id,
				username: user.username,
				email: user.email,
				accessLevel: user.accessLevel,
				verifiedAt: user.verifiedAt?.toISOString() || null,
				requiresVerification: user.accessLevel === AccessLevel.UNVERIFIED
			}
		});
	} catch (err) {
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}

		console.error('Login error:', err);
		throw error(500, { message: 'Error al iniciar sesión' });
	}
};

/**
 * DELETE /api/auth/logout
 * Cierra sesión e invalida el token
 */
export const DELETE: RequestHandler = async ({ cookies, locals }) => {
	const token = cookies.get(SESSION_COOKIE_NAME);

	if (token) {
		// Invalidar sesión en BD
		await prisma.session.deleteMany({
			where: { token }
		});

		// Eliminar cookie
		cookies.delete(SESSION_COOKIE_NAME, { path: '/' });

		// Log de auditoría
		if (locals.user) {
			await logAuditEvent('USER_LOGOUT', locals.user.id, 'unknown');
		}
	}

	return json({
		success: true,
		message: 'Sesión cerrada exitosamente'
	});
};

/**
 * POST /api/auth/refresh
 * Refresca el token de acceso
 */
export const PATCH: RequestHandler = async ({ cookies, locals, getClientAddress }) => {
	if (!locals.user) {
		throw error(401, { message: 'No autenticado' });
	}

	// Verificar que el usuario sigue existiendo y tiene el mismo nivel
	const user = await prisma.user.findUnique({
		where: { id: locals.user.id },
		select: { id: true, accessLevel: true, deletedAt: true }
	});

	if (!user || user.deletedAt) {
		cookies.delete(SESSION_COOKIE_NAME, { path: '/' });
		throw error(401, { message: 'Usuario no válido' });
	}

	// Crear nueva sesión
	await createSession(user.id, user.accessLevel, cookies, getClientAddress());

	return json({
		success: true,
		message: 'Token refrescado'
	});
};

/**
 * Crea una sesión JWT y la guarda en cookie y BD
 */
async function createSession(
	userId: string,
	accessLevel: AccessLevel,
	cookies: { set: (name: string, value: string, options: Record<string, unknown>) => void },
	clientIp: string,
	expiry: string = JWT_EXPIRY
): Promise<void> {
	// Importar clave privada
	const privateKey = await importPKCS8(JWT_PRIVATE_KEY_PEM, 'ES256');

	// Crear payload JWT
	const payload: JWTPayload = {
		userId,
		username: '', // Se llenará después
		accessLevel,
		iat: Math.floor(Date.now() / 1000),
		exp: Math.floor(Date.now() / 1000) + parseExpiry(expiry)
	};

	// Firmar JWT
	const token = await new SignJWT(payload as Record<string, unknown>)
		.setProtectedHeader({ alg: 'ES256' })
		.setIssuedAt()
		.setExpirationTime(expiry)
		.sign(privateKey);

	// Guardar en BD para invalidación posterior
	await prisma.session.create({
		data: {
			id: randomBytes(32).toString('hex'),
			userId,
			token,
			expiresAt: new Date(Date.now() + parseExpiry(expiry) * 1000),
			ipAddress: await hashIp(clientIp),
			userAgent: '' // Se puede obtener del request
		}
	});

	// Setear cookie HTTP-only, Secure, SameSite=Strict
	const isProduction = process.env.NODE_ENV === 'production';
	cookies.set(SESSION_COOKIE_NAME, token, {
		path: '/',
		httpOnly: true,
		secure: isProduction,
		sameSite: 'strict',
		maxAge: parseExpiry(expiry)
	});
}

/**
 * Parsea un string de expiración a segundos
 */
function parseExpiry(expiry: string): number {
	const units: Record<string, number> = {
		m: 60,
		h: 3600,
		d: 86400
	};

	const match = expiry.match(/^(\d+)([mhd])$/);
	if (!match) return 900; // Default 15 minutos

	const [, amount, unit] = match;
	return parseInt(amount!, 10) * (units[unit!] || 60);
}

/**
 * Valida formato de email
 */
function isValidEmail(email: string): boolean {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Valida formato de username
 */
function isValidUsername(username: string): boolean {
	return /^[a-zA-Z0-9_-]{3,32}$/.test(username);
}

/**
 * Hash de IP para anonimización
 */
async function hashIp(ip: string): Promise<string> {
	const salt = process.env.SESSION_SALT || '';
	return createHash('sha256')
		.update(ip + salt)
		.digest('hex')
		.slice(0, 16);
}

/**
 * Hash de email para logs (anonimización parcial)
 */
function hashEmail(email: string): string {
	const [local, domain] = email.split('@');
	if (!domain) return createHash('sha256').update(email).digest('hex').slice(0, 8);

	const hashedLocal = createHash('sha256')
		.update(local!)
		.digest('hex')
		.slice(0, 6);

	return `${hashedLocal}...@${domain}`;
}

/**
 * Log de eventos de auditoría
 */
async function logAuditEvent(
	action: string,
	userId: string,
	clientIp: string,
	metadata: Record<string, unknown> = {}
): Promise<void> {
	try {
		await prisma.auditLog.create({
			data: {
				action,
				userId,
				metadata: {
					ipHash: await hashIp(clientIp),
					...metadata
				}
			}
		});
	} catch (err) {
		console.error('Failed to log audit event:', err);
	}
}
