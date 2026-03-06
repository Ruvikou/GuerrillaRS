import { json, error } from '@sveltejs/kit';
import sharp from 'sharp';
import { prisma } from '$lib/server/prisma';
import { requireAuth, requireVerified, requireOwnership } from '$lib/server/permissions';
import { indexPost, removePostFromIndex } from '$lib/server/search';
import type { RequestHandler } from './$types';
import { z } from 'zod';
import * as Minio from 'minio';
import { MINIO_ENDPOINT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY, MINIO_BUCKET_MEDIA, MINIO_USE_SSL } from '$env/static/private';

// Cliente MinIO
const minioClient = new Minio.Client({
	endPoint: MINIO_ENDPOINT.split(':')[0],
	port: parseInt(MINIO_ENDPOINT.split(':')[1]) || 9000,
	useSSL: MINIO_USE_SSL === 'true',
	accessKey: MINIO_ACCESS_KEY,
	secretKey: MINIO_SECRET_KEY
});

const createPostSchema = z.object({
	content: z.string().min(1).max(2000),
	postType: z.enum(['TEXT', 'PHOTO', 'VIDEO', 'POLL']).default('TEXT'),
	visibility: z.enum(['PUBLIC', 'FOLLOWERS', 'PRIVATE']).default('PUBLIC'),
	tags: z.array(z.string().max(50)).max(10).default([]),
	allowComments: z.boolean().default(true)
});

// POST /api/posts - Crear publicación
export const POST: RequestHandler = async ({ request, locals }) => {
	const user = requireAuth(locals);
	requireVerified(user.accessLevel);

	const formData = await request.formData();
	const content = formData.get('content') as string;
	const postType = (formData.get('postType') as any) || 'TEXT';
	const visibility = (formData.get('visibility') as any) || 'PUBLIC';
	const tagsJson = formData.get('tags') as string;
	const tags = tagsJson ? JSON.parse(tagsJson) : [];
	const allowComments = formData.get('allowComments') !== 'false';

	const validated = createPostSchema.parse({
		content,
		postType,
		visibility,
		tags,
		allowComments
	});

	// Procesar imágenes
	const images = formData.getAll('images') as File[];
	const mediaUrls: string[] = [];

	for (const image of images.slice(0, 4)) {
		if (!image.type.startsWith('image/')) continue;

		const buffer = Buffer.from(await image.arrayBuffer());

		// Generar thumbnail con Sharp
		const thumbnailBuffer = await sharp(buffer)
			.resize(800, null, { withoutEnlargement: true })
			.webp({ quality: 80 })
			.toBuffer();

		// Generar nombre único
		const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.webp`;

		// Subir a MinIO
		await minioClient.putObject(
			MINIO_BUCKET_MEDIA,
			filename,
			thumbnailBuffer,
			thumbnailBuffer.length,
			{ 'Content-Type': 'image/webp' }
		);

		// Construir URL pública
		const protocol = MINIO_USE_SSL === 'true' ? 'https' : 'http';
		const url = `${protocol}://${MINIO_ENDPOINT}/${MINIO_BUCKET_MEDIA}/${filename}`;
		mediaUrls.push(url);
	}

	// Crear post en BD
	const post = await prisma.post.create({
		data: {
			content: validated.content,
			postType: validated.postType,
			visibility: validated.visibility,
			tags: validated.tags,
			allowComments: validated.allowComments,
			mediaUrls,
			authorId: user.userId
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

	// Indexar en Meilisearch
	await indexPost(post.id);

	return json({
		success: true,
		post: {
			id: post.id,
			content: post.content,
			postType: post.postType,
			mediaUrls: post.mediaUrls,
			tags: post.tags,
			createdAt: post.createdAt.toISOString(),
			energyCount: 0,
			commentCount: 0,
			hasLiked: false,
			author: post.author
		}
	});
};

// GET /api/posts - Listar publicaciones
export const GET: RequestHandler = async ({ url, locals }) => {
	const user = requireAuth(locals);

	const username = url.searchParams.get('username');
	const cursor = url.searchParams.get('cursor');
	const limit = Math.min(parseInt(url.searchParams.get('limit') || '10'), 50);

	if (username) {
		// Posts de un usuario específico
		const { getUserPosts } = await import('$lib/server/feed');
		const result = await getUserPosts(
			user.userId,
			username,
			cursor ? JSON.parse(cursor) : undefined,
			limit
		);
		return json(result);
	}

	// Posts del usuario actual
	const posts = await prisma.post.findMany({
		where: {
			authorId: user.userId,
			deletedAt: null
		},
		orderBy: { createdAt: 'desc' },
		take: limit + 1,
		cursor: cursor ? { id: cursor } : undefined,
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
				where: { userId: user.userId },
				select: { id: true }
			}
		}
	});

	const hasMore = posts.length > limit;
	const items = hasMore ? posts.slice(0, limit) : posts;

	return json({
		posts: items.map(post => ({
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
		})),
		nextCursor: hasMore ? items[items.length - 1]?.id : null,
		hasMore
	});
};

// PATCH /api/posts - Editar publicación
export const PATCH: RequestHandler = async ({ request, locals }) => {
	const user = requireAuth(locals);
	requireVerified(user.accessLevel);

	const { id, content, tags, visibility, allowComments } = await request.json();

	if (!id) {
		throw error(400, 'ID de publicación requerido');
	}

	// Verificar ownership
	const existingPost = await prisma.post.findUnique({
		where: { id },
		select: { authorId: true }
	});

	if (!existingPost) {
		throw error(404, 'Publicación no encontrada');
	}

	requireOwnership(existingPost.authorId, user.userId, user.accessLevel);

	// Actualizar
	const updated = await prisma.post.update({
		where: { id },
		data: {
			content: content?.trim(),
			tags,
			visibility,
			allowComments,
			editedAt: new Date()
		},
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
				where: { userId: user.userId },
				select: { id: true }
			}
		}
	});

	// Reindexar
	await indexPost(updated.id);

	return json({
		success: true,
		post: {
			id: updated.id,
			content: updated.content,
			postType: updated.postType,
			mediaUrls: updated.mediaUrls,
			tags: updated.tags,
			createdAt: updated.createdAt.toISOString(),
			editedAt: updated.editedAt?.toISOString(),
			visibility: updated.visibility,
			energyCount: updated._count.likes,
			commentCount: updated._count.comments,
			hasLiked: updated.likes.length > 0,
			author: updated.author
		}
	});
};

// DELETE /api/posts - Eliminar publicación (soft delete)
export const DELETE: RequestHandler = async ({ url, locals }) => {
	const user = requireAuth(locals);
	requireVerified(user.accessLevel);

	const id = url.searchParams.get('id');
	if (!id) {
		throw error(400, 'ID de publicación requerido');
	}

	// Verificar ownership
	const existingPost = await prisma.post.findUnique({
		where: { id },
		select: { authorId: true }
	});

	if (!existingPost) {
		throw error(404, 'Publicación no encontrada');
	}

	requireOwnership(existingPost.authorId, user.userId, user.accessLevel);

	// Soft delete
	await prisma.post.update({
		where: { id },
		data: { deletedAt: new Date() }
	});

	// Eliminar del índice de búsqueda
	await removePostFromIndex(id);

	return json({ success: true });
};
