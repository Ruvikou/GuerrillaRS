import sharp from 'sharp';
import { createHash, randomBytes } from 'crypto';
import { EPHEMERAL_KEY } from '$env/static/private';
import type { AgeVerificationStatus, VerificationResult } from '$lib/types/auth';

// Almacenamiento temporal en memoria (en producción usar Redis)
const verificationAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_ATTEMPTS_PER_HOUR = 3;

/**
 * Normaliza una imagen de documento para procesamiento
 * - Escala a 800x600 máximo
 * - Convierte a escala de grises
 * - Aplica threshold para mejorar OCR
 */
export async function normalizeDocumentImage(buffer: Buffer): Promise<Buffer> {
	return sharp(buffer)
		.resize(800, 600, { fit: 'inside', withoutEnlargement: true })
		.grayscale()
		.threshold(128)
		.toBuffer();
}

/**
 * Calcula el hash SHA-256 de una imagen normalizada
 * Este es el docHash que se almacena (NO la imagen)
 */
export async function calculateDocHash(buffer: Buffer): Promise<string> {
	const normalizedBuffer = await normalizeDocumentImage(buffer);
	return createHash('sha256').update(normalizedBuffer).digest('hex');
}

/**
 * Encripta temporalmente una imagen para procesamiento
 * La clave efímera se pierde al reiniciar el servidor
 */
export function encryptEphemeral(buffer: Buffer): { encrypted: Buffer; iv: string } {
	const iv = randomBytes(16);
	const key = Buffer.from(EPHEMERAL_KEY || 'default_key_32_bytes_long!!!!!'.slice(0, 32));
	
	// XOR simple para encriptación efímera (no seguro para persistencia)
	const encrypted = Buffer.alloc(buffer.length);
	for (let i = 0; i < buffer.length; i++) {
		encrypted[i] = buffer[i] ^ key[i % key.length] ^ iv[i % iv.length];
	}
	
	return { encrypted, iv: iv.toString('hex') };
}

/**
 * Desencripta una imagen encriptada efímeramente
 */
export function decryptEphemeral(encrypted: Buffer, ivHex: string): Buffer {
	const iv = Buffer.from(ivHex, 'hex');
	const key = Buffer.from(EPHEMERAL_KEY || 'default_key_32_bytes_long!!!!!'.slice(0, 32));
	
	const decrypted = Buffer.alloc(encrypted.length);
	for (let i = 0; i < encrypted.length; i++) {
		decrypted[i] = encrypted[i] ^ key[i % key.length] ^ iv[i % iv.length];
	}
	
	return decrypted;
}

/**
 * Borra de forma segura un buffer de memoria
 * Sobrescribe con ceros antes de liberar
 */
export function secureDelete(buffer: Buffer): void {
	buffer.fill(0);
}

/**
 * Verifica el límite de intentos de verificación por IP
 */
export function checkVerificationLimit(ipHash: string): { allowed: boolean; remaining: number } {
	const now = Date.now();
	const record = verificationAttempts.get(ipHash);
	
	if (!record) {
		return { allowed: true, remaining: MAX_ATTEMPTS_PER_HOUR - 1 };
	}
	
	// Resetear si ha pasado más de 1 hora
	if (now - record.lastAttempt > 60 * 60 * 1000) {
		verificationAttempts.set(ipHash, { count: 1, lastAttempt: now });
		return { allowed: true, remaining: MAX_ATTEMPTS_PER_HOUR - 1 };
	}
	
	const remaining = MAX_ATTEMPTS_PER_HOUR - record.count;
	return { allowed: remaining > 0, remaining };
}

/**
 * Registra un intento de verificación
 */
export function recordVerificationAttempt(ipHash: string): void {
	const now = Date.now();
	const record = verificationAttempts.get(ipHash);
	
	if (!record || now - record.lastAttempt > 60 * 60 * 1000) {
		verificationAttempts.set(ipHash, { count: 1, lastAttempt: now });
	} else {
		record.count++;
		record.lastAttempt = now;
	}
}

/**
 * Extrae fecha de nacimiento de texto OCR
 * Busca patrones comunes de fechas en documentos españoles
 */
export function extractBirthDate(ocrText: string): Date | null {
	// Patrones comunes de fecha en DNI español
	const patterns = [
		/(\d{2})[\/\.-](\d{2})[\/\.-](\d{4})/,  // DD/MM/YYYY
		/(\d{2})\s+(\d{2})\s+(\d{4})/,          // DD MM YYYY
		/FN[\s:]+(\d{2})[\/\.-](\d{2})[\/\.-](\d{4})/i,  // FN: DD/MM/YYYY
		/FECHA[\s:]+(\d{2})[\/\.-](\d{2})[\/\.-](\d{4})/i,  // FECHA: DD/MM/YYYY
		/NACIMIENTO[\s:]+(\d{2})[\/\.-](\d{2})[\/\.-](\d{4})/i,  // NACIMIENTO: DD/MM/YYYY
	];
	
	for (const pattern of patterns) {
		const match = ocrText.match(pattern);
		if (match) {
			const [_, day, month, year] = match;
			const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
			
			// Validar que la fecha es razonable (entre 1900 y hoy)
			const now = new Date();
			const minDate = new Date(1900, 0, 1);
			
			if (date >= minDate && date <= now) {
				return date;
			}
		}
	}
	
	return null;
}

/**
 * Calcula la edad a partir de una fecha de nacimiento
 */
export function calculateAge(birthDate: Date): number {
	const now = new Date();
	let age = now.getFullYear() - birthDate.getFullYear();
	const monthDiff = now.getMonth() - birthDate.getMonth();
	
	if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) {
		age--;
	}
	
	return age;
}

/**
 * Valida si la edad cumple el requisito mínimo (16 años)
 */
export function validateAge(birthDate: Date): { valid: boolean; age: number } {
	const age = calculateAge(birthDate);
	return { valid: age >= 16, age };
}
