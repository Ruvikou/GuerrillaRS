// Guerrilla RS - Sistema de Verificación de Documentos
// USO 1: Fundamentos Privacy-First
// REGLAS:
// - NUNCA usar identityHash, usar docHash (SHA-256 de imagen normalizada)
// - NUNCA persistir imágenes DNI, borrado inmediato en finally{}
// - Normalización: grayscale + resize 800x600 + threshold binario

import { createHash, randomBytes } from 'crypto';
import sharp from 'sharp';
import * as tesseract from 'tesseract.js';
import * as faceapi from 'face-api.js';
import { Canvas, Image } from 'canvas';
import { prisma } from './db';
import { AccessLevel } from '$lib/types/auth';

// Configuración de face-api para Node.js
faceapi.env.monkeyPatch({ Canvas, Image } as never);

// Rutas a los modelos de face-api (deben descargarse previamente)
const FACE_API_MODELS_PATH = process.env.FACE_API_MODELS_PATH || './models';

/**
 * Normaliza una imagen de documento para consistencia de hash
 * Aplica: grayscale, resize 800x600, normalize, threshold binario
 */
export async function normalizeDocumentImage(imageBuffer: Buffer): Promise<Buffer> {
	try {
		const normalized = await sharp(imageBuffer)
			// Convertir a escala de grises
			.grayscale()
			// Redimensionar a 800x600 manteniendo aspecto
			.resize(800, 600, { fit: 'inside', withoutEnlargement: false })
			// Normalizar contraste
			.normalize()
			// Binarización con threshold 128 (elimina variaciones de iluminación)
			.threshold(128)
			// Convertir a PNG para consistencia
			.png()
			.toBuffer();

		return normalized;
	} catch (error) {
		console.error('Error normalizing document image:', error);
		throw new Error('Failed to normalize document image');
	}
}

/**
 * Genera el hash SHA-256 de una imagen normalizada
 * Este es el docHash que se almacena en BD (NO identityHash)
 */
export function generateDocHash(normalizedImage: Buffer): string {
	return createHash('sha256').update(normalizedImage).digest('hex');
}

/**
 * Verifica si un docHash ya existe en la base de datos
 * Previene cuentas duplicadas con el mismo documento
 */
export async function isDocHashUnique(docHash: string): Promise<boolean> {
	const existing = await prisma.user.findUnique({
		where: { docHash },
		select: { id: true }
	});
	return existing === null;
}

/**
 * Extrae la fecha de nacimiento del texto OCR
 * Soporta formatos españoles: DD/MM/YYYY, DD-MM-YYYY
 */
export function extractBirthDate(ocrText: string): Date | null {
	// Patrones comunes de fecha en DNI español
	const patterns = [
		// Fecha de nacimiento explícita
		/Fecha de nacimiento[:\s]+(\d{2})[\/\-](\d{2})[\/\-](\d{4})/i,
		// Formato general DD/MM/YYYY o DD-MM-YYYY
		/(\d{2})[\/\-](\d{2})[\/\-](\d{4})/g,
		// Formato YYYY/MM/DD (algunos documentos)
		/(\d{4})[\/\-](\d{2})[\/\-](\d{2})/g
	];

	for (const pattern of patterns) {
		const match = ocrText.match(pattern);
		if (match) {
			// Intentar parsear la fecha
			const dateStr = match[0];
			const date = parseDate(dateStr);
			if (date && isValidBirthDate(date)) {
				return date;
			}
		}
	}

	return null;
}

/**
 * Parsea una fecha de string a Date
 */
function parseDate(dateStr: string): Date | null {
	// Limpiar el string
	const clean = dateStr.replace(/[^\d\/\-]/g, '');

	// Intentar diferentes formatos
	const separators = ['/', '-'];
	for (const sep of separators) {
		const parts = clean.split(sep);
		if (parts.length === 3) {
			// DD/MM/YYYY
			const day = parseInt(parts[0], 10);
			const month = parseInt(parts[1], 10) - 1; // Meses 0-indexed
			const year = parseInt(parts[2], 10);

			if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
				const date = new Date(year, month, day);
				if (date.getDate() === day && date.getMonth() === month) {
					return date;
				}
			}
		}
	}

	return null;
}

/**
 * Valida que una fecha de nacimiento sea razonable
 * (no futura, no mayor de 120 años)
 */
