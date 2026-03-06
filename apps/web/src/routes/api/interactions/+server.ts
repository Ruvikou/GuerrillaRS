import { json, error } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { requireAuth, requireVerified, getVerifiedAccessLevel } from '$lib/server/permissions';
import { broadcastNotification } from '$lib/server/websocket';
import type { RequestHandler } from './$types';
import { z } from 'zod';

const likeSchema = z.object({
	postId: z.string().uuid()
});

const commentSchema = z.object({
	postId: z.string().uuid(),
	content: z.string().min(1).max(1000),
	parentId: z.string().uuid().optional()
});

// POST /api/interactions/like - Dar "energía solar" (like)
export const POST: RequestHandler = async ({ request, locals, url }) => {
	const user = requireAuth(locals);
	requireVerified(user.accessLevel);

	const action = url.searchParams.get('action');

	if (action === 'like') {
		const { postId } = likeSchema.parse(await request.json());

		// Verificar que el post existe y no está eliminado
		const post = await prisma.post.findFirst({
			where: {
				id: postId,
				deletedAt: null
			},
			select: {
				id: true,
				authorId: true,
				author: {
					select: { accessLevel: true }
				}
			}
		});

		if (!post) {
			throw error(404, 'Publicación no encontrada');
		}

		try {
			await prisma.like.create({
				data: {
					userId: user.userId,
					postId: postId
				}
			});

			// Notificar al autor si es VERIFIED_16+
			if (
				post.authorId !== user.userId &&
				getVerifiedAccessLevel(post.author.accessLevel) >= 2
			) {
				broadcastNotification(post.authorId, {
					type: 'NEW_ENERGY',
					message: 'Alguien ha compartido energía contigo',
					data: { postId, userId: user.userId }
				});
			}

			return json({ success: true, liked: true });
		} catch (e: any) {
			if (e.code === 'P2002') {
				return json({ success: true, liked: true, alreadyLiked: true });
			}
			throw e;
		}
	}

	if (action === 'comment') {
		const { postId, content, parentId } = commentSchema.parse(await request.json());

		// Verificar post
		const post = await prisma.post.findFirst({
			where: {
				id: postId,
				deletedAt: null
			},
			select: {
				id: true,
				authorId: true,
				allowComments: true,
				author: {
					select: { accessLevel: true }
				}
			}
		});

		if (!post) {
			throw error(404, 'Publicación no encontrada');
		}

		if (!post.allowComments) {
			throw error(403, 'Los comentarios están desactivados');
		}

		// Verificar comentario padre si existe
		if (parentId) {
			const parentComment = await prisma.comment.findFirst({
				where: {
					id: parentId,
					postId: postId,
					deletedAt: null
				}
			});
			if (!parentComment) {
				throw error(404, 'Comentario padre no encontrado');
			}
		}

		const comment = await prisma.comment.create({
			data: {
				authorId: user.userId,
				postId: postId,
				content: content.trim(),
				parentId: parentId || null
			},
			include: {
				author: {
					select: {
						id: true,
						username: true,
						displayName: true,
						avatarUrl: true
					}
				}
			}
		});

		// Notificar al autor del post
		if (
			post.authorId !== user.userId &&
			getVerifiedAccessLevel(post.author.accessLevel) >= 2
		) {
			broadcastNotification(post.authorId, {
				type: 'NEW_COMMENT',
				message: 'Nuevo comentario en tu publicación',
				data: { postId, commentId: comment.id }
			});
		}

		return json({ success: true, comment });
	}

	throw error(400, 'Acción no válida');
};

// DELETE /api/interactions/like?postId=xxx - Quitar like
export const DELETE: RequestHandler = async ({ url, locals }) => {
	const user = requireAuth(locals);
	requireVerified(user.accessLevel);

	const postId = url.searchParams.get('postId');
	const commentId = url.searchParams.get('commentId');

	if (postId) {
		await prisma.like.deleteMany({
			where: {
				userId: user.userId,
				postId: postId
			}
		});
		return json({ success: true, liked: false });
	}

	if (commentId) {
		// Soft delete de comentario
		await prisma.comment.updateMany({
			where: {
				id: commentId,
				authorId: user.userId
			},
			data: { deletedAt: new Date() }
		});
		return json({ success: true, deleted: true });
	}

	throw error(400, 'Se requiere postId o commentId');
};

// GET /api/interactions?postId=xxx&type=likes|comments
export const GET: RequestHandler = async ({ url, locals }) => {
	requireAuth(locals);

	const postId = url.searchParams.get('postId');
	const type = url.searchParams.get('type');
	const cursor = url.searchParams.get('cursor');
	const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 50);

	if (!postId || !type) {
		throw error(400, 'Se requiere postId y type');
	}

	if (type === 'likes') {
		const likes = await prisma.like.findMany({
			where: { postId },
			select: {
				id: true,
				createdAt: true,
				user: {
					select: {
						id: true,
						username: true,
						displayName: true,
						avatarUrl: true
					}
				}
			},
			orderBy: { createdAt: 'desc' },
			take: limit + 1,
			cursor: cursor ? { id: cursor } : undefined
		});

		const hasMore = likes.length > limit;
		const items = hasMore ? likes.slice(0, limit) : likes;
		const nextCursor = hasMore ? items[items.length - 1]?.id : null;

		return json({
			items: items.map(l => ({
				id: l.id,
				createdAt: l.createdAt,
				user: l.user
			})),
			nextCursor,
			hasMore
		});
	}

	if (type === 'comments') {
		const comments = await prisma.comment.findMany({
			where: {
				postId,
				deletedAt: null,
				parentId: null // Solo comentarios principales
			},
			select: {
				id: true,
				content: true,
				createdAt: true,
				author: {
					select: {
						id: true,
						username: true,
						displayName: true,
						avatarUrl: true
					}
				},
				_replies: {
					select: { id: true },
					where: { deletedAt: null }
				}
			},
			orderBy: { createdAt: 'desc' },
			take: limit + 1,
			cursor: cursor ? { id: cursor } : undefined
		});

		const hasMore = comments.length > limit;
		const items = hasMore ? comments.slice(0, limit) : comments;
		const nextCursor = hasMore ? items[items.length - 1]?.id : null;

		return json({
			items: items.map(c => ({
				id: c.id,
				content: c.content,
				createdAt: c.createdAt,
				author: c.author,
				replyCount: c._replies.length
			})),
			nextCursor,
			hasMore
		});
	}

	throw error(400, 'Tipo no válido');
};
