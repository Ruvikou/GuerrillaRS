import { json, error } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { requireAuth, requireVerified, getVerifiedAccessLevel } from '$lib/server/permissions';
import { broadcastNotification } from '$lib/server/websocket';
import type { RequestHandler } from './$types';
import { z } from 'zod';

const followSchema = z.object({
	username: z.string().min(1).max(50)
});

// POST /api/follows - Seguir a un usuario
export const POST: RequestHandler = async ({ request, locals }) => {
	const user = requireAuth(locals);
	requireVerified(user.accessLevel);

	const body = await request.json();
	const { username } = followSchema.parse(body);

	// Buscar usuario a seguir
	const targetUser = await prisma.user.findUnique({
		where: { username: username.toLowerCase() },
		select: { id: true, accessLevel: true, allowFollows: true }
	});

	if (!targetUser) {
		throw error(404, 'Usuario no encontrado');
	}

	// Prevenir auto-follow
	if (targetUser.id === user.userId) {
		throw error(400, 'No puedes seguirte a ti mismo');
	}

	// Verificar si el usuario permite follows
	if (!targetUser.allowFollows) {
		throw error(403, 'Este usuario no acepta seguidores');
	}

	try {
		await prisma.follow.create({
			data: {
				followerId: user.userId,
				followingId: targetUser.id
			}
		});

		// Notificar al seguido si es VERIFIED_16+
		if (getVerifiedAccessLevel(targetUser.accessLevel) >= 2) {
			broadcastNotification(targetUser.id, {
				type: 'NEW_FOLLOWER',
				message: 'Tienes un nuevo seguidor',
				data: { followerId: user.userId }
			});
		}

		return json({ success: true, following: true });
	} catch (e: any) {
		// Manejar duplicado
		if (e.code === 'P2002') {
			return json({ success: true, following: true, alreadyFollowing: true });
		}
		throw e;
	}
};

// DELETE /api/follows - Dejar de seguir
export const DELETE: RequestHandler = async ({ request, locals }) => {
	const user = requireAuth(locals);
	requireVerified(user.accessLevel);

	const body = await request.json();
	const { username } = followSchema.parse(body);

	const targetUser = await prisma.user.findUnique({
		where: { username: username.toLowerCase() },
		select: { id: true }
	});

	if (!targetUser) {
		throw error(404, 'Usuario no encontrado');
	}

	await prisma.follow.deleteMany({
		where: {
			followerId: user.userId,
			followingId: targetUser.id
		}
	});

	return json({ success: true, following: false });
};

// GET /api/follows?type=following|followers&username=xxx
export const GET: RequestHandler = async ({ url, locals }) => {
	requireAuth(locals);

	const type = url.searchParams.get('type');
	const username = url.searchParams.get('username');
	const cursor = url.searchParams.get('cursor');
	const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 50);

	if (!type || !username) {
		throw error(400, 'Se requiere type y username');
	}

	const targetUser = await prisma.user.findUnique({
		where: { username: username.toLowerCase() },
		select: { id: true }
	});

	if (!targetUser) {
		throw error(404, 'Usuario no encontrado');
	}

	const baseSelect = {
		id: true,
		createdAt: true,
		follower: {
			select: {
				id: true,
				username: true,
				displayName: true,
				avatarUrl: true,
				bio: true,
				verifiedAt: true
			}
		},
		following: {
			select: {
				id: true,
				username: true,
				displayName: true,
				avatarUrl: true,
				bio: true,
				verifiedAt: true
			}
		}
	};

	let follows;
	if (type === 'following') {
		follows = await prisma.follow.findMany({
			where: { followerId: targetUser.id },
			select: baseSelect,
			orderBy: { createdAt: 'desc' },
			take: limit + 1,
			cursor: cursor ? { id: cursor } : undefined
		});
	} else {
		follows = await prisma.follow.findMany({
			where: { followingId: targetUser.id },
			select: baseSelect,
			orderBy: { createdAt: 'desc' },
			take: limit + 1,
			cursor: cursor ? { id: cursor } : undefined
		});
	}

	const hasMore = follows.length > limit;
	const items = hasMore ? follows.slice(0, limit) : follows;
	const nextCursor = hasMore ? items[items.length - 1]?.id : null;

	// Mapear resultados
	const mappedItems = items.map(f => ({
		id: f.id,
		followedAt: f.createdAt,
		user: type === 'following' ? f.following : f.follower
	}));

	return json({
		items: mappedItems,
		nextCursor,
		hasMore
	});
};
