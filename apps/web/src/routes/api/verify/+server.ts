// Guerrilla RS - API Endpoint de Verificación de Edad
// USO 1: Fundamentos Privacy-First
// REGLAS:
// - Rate limiting: 3 intentos/hora por IP
// - Borrado inmediato en finally{} garantizado
// - Solo almacenar docHash, nunca imágenes

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/server/db';
import {
	normalizeDocumentImage,
	generateDocHash,
	isDocHashUnique,
	extractBirthDate,
	calculateAge,
	compareFaces,
	performOCR,
	secureDelete,
	checkVerificationRateLimit,
	logVerificationAttempt,
	verifyUser
} from '$lib/server/verification';
import { AccessLevel } from '$lib/types/auth';
import { requireAuth } from '$lib/server/permissions';
import { createHash } from 'crypto';

// Clave efímera para desencriptación (en producción, debería rotarse)
const EPHEMERAL_KEY = process.env.EPHEMERAL_KEY || '';

/**
 * POST /api/verify
 * Endpoint principal de verificación de edad
 */
export const POST: RequestHandler = async (event) => {
	const { request, locals, getClientAddress } = event;

	// 1. REQUIERE AUTENTICACIÓN
	requireAuth(locals);

	// 2. Verificar que el usuario no esté ya verificado
	if (locals.accessLevel !== AccessLevel.UNVERIFIED) {
		throw error(400, {
			message: 'Usuario ya verificado o no requiere verificación'
		});
	}

	// 3. RATE LIMITING: 3 intentos por hora por IP
	const clientIp = getClientAddress();
	const ipHash = createHash('sha256')
		.update(clientIp + process.env.SESSION_SALT)
		.digest('hex')
		.slice(0, 32);

	const rateLimit = await checkVerificationRateLimit(ipHash);
	if (!rateLimit.allowed) {
		throw error(429, {
			message: 'Demasiados intentos',
			details: `Intenta de nuevo en ${Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 60000)} minutos`,
			resetAt: rateLimit.resetAt
		});
	}

	// 4. Parsear request body
	let body: { idImageEncrypted?: string; selfieEncrypted?: string };
	try {
		body = await request.json();
	} catch {
		throw error(400, { message: 'Body inválido' });
	}

	const { idImageEncrypted, selfieEncrypted } = body;

	if (!idImageEncrypted || !selfieEncrypted) {
		throw error(400, { message: 'Se requieren imagen de documento y selfie' });
	}

	// Variables para las imágenes desencriptadas
	let idImage: Buffer | null = null;
	let selfie: Buffer | null = null;
	let normalizedImage: Buffer | null = null;

	try {
		// 5. Desencriptar imágenes (clave efímera)
		idImage = decryptEphemeral(idImageEncrypted);
		selfie = decryptEphemeral(selfieEncrypted);

		// Validar que sean imágenes válidas
		if (!isValidImage(idImage) || !isValidImage(selfie)) {
			throw error(400, { message: 'Formato de imagen inválido' });
		}

		// 6. Normalizar imagen del documento
		normalizedImage = await normalizeDocumentImage(idImage);

		// 7. Generar docHash (SHA-256 de imagen normalizada)
		const docHash = generateDocHash(normalizedImage);

		// 8. Verificar duplicado (anti-spam)
		const isUnique = await isDocHashUnique(docHash);
		if (!isUnique) {
			await logVerificationAttempt(ipHash, locals.user?.id || null, false);
			throw error(409, {
				message: 'Este documento ya ha sido utilizado',
				details: 'Contacta soporte si crees que es un error'
			});
		}

		// 9. OCR para extraer fecha de nacimiento
		const ocrResult = await performOCR(idImage);
		const birthDate = extractBirthDate(ocrResult.text);

		if (!birthDate) {
			await logVerificationAttempt(ipHash, locals.user?.id || null, false);
			throw error(422, {
				message: 'No se pudo leer la fecha de nacimiento',
				details: 'Asegúrate de que la imagen sea clara y legible'
			});
		}

		// 10. Calcular edad
		const age = calculateAge(birthDate);

		// 11. Comparación facial (documento vs selfie)
		const faceComparison = await compareFaces(idImage, selfie);

		// 12. CRITERIOS DE VERIFICACIÓN:
		// - Edad >= 16 años
		// - Coincidencia facial (distance < 0.6)
		// - OCR confianza > 50%
		const verified = age >= 16 && faceComparison.match && ocrResult.confidence > 50;

		if (verified) {
			// 13. Actualizar usuario a VERIFIED_16
			await verifyUser(locals.user!.id, docHash, 'DOCUMENT_OCR');

			// Log de éxito
			await logVerificationAttempt(ipHash, locals.user?.id || null, true);

			return json({
				success: true,
				message: 'Verificación completada exitosamente',
				data: {
					accessLevel: AccessLevel.VERIFIED_16,
					verifiedAt: new Date().toISOString()
				}
			});
		} else {
			// Log de fallo
			await logVerificationAttempt(ipHash, locals.user?.id || null, false);

			const reasons: string[] = [];
			if (age < 16) reasons.push('Edad menor a 16 años');
			if (!faceComparison.match) reasons.push('La foto no coincide con el documento');
			if (ocrResult.confidence <= 50) reasons.push('Calidad de imagen insuficiente');

			throw error(422, {
				message: 'Verificación fallida',
				details: reasons.join('. '),
				reasons
			});
		}
	} catch (err) {
		// Re-lanzar errores de SvelteKit
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}

		console.error('Verification error:', err);
		throw error(500, {
			message: 'Error interno durante la verificación',
			details: process.env.NODE_ENV === 'development' ? String(err) : undefined
		});
	} finally {
		// 14. BORRADO INMEDIATO GARANTIZADO (REGLA CRÍTICA)
		// Esto se ejecuta SIEMPRE, incluso si hay errores
		secureDelete(idImage);
		secureDelete(selfie);
		secureDelete(normalizedImage);
	}
};

