import { prisma } from './prisma';
import { checkTimeLimit } from './timeTracking';
import type { AccessLevel } from '$lib/types/auth';

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

export interface FeedCursor {
	createdAt: string;
	id: string;
}

export interface FeedFilters {
	postTypes?: ('TEXT' | 'PHOTO' | 'VIDEO' | 'POLL')[];
	tags?: string[];
}

export interface FeedResult {
	posts: any[];
	nextCursor: string | null;
	hasMore: boolean;
	remainingSeconds?: number;
}

/**
 * Obtiene el feed cronológico puro de un usuario
 * SIN ALGORITMOS - orden estrictamente cronológico
 */
export async function getFeed(
	userId: string,
	accessLevel: AccessLevel,
	cursor?: FeedCursor,
	limit: number = DEFAULT_LIMIT,
	filters?: FeedFilters
): Promise<FeedResult> {
	// Verificar límite de tiempo para UNVERIFIED
	let remainingSeconds: number | undefined;
	if (accessLevel === 'UNVERIFIED') {
		const timeStatus = await checkTimeLimit(userId);
		if (!timeStatus.allowed) {
			return {
				posts: [],
				nextCursor: null,
				hasMore: false,
				remainingSeconds: 0
			};
		}
		remainingSeconds = timeStatus.remainingSeconds;
	}

	const take = Math.min(limit, MAX_LIMIT);

	// Construir where clause
	const where: any = {
		deletedAt: null,
		// Posts públicos o de seguidos
		OR: [
			{ visibility: 'PUBLIC' },
			{
				visibility: 'FOLLOWERS',
				author: {
					followers: {
						some: { followerId: userId }
					}
				}
			}
		]
	};

	// Aplicar filtros
	if (filters?.postTypes?.length) {
		where.postType = { in: filters.postTypes };
	}

	if (filters?.tags?.length) {
		where.tags = { hasSome: filters.tags };
	}

	// Cursor-based pagination
	if (cursor) {
		where.OR = [
			{
				createdAt: { lt: new Date(cursor.createdAt) }
			},
			{
				createdAt: new Date(cursor.createdAt),
				id: { lt: cursor.id }
			}
		];
	}

	// Obtener posts - ORDEN CRONOLÓGICO PURO (sin algoritmos)
	const posts = await prisma.post.findMany({
		where,
		orderBy: [
			{ createdAt: 'desc' },
			{ id: 'desc' }
		],
		take: take + 1, // +1 para detectar si hay más
		include: {
			author: {
				select: {
					id: true,
					username: true,
					displayName: true,
					avatarUrl: true
				}
			},
			_count: {
				select: {
					likes: true,
					comments: true
				}
			},
			likes: {
				where: { userId },
				select: { id: true }
			}
		}
	});

	const hasMore = posts.length > take;
	const items = hasMore ? posts.slice(0, take) : posts;

	// Mapear resultados
	const mappedPosts = items.map(post => ({
		id: post.id,
		content: post.content,
		postType: post.postType,
		mediaUrls: post.mediaUrls,
		tags: post.tags,
		createdAt: post.createdAt.toISOString(),
		editedAt: post.editedAt?.toISOString() || null,
		visibility: post.visibility,
		energyCount: post._count.likes,
		commentCount: post._count.comments,
		hasLiked: post.likes.length > 0,
		author: post.author
	}));

	// Generar next cursor
	const nextCursor = hasMore && items.length > 0
		? {
				createdAt: items[items.length - 1].createdAt.toISOString(),
				id: items[items.length - 1].id
			}
		: null;

	return {
		posts: mappedPosts,
		nextCursor: nextCursor ? JSON.stringify(nextCursor) : null,
		hasMore,
		remainingSeconds
	};
}

/**
 * Obtiene posts de un usuario específico
 */
export async function getUserPosts(
	userId: string,
	username: string,
	cursor?: FeedCursor,
	limit: number = DEFAULT_LIMIT
): Promise<FeedResult> {
	const take = Math.min(limit, MAX_LIMIT);

	// Obtener el usuario objetivo
	const targetUser = await prisma.user.findUnique({
		where: { username: username.toLowerCase() },
		select: { id: true }
	});

	if (!targetUser) {
		return { posts: [], nextCursor: null, hasMore: false };
	}

	const where: any = {
		authorId: targetUser.id,
		deletedAt: null
	};

	// Si no es el propio usuario, solo mostrar públicos
	if (targetUser.id !== userId) {
		where.visibility = 'PUBLIC';
	}

	// Cursor pagination
	if (cursor) {
		where.OR = [
			{
				createdAt: { lt: new Date(cursor.createdAt) }
			},
			{
				createdAt: new Date(cursor.createdAt),
				id: { lt: cursor.id }
			}
		];
	}

	const posts = await prisma.post.findMany({
		where,
		orderBy: [
			{ createdAt: 'desc' },
			{ id: 'desc' }
		],
		take: take + 1,
		include: {
			author: {
				select: {
					id: true,
					username: true,
					displayName: true,
					avatarUrl: true
				}
			},
			_count: {
				select: {
					likes: true,
					comments: true
				}
			},
			likes: {
				where: { userId },
				select: { id: true }
			}
		}
	});

	const hasMore = posts.length > take;
	const items = hasMore ? posts.slice(0, take) : posts;

	const mappedPosts = items.map(post => ({
		id: post.id,
		content: post.content,
		postType: post.postType,
		mediaUrls: post.mediaUrls,
		tags: post.tags,
		createdAt: post.createdAt.toISOString(),
		editedAt: post.editedAt?.toISOString() || null,
		visibility: post.visibility,
		energyCount: post._count.likes,
		commentCount: post._count.comments,
		hasLiked: post.likes.length > 0,
		author: post.author
	}));

	const nextCursor = hasMore && items.length > 0
		? {
				createdAt: items[items.length - 1].createdAt.toISOString(),
				id: items[items.length - 1].id
			}
		: null;

	return {
		posts: mappedPosts,
		nextCursor: nextCursor ? JSON.stringify(nextCursor) : null,
		hasMore
	};
}
