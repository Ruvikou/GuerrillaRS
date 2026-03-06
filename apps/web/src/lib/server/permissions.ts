import { error } from '@sveltejs/kit';
import { prisma } from './prisma';
import type { AccessLevel } from '$lib/types/auth';
import { ACCESS_LEVEL_HIERARCHY, PERMISSIONS } from '$lib/types/auth';

/**
 * Verifica si un nivel de acceso tiene un permiso específico
 * NUNCA confiar en accessLevel del cliente - siempre verificar en BD
 */
export function hasPermission(
	accessLevel: AccessLevel,
	permission: readonly AccessLevel[]
): boolean {
	return permission.includes(accessLevel);
}

/**
 * Verifica si accessLevelA es mayor o igual que accessLevelB
 */
export function hasMinimumAccess(
	accessLevel: AccessLevel,
	minimumLevel: AccessLevel
): boolean {
	return ACCESS_LEVEL_HIERARCHY[accessLevel] >= ACCESS_LEVEL_HIERARCHY[minimumLevel];
}

/**
 * Obtiene el valor numérico de un accessLevel
 */
export function getVerifiedAccessLevel(accessLevel: AccessLevel): number {
	return ACCESS_LEVEL_HIERARCHY[accessLevel];
}

/**
 * Obtiene usuario desde la base de datos por ID
 * Usado para anti-tampering: verificar JWT contra BD
 */
export async function getUserById(userId: string) {
	return prisma.user.findUnique({
		where: { id: userId },
		select: {
			id: true,
			username: true,
			accessLevel: true,
			verifiedAt: true,
			suspendedAt: true
		}
	});
}

/**
 * Verifica si el usuario está autenticado
 * Lanza 401 si no lo está
 */
export function requireAuth(locals: App.Locals): NonNullable<App.Locals['user']> {
	if (!locals.user) {
		throw error(401, 'Autenticación requerida');
	}
	return locals.user;
}

/**
 * Verifica si el usuario tiene nivel mínimo requerido
 * Lanza 403 si no lo tiene
 */
export function requireAccessLevel(
	accessLevel: AccessLevel,
	minimumLevel: AccessLevel
): void {
	if (!hasMinimumAccess(accessLevel, minimumLevel)) {
		throw error(403, 'No tienes permisos para realizar esta acción');
	}
}

/**
 * Verifica si el usuario está verificado (VERIFIED_16+)
 * Lanza 403 si no lo está
 */
export function requireVerified(accessLevel: AccessLevel): void {
	if (!hasMinimumAccess(accessLevel, 'VERIFIED_16')) {
		throw error(403, 'Verificación de edad requerida');
	}
}

/**
 * Verifica si el usuario es moderador (MODERATOR+)
 * Lanza 403 si no lo es
 */
export function requireModerator(accessLevel: AccessLevel): void {
	if (!hasMinimumAccess(accessLevel, 'MODERATOR')) {
		throw error(403, 'Permisos de moderador requeridos');
	}
}

/**
 * Verifica si el usuario es admin (ADMIN only)
 * Lanza 403 si no lo es
 */
export function requireAdmin(accessLevel: AccessLevel): void {
	if (accessLevel !== 'ADMIN') {
		throw error(403, 'Permisos de administrador requeridos');
	}
}

/**
 * Verifica ownership de un recurso
 * Lanza 403 si el usuario no es el propietario ni admin
 */
export function requireOwnership(
	resourceOwnerId: string,
	userId: string,
	accessLevel: AccessLevel
): void {
	if (resourceOwnerId !== userId && accessLevel !== 'ADMIN') {
		throw error(403, 'No eres el propietario de este recurso');
	}
}

/**
 * Middleware combinado: requiere auth y verificación
 */
export function requireAuthAndVerified(locals: App.Locals): NonNullable<App.Locals['user']> {
	const user = requireAuth(locals);
	requireVerified(user.accessLevel);
	return user;
}
