// Guerrilla RS - Sistema de Permisos Server-Side
// USO 1: Fundamentos Privacy-First
// REGLA: NUNCA confiar en cliente para permisos. Verificar accessLevel en BD en CADA request.

import { error, redirect } from '@sveltejs/kit';
import {
	AccessLevel,
	ACCESS_LEVEL_ORDER,
	PERMISSIONS,
	type Permission,
	type AppLocals
} from '$lib/types/auth';

/**
 * Verifica si un nivel de acceso tiene un permiso específico
 * Type-safe: el permiso debe ser un valor válido de Permission
 */
export function hasPermission(
	accessLevel: AccessLevel,
	permission: Permission
): boolean {
	return PERMISSIONS[accessLevel][permission] ?? false;
}

/**
 * Verifica si un nivel de acceso tiene TODOS los permisos especificados
 */
export function hasAllPermissions(
	accessLevel: AccessLevel,
	permissions: Permission[]
): boolean {
	return permissions.every((perm) => hasPermission(accessLevel, perm));
}

/**
 * Verifica si un nivel de acceso tiene ALGUNO de los permisos especificados
 */
export function hasAnyPermission(
	accessLevel: AccessLevel,
	permissions: Permission[]
): boolean {
	return permissions.some((perm) => hasPermission(accessLevel, perm));
}

/**
 * Compara dos niveles de acceso
 * Retorna true si userLevel >= requiredLevel
 */
export function hasMinimumAccess(
	userLevel: AccessLevel,
	requiredLevel: AccessLevel
): boolean {
	return ACCESS_LEVEL_ORDER[userLevel] >= ACCESS_LEVEL_ORDER[requiredLevel];
}

/**
 * Guard de ruta: requiere nivel mínimo de acceso
 * Lanza error 403 si no cumple
 */
export function requireAccess(
	locals: AppLocals,
	minLevel: AccessLevel,
	options: { redirectTo?: string; throwError?: boolean } = {}
): void {
	const { redirectTo, throwError = true } = options;

	if (!hasMinimumAccess(locals.accessLevel, minLevel)) {
		if (redirectTo) {
			throw redirect(303, redirectTo);
		}
		if (throwError) {
			throw error(403, {
				message: 'Acceso denegado',
				details: `Se requiere nivel ${minLevel} o superior`
			});
		}
	}
}

/**
 * Guard de ruta: requiere permiso específico
 * Lanza error 403 si no cumple
 */
export function requirePermission(
	locals: AppLocals,
	permission: Permission,
	options: { redirectTo?: string; throwError?: boolean } = {}
): void {
	const { redirectTo, throwError = true } = options;

	if (!hasPermission(locals.accessLevel, permission)) {
		if (redirectTo) {
			throw redirect(303, redirectTo);
		}
		if (throwError) {
			throw error(403, {
				message: 'Acceso denegado',
				details: `No tienes permiso para ${permission}`
			});
		}
	}
}

/**
 * Guard de ruta: requiere autenticación (cualquier nivel excepto PUBLIC)
 */
export function requireAuth(
	locals: AppLocals,
	options: { redirectTo?: string } = {}
): void {
	const { redirectTo = '/login' } = options;

	if (locals.accessLevel === AccessLevel.PUBLIC || !locals.user) {
		throw redirect(303, redirectTo);
	}
}

/**
 * Guard de ruta: requiere verificación de edad (VERIFIED_16 o superior)
 */
export function requireVerified(
	locals: AppLocals,
	options: { redirectTo?: string } = {}
): void {
	const { redirectTo = '/verify' } = options;

	if (!hasMinimumAccess(locals.accessLevel, AccessLevel.VERIFIED_16)) {
		throw redirect(303, redirectTo);
	}
}

/**
 * Guard de ruta: requiere ser moderador
 */
export function requireModerator(locals: AppLocals): void {
	requireAccess(locals, AccessLevel.MODERATOR);
}

/**
 * Guard de ruta: requiere ser admin
 */
export function requireAdmin(locals: AppLocals): void {
	requireAccess(locals, AccessLevel.ADMIN);
}

/**
 * Obtiene todos los permisos de un nivel de acceso
 */
export function getPermissions(accessLevel: AccessLevel): Record<Permission, boolean> {
	return { ...PERMISSIONS[accessLevel] };
}

/**
 * Lista de permisos activos para un nivel (para debugging/UI)
 */
export function getActivePermissions(accessLevel: AccessLevel): Permission[] {
	return Object.entries(PERMISSIONS[accessLevel])
		.filter(([, value]) => value)
		.map(([key]) => key as Permission);
}

/**
 * Verifica si el usuario puede realizar una acción sobre un recurso
 * Considera: nivel de acceso, propiedad del recurso, y permisos específicos
 */
export function canModifyResource(
	locals: AppLocals,
	resourceOwnerId: string,
	requiredPermission?: Permission
): boolean {
	// Admin puede todo
	if (locals.accessLevel === AccessLevel.ADMIN) return true;

	// Moderador puede modificar recursos de otros con permiso específico
	if (locals.accessLevel === AccessLevel.MODERATOR) {
		if (requiredPermission) {
			return hasPermission(locals.accessLevel, requiredPermission);
		}
		return true;
	}

	// Usuario verificado solo puede modificar sus propios recursos
	if (locals.user?.id === resourceOwnerId) return true;

	return false;
}
