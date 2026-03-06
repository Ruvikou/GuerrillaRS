import { json, error } from '@sveltejs/kit';
import { createWorker } from 'tesseract.js';
import * as faceapi from 'face-api.js';
import { canvas } from 'canvas';
import { prisma } from '$lib/server/prisma';
import { requireAuth } from '$lib/server/permissions';
import {
	calculateDocHash,
	encryptEphemeral,
	decryptEphemeral,
	secureDelete,
	checkVerificationLimit,
	recordVerificationAttempt,
	extractBirthDate,
	validateAge
} from '$lib/server/verification';
import { FACE_API_MODELS_PATH, FACE_MATCH_THRESHOLD } from '$env/static/private';
import type { RequestHandler } from './$types';

// Cargar modelos de face-api
let modelsLoaded = false;
async function loadModels() {
	if (modelsLoaded) return;
	const modelPath = FACE_API_MODELS_PATH || './models';
	await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelPath);
	await faceapi.nets.faceLandmark68Net.loadFromDisk(modelPath);
	await faceapi.nets.faceRecognitionNet.loadFromDisk(modelPath);
	modelsLoaded = true;
}

// POST /api/verify - Verificar edad con documento y selfie
export const POST: RequestHandler = async ({ request, locals, getClientAddress }) => {
	const user = requireAuth(locals);
	
	// Verificar límite de intentos
	const ipHash = require('crypto').createHash('sha256').update(getClientAddress()).digest('hex');
	const { allowed, remaining } = checkVerificationLimit(ipHash);
	
	if (!allowed) {
		throw error(429, 'Demasiados intentos. Espera 1 hora.');
	}

	// Procesar multipart form data
	const formData = await request.formData();
	const documentImage = formData.get('document') as File;
	const selfieImage = formData.get('selfie') as File;

	if (!documentImage || !selfieImage) {
		throw error(400, 'Se requiere documento y selfie');
	}

	// Validar tipos
	if (!documentImage.type.startsWith('image/') || !selfieImage.type.startsWith('image/')) {
		throw error(400, 'Archivos deben ser imágenes');
	}

	let docBuffer: Buffer | null = null;
	let selfieBuffer: Buffer | null = null;
	let encryptedDoc: Buffer | null = null;
	let encryptedSelfie: Buffer | null = null;
	let docIv: string = '';
	let selfieIv: string = '';

	try {
		// Leer buffers
		docBuffer = Buffer.from(await documentImage.arrayBuffer());
		selfieBuffer = Buffer.from(await selfieImage.arrayBuffer());

		// Encriptar temporalmente
		const docEncrypted = encryptEphemeral(docBuffer);
		const selfieEncrypted = encryptEphemeral(selfieBuffer);
		encryptedDoc = docEncrypted.encrypted;
		encryptedSelfie = selfieEncrypted.encrypted;
		docIv = docEncrypted.iv;
		selfieIv = selfieEncrypted.iv;

		// Limpiar buffers originales
		secureDelete(docBuffer);
		secureDelete(selfieBuffer);
		docBuffer = null;
		selfieBuffer = null;

		// Desencriptar para procesamiento
		docBuffer = decryptEphemeral(encryptedDoc, docIv);
		selfieBuffer = decryptEphemeral(encryptedSelfie, selfieIv);

		// 1. OCR del documento
		const worker = await createWorker('spa');
		const {
			data: { text: ocrText }
		} = await worker.recognize(docBuffer);
		await worker.terminate();

		// Extraer fecha de nacimiento
		const birthDate = extractBirthDate(ocrText);
		if (!birthDate) {
			recordVerificationAttempt(ipHash);
			throw error(400, 'No se pudo leer la fecha de nacimiento. Intenta con mejor iluminación.');
		}

		// Validar edad
		const { valid: ageValid, age } = validateAge(birthDate);
		if (!ageValid) {
			recordVerificationAttempt(ipHash);
			throw error(403, `Debes tener al menos 16 años. Edad detectada: ${age}`);
		}

		// 2. Comparación facial
		await loadModels();

		// Detectar rostros
		const docImg = await canvas.loadImage(docBuffer);
		const selfieImg = await canvas.loadImage(selfieBuffer);

		const docDetection = await faceapi
			.detectSingleFace(docImg as any)
			.withFaceLandmarks()
			.withFaceDescriptor();

		const selfieDetection = await faceapi
			.detectSingleFace(selfieImg as any)
			.withFaceLandmarks()
			.withFaceDescriptor();

		if (!docDetection || !selfieDetection) {
			recordVerificationAttempt(ipHash);
			throw error(400, 'No se detectó rostro en una o ambas imágenes');
		}

		// Calcular distancia euclidiana
		const distance = faceapi.euclideanDistance(
			docDetection.descriptor,
			selfieDetection.descriptor
		);

		const threshold = parseFloat(FACE_MATCH_THRESHOLD || '0.6');
		if (distance > threshold) {
			recordVerificationAttempt(ipHash);
			throw error(400, 'El rostro no coincide con el documento. Intenta de nuevo.');
		}

		// 3. Calcular docHash
		const docHash = await calculateDocHash(docBuffer);

		// Verificar que no esté duplicado
		const existingHash = await prisma.user.findFirst({
			where: { docHash }
		});

		if (existingHash && existingHash.id !== user.userId) {
			recordVerificationAttempt(ipHash);
			throw error(409, 'Este documento ya fue utilizado para verificar otra cuenta');
		}

		// 4. Actualizar usuario
		await prisma.user.update({
			where: { id: user.userId },
			data: {
				accessLevel: 'VERIFIED_16',
				verifiedAt: new Date(),
				docHash
			}
		});

		// Registrar intento exitoso
		recordVerificationAttempt(ipHash);

		return json({
			success: true,
			message: 'Verificación completada',
			age,
			remainingAttempts: remaining - 1
		});
	} catch (e: any) {
		// Limpiar buffers en caso de error
		if (docBuffer) secureDelete(docBuffer);
		if (selfieBuffer) secureDelete(selfieBuffer);
		if (encryptedDoc) secureDelete(encryptedDoc);
		if (encryptedSelfie) secureDelete(encryptedSelfie);

		throw e;
	} finally {
		// Asegurar borrado de buffers encriptados
		if (encryptedDoc) secureDelete(encryptedDoc);
		if (encryptedSelfie) secureDelete(encryptedSelfie);
	}
};

// GET /api/verify/status - Estado de verificación
export const GET: RequestHandler = async ({ locals }) => {
	const user = requireAuth(locals);

	const dbUser = await prisma.user.findUnique({
		where: { id: user.userId },
		select: {
			accessLevel: true,
			verifiedAt: true
		}
	});

	if (!dbUser) {
		throw error(404, 'Usuario no encontrado');
	}

	return json({
		verified: dbUser.accessLevel === 'VERIFIED_16' || dbUser.accessLevel === 'MODERATOR' || dbUser.accessLevel === 'ADMIN',
		accessLevel: dbUser.accessLevel,
		verifiedAt: dbUser.verifiedAt
	});
};