function isValidBirthDate(date: Date): boolean {
	const now = new Date();
	const age = now.getFullYear() - date.getFullYear();
	return age >= 0 && age <= 120 && date < now;
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
 * Compara dos imágenes faciales usando face-api.js
 * Retorna la distancia euclidiana (menor = más similar)
 */
export async function compareFaces(
	idImageBuffer: Buffer,
	selfieBuffer: Buffer
): Promise<{ match: boolean; distance: number }> {
	try {
		// Cargar modelos si no están cargados
		await loadFaceApiModels();

		// Detectar rostros y obtener descriptores
		const idDescriptor = await getFaceDescriptor(idImageBuffer);
		const selfieDescriptor = await getFaceDescriptor(selfieBuffer);

		if (!idDescriptor || !selfieDescriptor) {
			return { match: false, distance: 1 };
		}

		// Calcular distancia euclidiana
		const distance = faceapi.euclideanDistance(idDescriptor, selfieDescriptor);

		// Umbral de coincidencia (0.6 es el estándar recomendado)
		const threshold = 0.6;

		return { match: distance < threshold, distance };
	} catch (error) {
		console.error('Error comparing faces:', error);
		return { match: false, distance: 1 };
	}
}

/**
 * Obtiene el descriptor facial de una imagen
 */
async function getFaceDescriptor(imageBuffer: Buffer): Promise<Float32Array | null> {
	try {
		// Crear imagen desde buffer
		const img = await canvas.loadImage(imageBuffer);

		// Detectar rostro con landmarks
		const detection = await faceapi
			.detectSingleFace(img as unknown as HTMLImageElement)
			.withFaceLandmarks()
			.withFaceDescriptor();

		return detection?.descriptor || null;
	} catch (error) {
		console.error('Error getting face descriptor:', error);
		return null;
	}
}

/**
 * Carga los modelos de face-api si no están cargados
 */
async function loadFaceApiModels(): Promise<void> {
	try {
		await faceapi.nets.ssdMobilenetv1.loadFromDisk(FACE_API_MODELS_PATH);
		await faceapi.nets.faceLandmark68Net.loadFromDisk(FACE_API_MODELS_PATH);
		await faceapi.nets.faceRecognitionNet.loadFromDisk(FACE_API_MODELS_PATH);
	} catch (error) {
		console.error('Error loading face-api models:', error);
		throw new Error('Face recognition models not available');
	}
}

/**
 * Realiza OCR en una imagen de documento
 */
export async function performOCR(imageBuffer: Buffer): Promise<{
	text: string;
	confidence: number;
}> {
	try {
		const result = await tesseract.recognize(imageBuffer, 'spa', {
			logger: (m) => {
				if (process.env.NODE_ENV === 'development') {
					console.log(m);
				}
			}
		});

		return {
			text: result.data.text,
			confidence: result.data.confidence
		};
	} catch (error) {
		console.error('OCR error:', error);
		throw new Error('Failed to perform OCR');
	}
}

/**
 * Sobrescribe un buffer de memoria con ceros para evitar recuperación
 * REGLA CRÍTICA: Llamar esto en finally{} después de usar imágenes sensibles
 */
export function secureDelete(buffer: Buffer | null | undefined): void {
	if (!buffer || buffer.length === 0) return;

	try {
		// Sobrescribir con ceros
		buffer.fill(0);

		// Sobrescribir con datos aleatorios (opcional, más seguro)
		const randomData = randomBytes(buffer.length);
		buffer.set(randomData);

		// Sobrescribir nuevamente con ceros
		buffer.fill(0);
	} catch (error) {
		console.error('Error in secureDelete:', error);
	}
}

/**
 * Verifica si el usuario ha excedido el límite de intentos de verificación
 * Rate limiting: 3 intentos por hora por IP
 */
export async function checkVerificationRateLimit(ipHash: string): Promise<{
	allowed: boolean;
	remaining: number;
	resetAt: Date;
}> {
	const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
	const maxAttempts = 3;

	const attempts = await prisma.verificationAttempt.count({
		where: {
			ipHash,
			attemptedAt: { gte: oneHourAgo }
		}
	});

	const remaining = Math.max(0, maxAttempts - attempts);
	const resetAt = new Date(Date.now() + 60 * 60 * 1000);

	return {
		allowed: attempts < maxAttempts,
		remaining,
		resetAt
	};
}

/**
 * Registra un intento de verificación
 */
export async function logVerificationAttempt(
	ipHash: string,
	userId: string | null,
	success: boolean
): Promise<void> {
	await prisma.verificationAttempt.create({
		data: {
			ipHash,
			userId,
			success
		}
	});
}

/**
 * Actualiza el usuario a VERIFIED_16 tras verificación exitosa
 */
export async function verifyUser(
	userId: string,
	docHash: string,
	method: 'DOCUMENT_OCR' | 'MANUAL_ADMIN' = 'DOCUMENT_OCR',
	verifiedBy?: string
): Promise<void> {
	await prisma.user.update({
		where: { id: userId },
		data: {
			accessLevel: AccessLevel.VERIFIED_16,
			verifiedAt: new Date(),
			verificationMethod: method,
			docHash,
			verifiedBy,
			verificationNotes: method === 'MANUAL_ADMIN' ? 'Verificación manual por admin' : undefined
		}
	});
}

// Importar canvas para face-api
import canvas from 'canvas';
