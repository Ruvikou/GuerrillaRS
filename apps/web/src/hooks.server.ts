import type { Handle } from '@sveltejs/kit';
import { initWebSocketServer } from '$lib/server/websocket';
import { initSearchIndexes } from '$lib/server/search';
import { sequence } from '@sveltejs/kit/hooks';

// Inicializar servicios al arrancar
let initialized = false;

async function initializeServices() {
	if (initialized) return;
	
	try {
		// Inicializar índices de búsqueda
		await initSearchIndexes();
		console.log('✅ Search indexes initialized');
	} catch (e) {
		console.error('❌ Error initializing search indexes:', e);
	}
	
	initialized = true;
}

// Hook de autenticación
const authHandle: Handle = async ({ event, resolve }) => {
	// Inicializar servicios en primer request
	await initializeServices();
	
	// Obtener token de header o cookie
	const authHeader = event.request.headers.get('authorization');
	const token = authHeader?.startsWith('Bearer ') 
		? authHeader.slice(7) 
		: event.cookies.get('token');
	
	if (token) {
		try {
			// Validar token y obtener usuario
			const { verifyToken } = await import('$lib/server/auth');
			const { getUserById } = await import('$lib/server/permissions');
			
			const payload = await verifyToken(token);
			if (payload?.userId) {
				// Verificar accessLevel en BD (anti-tampering)
				const dbUser = await getUserById(payload.userId);
				if (dbUser && dbUser.accessLevel === payload.accessLevel) {
					event.locals.user = {
						userId: dbUser.id,
						username: dbUser.username,
						accessLevel: dbUser.accessLevel
					};
				}
			}
		} catch (e) {
			// Token inválido, continuar sin usuario
		}
	}
	
	return resolve(event);
};

// Hook de seguridad (headers)
const securityHandle: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);
	
	// Security headers
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('X-XSS-Protection', '1; mode=block');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set(
		'Content-Security-Policy',
		"default-src 'self'; " +
		"script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
		"style-src 'self' 'unsafe-inline'; " +
		"img-src 'self' data: blob: https:; " +
		"font-src 'self'; " +
		"connect-src 'self' ws: wss:; " +
		"frame-ancestors 'none';"
	);
	
	return response;
};

// Exportar secuencia de hooks
export const handle = sequence(authHandle, securityHandle);

// Inicializar WebSocket server
export const init = async () => {
	// Esto se ejecuta al iniciar el servidor
	console.log('🌿 Guerrilla RS server starting...');
};