/**
 * GET /api/verify/status
 * Obtiene el estado de verificación del usuario actual
 */
export const GET: RequestHandler = async (event) => {
	const { locals } = event;

	requireAuth(locals);

	if (!locals.user) {
		throw error(401, { message: 'No autenticado' });
	}

	const user = await prisma.user.findUnique({
		where: { id: locals.user.id },
		select: {
			accessLevel: true,
			verifiedAt: true,
			verificationMethod: true,
			verificationRequestedAt: true
		}
	});

	if (!user) {
		throw error(404, { message: 'Usuario no encontrado' });
	}

	// Obtener intentos restantes
	const clientIp = event.getClientAddress();
	const ipHash = createHash('sha256')
		.update(clientIp + process.env.SESSION_SALT)
		.digest('hex')
		.slice(0, 32);

	const rateLimit = await checkVerificationRateLimit(ipHash);

	return json({
		accessLevel: user.accessLevel,
		isVerified: user.accessLevel === AccessLevel.VERIFIED_16,
		verifiedAt: user.verifiedAt?.toISOString() || null,
		verificationMethod: user.verificationMethod,
		verificationRequestedAt: user.verificationRequestedAt?.toISOString() || null,
		rateLimit: {
			remaining: rateLimit.remaining,
			resetAt: rateLimit.resetAt.toISOString()
		}
	});
};

/**
 * Desencripta datos usando la clave efímera
 * En producción, esto debería usar un sistema de encriptación más robusto
 */
function decryptEphemeral(encryptedData: string): Buffer {
	try {
		// Implementación simplificada - en producción usar libsodium o similar
		// Asumimos que los datos vienen en base64
		const encryptedBuffer = Buffer.from(encryptedData, 'base64');

		// XOR simple con clave (NO usar en producción real)
		// En producción: usar AES-256-GCM con clave efímera por sesión
		const key = Buffer.from(EPHEMERAL_KEY, 'hex');
		const decrypted = Buffer.alloc(encryptedBuffer.length);

		for (let i = 0; i < encryptedBuffer.length; i++) {
			decrypted[i] = encryptedBuffer[i]! ^ key[i % key.length]!;
		}

		return decrypted;
	} catch (err) {
		console.error('Decryption error:', err);
		throw error(400, { message: 'Error al desencriptar datos' });
	}
}

/**
 * Valida que un buffer sea una imagen válida
 */
function isValidImage(buffer: Buffer): boolean {
	// Verificar magic bytes de formatos comunes
	const magicBytes = {
		png: [0x89, 0x50, 0x4e, 0x47],
		jpeg: [0xff, 0xd8, 0xff],
		jpg: [0xff, 0xd8, 0xff],
		webp: [0x52, 0x49, 0x46, 0x46]
	};

	for (const [, bytes] of Object.entries(magicBytes)) {
		if (buffer.length >= bytes.length) {
			const match = bytes.every((byte, i) => buffer[i] === byte);
			if (match) return true;
		}
	}

	return false;
}
