/**
 * Niveles de acceso jerárquicos
 * NUNCA usar isAdmin boolean - siempre verificar accessLevel
 */
export type AccessLevel = 'PUBLIC' | 'UNVERIFIED' | 'VERIFIED_16' | 'MODERATOR' | 'ADMIN';

/**
 * Orden jerárquico de niveles de acceso (mayor = más permisos)
 */
export const ACCESS_LEVEL_HIERARCHY: Record<AccessLevel, number> = {
	PUBLIC: 0,
	UNVERIFIED: 1,
	VERIFIED_16: 2,
	MODERATOR: 7,
	ADMIN: 9
};

/**
 * Permisos disponibles en el sistema
 */
export const PERMISSIONS = {
	// Acceso básico
	VIEW_PUBLIC: ['PUBLIC', 'UNVERIFIED', 'VERIFIED_16', 'MODERATOR', 'ADMIN'] as AccessLevel[],
	
	// Crear contenido (requiere VERIFIED_16+)
	CREATE_POST: ['VERIFIED_16', 'MODERATOR', 'ADMIN'] as AccessLevel[],
	CREATE_COMMENT: ['VERIFIED_16', 'MODERATOR', 'ADMIN'] as AccessLevel[],
	LIKE_POST: ['VERIFIED_16', 'MODERATOR', 'ADMIN'] as AccessLevel[],
	FOLLOW_USER: ['VERIFIED_16', 'MODERATOR', 'ADMIN'] as AccessLevel[],
	
	// Moderación (MODERATOR+)
	MODERATE_CONTENT: ['MODERATOR', 'ADMIN'] as AccessLevel[],
	BAN_USER: ['MODERATOR', 'ADMIN'] as AccessLevel[],
	DELETE_ANY_POST: ['MODERATOR', 'ADMIN'] as AccessLevel[],
	
	// Admin (ADMIN only)
	MANAGE_USERS: ['ADMIN'] as AccessLevel[],
	MANAGE_SETTINGS: ['ADMIN'] as AccessLevel[],
	VIEW_AUDIT_LOGS: ['ADMIN'] as AccessLevel[],
	REINDEX_SEARCH: ['ADMIN'] as AccessLevel[]
} as const;

/**
 * Payload del JWT
 */
export interface JWTPayload {
	userId: string;
	username: string;
	accessLevel: AccessLevel;
	iat: number;
	exp: number;
}

/**
 * Sesión de usuario
 */
export interface UserSession {
	userId: string;
	username: string;
	accessLevel: AccessLevel;
	createdAt: Date;
	expiresAt: Date;
}

/**
 * Resultado de verificación
 */
export interface VerificationResult {
	success: boolean;
	accessLevel: AccessLevel;
	message?: string;
}

/**
 * Estado de verificación de edad
 */
export interface AgeVerificationStatus {
	status: 'PENDING' | 'PROCESSING' | 'VERIFIED' | 'REJECTED';
	attemptsRemaining: number;
	lastAttemptAt?: Date;
}
