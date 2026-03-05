// Guerrilla RS - Tipos de Autenticación y Permisos
// USO 1: Fundamentos Privacy-First
// REGLA: Usar únicamente accessLevel enum, NUNCA isAdmin boolean

/**
 * Niveles de acceso jerárquicos
 * Ordenados de menor a mayor privilegio
 */
export enum AccessLevel {
	PUBLIC = 'PUBLIC',
	UNVERIFIED = 'UNVERIFIED',
	VERIFIED_16 = 'VERIFIED_16',
	MODERATOR = 'MODERATOR',
	ADMIN = 'ADMIN'
}

/**
 * Orden numérico de niveles para comparaciones
 */
export const ACCESS_LEVEL_ORDER: Record<AccessLevel, number> = {
	[AccessLevel.PUBLIC]: 0,
	[AccessLevel.UNVERIFIED]: 1,
	[AccessLevel.VERIFIED_16]: 2,
	[AccessLevel.MODERATOR]: 7,
	[AccessLevel.ADMIN]: 9
};

/**
 * Permisos disponibles en el sistema
 * Cada permiso es una acción que puede realizar un usuario
 */
export type Permission =
	// Feed y contenido
	| 'canViewPublicFeed'
	| 'canViewDonations'
	| 'canPlayDemoGames'
	| 'canCreatePosts'
	| 'canComment'
	| 'canDM'
	| 'canLike'
	| 'canShare'
	// Moderación
	| 'canHidePosts'
	| 'canMuteUsers'
	| 'canViewReports'
	| 'canApproveVerifications'
	// Administración
	| 'canDeleteAccounts'
	| 'canChangeAccessLevel'
	| 'canViewAuditLogs'
	| 'canManageSystem';

/**
 * Configuración de permisos por nivel de acceso
 * Fácilmente modificable sin cambiar código de negocio
 */
export const PERMISSIONS: Record<AccessLevel, Record<Permission, boolean>> = {
	[AccessLevel.PUBLIC]: {
		canViewPublicFeed: false,
		canViewDonations: true,
		canPlayDemoGames: true,
		canCreatePosts: false,
		canComment: false,
		canDM: false,
		canLike: false,
		canShare: false,
		canHidePosts: false,
		canMuteUsers: false,
		canViewReports: false,
		canApproveVerifications: false,
		canDeleteAccounts: false,
		canChangeAccessLevel: false,
		canViewAuditLogs: false,
		canManageSystem: false
	},
	[AccessLevel.UNVERIFIED]: {
		canViewPublicFeed: true,
		canViewDonations: true,
		canPlayDemoGames: true,
		canCreatePosts: false,
		canComment: false,
		canDM: false,
		canLike: true,
		canShare: false,
		canHidePosts: false,
		canMuteUsers: false,
		canViewReports: false,
		canApproveVerifications: false,
		canDeleteAccounts: false,
		canChangeAccessLevel: false,
		canViewAuditLogs: false,
		canManageSystem: false
	},
	[AccessLevel.VERIFIED_16]: {
		canViewPublicFeed: true,
		canViewDonations: true,
		canPlayDemoGames: true,
		canCreatePosts: true,
		canComment: true,
		canDM: true,
		canLike: true,
		canShare: true,
		canHidePosts: false,
		canMuteUsers: false,
		canViewReports: false,
		canApproveVerifications: false,
		canDeleteAccounts: false,
		canChangeAccessLevel: false,
		canViewAuditLogs: false,
		canManageSystem: false
	},
	[AccessLevel.MODERATOR]: {
		canViewPublicFeed: true,
		canViewDonations: true,
		canPlayDemoGames: true,
		canCreatePosts: true,
		canComment: true,
		canDM: true,
		canLike: true,
		canShare: true,
		canHidePosts: true, // Puede ocultar posts
		canMuteUsers: true, // Puede silenciar usuarios temporalmente
		canViewReports: true, // Puede ver reportes
		canApproveVerifications: true, // Puede aprobar verificaciones
		canDeleteAccounts: false,
		canChangeAccessLevel: false,
		canViewAuditLogs: false,
		canManageSystem: false
	},
	[AccessLevel.ADMIN]: {
		canViewPublicFeed: true,
		canViewDonations: true,
		canPlayDemoGames: true,
		canCreatePosts: true,
		canComment: true,
		canDM: true,
		canLike: true,
		canShare: true,
		canHidePosts: true,
		canMuteUsers: true,
		canViewReports: true,
		canApproveVerifications: true,
		canDeleteAccounts: true, // Puede eliminar cuentas
		canChangeAccessLevel: true, // Puede cambiar niveles de acceso
		canViewAuditLogs: true, // Puede ver logs de auditoría
		canManageSystem: true // Puede configurar la plataforma
	}
};

/**
 * Límites diarios por nivel de acceso (en segundos)
 */
export const DAILY_TIME_LIMITS: Record<AccessLevel, number> = {
	[AccessLevel.PUBLIC]: 0,
	[AccessLevel.UNVERIFIED]: 1800, // 30 minutos
	[AccessLevel.VERIFIED_16]: Infinity,
	[AccessLevel.MODERATOR]: Infinity,
	[AccessLevel.ADMIN]: Infinity
};

/**
 * Watermarks visuales por nivel (para UI)
 */
export const ACCESS_LEVEL_WATERMARK: Record<AccessLevel, string | null> = {
	[AccessLevel.PUBLIC]: null,
	[AccessLevel.UNVERIFIED]: 'CUENTA NO VERIFICADA',
	[AccessLevel.VERIFIED_16]: null,
	[AccessLevel.MODERATOR]: 'MODERADOR',
	[AccessLevel.ADMIN]: 'ADMIN'
};

/**
 * Type helper para usuario con permisos
 * Usado en locals de SvelteKit
 */
export interface AuthenticatedUser {
	id: string;
	username: string;
	email: string;
	accessLevel: AccessLevel;
	verifiedAt: Date | null;
	avatarUrl: string | null;
}

/**
 * Type para locals en SvelteKit
 */
export interface AppLocals {
	user: AuthenticatedUser | null;
	accessLevel: AccessLevel;
	permissions: Record<Permission, boolean>;
}

/**
 * JWT Payload estructura
 */
export interface JWTPayload {
	userId: string;
	username: string;
	accessLevel: AccessLevel; // Solo para referencia, SIEMPRE verificar en BD
	iat: number;
	exp: number;
}
