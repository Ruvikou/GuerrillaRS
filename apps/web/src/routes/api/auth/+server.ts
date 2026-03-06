import { json, error } from '@sveltejs/kit';
import argon2 from 'argon2';
import { prisma } from '$lib/server/prisma';
import { generateToken } from '$lib/server/auth';
import type { RequestHandler } from './$types';
import { z } from 'zod';

const loginSchema = z.object({
	username: z.string().min(1).max(50),
	password: z.string().min(1)
});

const registerSchema = z.object({
	username: z.string()
		.min(3)
		.max(20)
		.regex(/^[a-z0-9_]+$/, 'Solo letras minúsculas, números y guiones bajos'),
	email: z.string().email(),
	password: z.string().min(8).max(100),
	displayName: z.string().min(1).max(50)
});

// POST /api/auth - Login o registro
export const POST: RequestHandler = async ({ request, cookies }) => {
	const body = await request.json();
	const action = body.action;

	if (action === 'login') {
		const { username, password } = loginSchema.parse(body);

		const user = await prisma.user.findUnique({
			where: { username: username.toLowerCase() },
			select: {
				id: true,
				username: true,
				displayName: true,
				email: true,
				passwordHash: true,
				accessLevel: true,
				avatarUrl: true,
				verifiedAt: true,
				suspendedAt: true
			}
		});

		if (!user) {
			throw error(401, 'Credenciales inválidas');
		}

		if (user.suspendedAt) {
			throw error(403, 'Cuenta suspendida');
		}

		const validPassword = await argon2.verify(user.passwordHash, password);
		if (!validPassword) {
			throw error(401, 'Credenciales inválidas');
		}

		// Generar token
		const token = await generateToken(user.id, user.username, user.accessLevel);

		// Set cookie
		cookies.set('token', token, {
			path: '/',
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'strict',
			maxAge: 60 * 60 * 24 * 7 // 7 días
		});

		return json({
			success: true,
			token,
			user: {
				id: user.id,
				username: user.username,
				displayName: user.displayName,
				email: user.email,
				avatarUrl: user.avatarUrl,
				accessLevel: user.accessLevel,
				verifiedAt: user.verifiedAt
			}
		});
	}

	if (action === 'register') {
		const { username, email, password, displayName } = registerSchema.parse(body);

		// Verificar si el usuario ya existe
		const existingUser = await prisma.user.findFirst({
			where: {
				OR: [
					{ username: username.toLowerCase() },
					{ email: email.toLowerCase() }
				]
			}
		});

		if (existingUser) {
			throw error(409, 'Usuario o email ya registrado');
		}

		// Hash de contraseña
		const passwordHash = await argon2.hash(password, {
			type: argon2.argon2id,
			memoryCost: 65536,
			timeCost: 3,
			parallelism: 4
		});

		// Crear usuario
		const user = await prisma.user.create({
			data: {
				username: username.toLowerCase(),
				email: email.toLowerCase(),
				passwordHash,
				displayName,
				accessLevel: 'UNVERIFIED'
			},
			select: {
				id: true,
				username: true,
				displayName: true,
				email: true,
				avatarUrl: true,
				accessLevel: true,
				verifiedAt: true
			}
		});

		// Generar token
		const token = await generateToken(user.id, user.username, user.accessLevel);

		// Set cookie
		cookies.set('token', token, {
			path: '/',
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'strict',
			maxAge: 60 * 60 * 24 * 7
		});

		return json({
			success: true,
			token,
			user: {
				id: user.id,
				username: user.username,
				displayName: user.displayName,
				email: user.email,
				avatarUrl: user.avatarUrl,
				accessLevel: user.accessLevel,
				verifiedAt: user.verifiedAt
			}
		});
	}

	throw error(400, 'Acción no válida');
};

// DELETE /api/auth - Logout
export const DELETE: RequestHandler = async ({ cookies }) => {
	cookies.delete('token', { path: '/' });
	return json({ success: true });
};

// GET /api/auth/validate - Validar token
export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		throw error(401, 'No autenticado');
	}

	const user = await prisma.user.findUnique({
		where: { id: locals.user.userId },
		select: {
			id: true,
			username: true,
			displayName: true,
			email: true,
			avatarUrl: true,
			accessLevel: true,
			verifiedAt: true
		}
	});

	if (!user) {
		throw error(401, 'Usuario no encontrado');
	}

	return json({ user });
};
