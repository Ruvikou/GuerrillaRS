import { SignJWT, jwtVerify, importPKCS8, importSPKI } from 'jose';
import { JWT_PRIVATE_KEY, JWT_PUBLIC_KEY } from '$env/static/private';
import type { JWTPayload, AccessLevel } from '$lib/types/auth';

const ALG = 'ES256';
const TOKEN_EXPIRY = '7d';

let privateKey: CryptoKey | null = null;
let publicKey: CryptoKey | null = null;

/**
 * Inicializa las claves JWT
 */
async function initKeys(): Promise<void> {
	if (privateKey && publicKey) return;
	
	if (!JWT_PRIVATE_KEY || !JWT_PUBLIC_KEY) {
		throw new Error('JWT keys not configured');
	}
	
	privateKey = await importPKCS8(JWT_PRIVATE_KEY, ALG);
	publicKey = await importSPKI(JWT_PUBLIC_KEY, ALG);
}

/**
 * Genera un token JWT
 */
export async function generateToken(
	userId: string,
	username: string,
	accessLevel: AccessLevel
): Promise<string> {
	await initKeys();
	
	if (!privateKey) {
		throw new Error('Private key not initialized');
	}
	
	return new SignJWT({
		userId,
		username,
		accessLevel
	})
		.setProtectedHeader({ alg: ALG })
		.setIssuedAt()
		.setExpirationTime(TOKEN_EXPIRY)
		.sign(privateKey);
}

/**
 * Verifica un token JWT
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
	await initKeys();
	
	if (!publicKey) {
		throw new Error('Public key not initialized');
	}
	
	try {
		const { payload } = await jwtVerify(token, publicKey, {
			algorithms: [ALG]
		});
		
		return {
			userId: payload.userId as string,
			username: payload.username as string,
			accessLevel: payload.accessLevel as AccessLevel,
			iat: payload.iat as number,
			exp: payload.exp as number
		};
	} catch (e) {
		return null;
	}
}
