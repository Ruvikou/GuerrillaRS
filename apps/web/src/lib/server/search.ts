import { MeiliSearch } from 'meilisearch';
import { MEILI_HOST, MEILI_API_KEY } from '$env/static/private';
import { prisma } from './prisma';

const client = new MeiliSearch({
	host: MEILI_HOST || 'http://meilisearch:7700',
	apiKey: MEILI_API_KEY
});

const usersIndex = client.index('users');
const postsIndex = client.index('posts');

export interface SearchFilters {
	verifiedOnly?: boolean;
	postTypes?: ('TEXT' | 'PHOTO' | 'VIDEO' | 'POLL')[];
	tags?: string[];
	dateFrom?: string;
	dateTo?: string;
}

export interface SearchOptions {
	offset?: number;
	limit?: number;
	filters?: SearchFilters;
}

export interface SearchResult<T> {
	hits: T[];
	total: number;
}

// Inicializar índices
export async function initSearchIndexes(): Promise<void> {
	// Configurar índice de usuarios
	try {
		await usersIndex.updateSettings({
			searchableAttributes: ['username', 'displayName', 'bio'],
			filterableAttributes: ['isVerified', 'createdAt'],
			sortableAttributes: ['createdAt', 'followersCount'],
			rankingRules: [
				'words',
				'typo',
				'proximity',
				'attribute',
				'sort',
				'exactness'
			]
		});
	} catch (e) {
		console.log('Users index may already exist');
	}

	// Configurar índice de posts
	try {
		await postsIndex.updateSettings({
			searchableAttributes: ['content', 'tags', 'authorName'],
			filterableAttributes: ['postType', 'tags', 'createdAt', 'authorId', 'visibility'],
			sortableAttributes: ['createdAt', 'energyCount'],
			rankingRules: [
				'words',
				'typo',
				'proximity',
				'attribute',
				'sort',
				'exactness'
			]
		});
	} catch (e) {
		console.log('Posts index may already exist');
	}
}

// Buscar usuarios
export async function searchUsers(
	query: string,
	options: SearchOptions = {}
): Promise<SearchResult<any>> {
	const { offset = 0, limit = 10, filters = {} } = options;

	const filterStrings: string[] = [];
	if (filters.verifiedOnly) {
		filterStrings.push('isVerified = true');
	}

	const result = await usersIndex.search(query, {
		offset,
		limit,
		filter: filterStrings.length > 0 ? filterStrings : undefined
	});

	return {
		hits: result.hits.map(hit => ({
			id: hit.id,
			username: hit.username,
			displayName: hit.displayName,
			avatarUrl: hit.avatarUrl,
			bio: hit.bio,
			isVerified: hit.isVerified,
			followersCount: hit.followersCount || 0
		})),
		total: result.estimatedTotalHits || 0
	};
}

// Buscar posts
export async function searchPosts(
	query: string,
	userId: string,
	options: SearchOptions = {}
): Promise<SearchResult<any>> {
	const { offset = 0, limit = 10, filters = {} } = options;

	const filterStrings: string[] = [
		`authorId != "${userId}" OR visibility = "PUBLIC"` // No mostrar privados de otros
	];

	if (filters.postTypes && filters.postTypes.length > 0) {
		const typeFilter = filters.postTypes.map(t => `postType = "${t}"`).join(' OR ');
		filterStrings.push(`(${typeFilter})`);
	}

	if (filters.tags && filters.tags.length > 0) {
		const tagFilter = filters.tags.map(t => `tags = "${t}"`).join(' OR ');
		filterStrings.push(`(${tagFilter})`);
	}

	if (filters.dateFrom) {
		filterStrings.push(`createdAt >= ${new Date(filters.dateFrom).getTime()}`);
	}

	if (filters.dateTo) {
		filterStrings.push(`createdAt <= ${new Date(filters.dateTo).getTime()}`);
	}

	const result = await postsIndex.search(query, {
		offset,
		limit,
		filter: filterStrings,
		sort: ['createdAt:desc']
	});

	return {
		hits: result.hits.map(hit => ({
			id: hit.id,
			content: hit.content,
			postType: hit.postType,
			mediaUrls: hit.mediaUrls || [],
			tags: hit.tags || [],
			createdAt: hit.createdAt,
			energyCount: hit.energyCount || 0,
			commentCount: hit.commentCount || 0,
			author: {
				id: hit.authorId,
				username: hit.authorUsername,
				displayName: hit.authorName,
				avatarUrl: hit.authorAvatar
			}
		})),
		total: result.estimatedTotalHits || 0
	};
}

// Indexar usuario
export async function indexUser(userId: string): Promise<void> {
	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: {
			id: true,
			username: true,
			displayName: true,
			bio: true,
			avatarUrl: true,
			verifiedAt: true,
			createdAt: true,
			_count: {
				select: { followers: true }
			}
		}
	});

	if (!user) return;

	await usersIndex.addDocuments([
		{
			id: user.id,
			username: user.username,
			displayName: user.displayName,
			bio: user.bio,
			avatarUrl: user.avatarUrl,
			isVerified: !!user.verifiedAt,
			createdAt: user.createdAt.getTime(),
			followersCount: user._count.followers
		}
	]);
}

// Indexar post
export async function indexPost(postId: string): Promise<void> {
	const post = await prisma.post.findUnique({
		where: { id: postId },
		select: {
			id: true,
			content: true,
			postType: true,
			mediaUrls: true,
			tags: true,
			visibility: true,
			createdAt: true,
			author: {
				select: {
					id: true,
					username: true,
					displayName: true,
					avatarUrl: true
				}
			},
			_count: {
				select: { likes: true, comments: true }
			}
		}
	});

	if (!post) return;

	await postsIndex.addDocuments([
		{
			id: post.id,
			content: post.content,
			postType: post.postType,
			mediaUrls: post.mediaUrls,
			tags: post.tags,
			visibility: post.visibility,
			createdAt: post.createdAt.getTime(),
			energyCount: post._count.likes,
			commentCount: post._count.comments,
			authorId: post.author.id,
			authorUsername: post.author.username,
			authorName: post.author.displayName,
			authorAvatar: post.author.avatarUrl
		}
	]);
}

// Eliminar post del índice
export async function removePostFromIndex(postId: string): Promise<void> {
	await postsIndex.deleteDocument(postId);
}

// Reindexar todos los usuarios
export async function reindexUsers(): Promise<void> {
	await usersIndex.deleteAllDocuments();

	const users = await prisma.user.findMany({
		select: {
			id: true,
			username: true,
			displayName: true,
			bio: true,
			avatarUrl: true,
			verifiedAt: true,
			createdAt: true,
			_count: {
				select: { followers: true }
			}
		}
	});

	const batchSize = 100;
	for (let i = 0; i < users.length; i += batchSize) {
		const batch = users.slice(i, i + batchSize);
		await usersIndex.addDocuments(
			batch.map(user => ({
				id: user.id,
				username: user.username,
				displayName: user.displayName,
				bio: user.bio,
				avatarUrl: user.avatarUrl,
				isVerified: !!user.verifiedAt,
				createdAt: user.createdAt.getTime(),
				followersCount: user._count.followers
			}))
		);
	}
}

// Reindexar todos los posts
export async function reindexPosts(): Promise<void> {
	await postsIndex.deleteAllDocuments();

	const posts = await prisma.post.findMany({
		where: { deletedAt: null },
		select: {
			id: true,
			content: true,
			postType: true,
			mediaUrls: true,
			tags: true,
			visibility: true,
			createdAt: true,
			author: {
				select: {
					id: true,
					username: true,
					displayName: true,
					avatarUrl: true
				}
			},
			_count: {
				select: { likes: true, comments: true }
			}
		}
	});

	const batchSize = 100;
	for (let i = 0; i < posts.length; i += batchSize) {
		const batch = posts.slice(i, i + batchSize);
		await postsIndex.addDocuments(
			batch.map(post => ({
				id: post.id,
				content: post.content,
				postType: post.postType,
				mediaUrls: post.mediaUrls,
				tags: post.tags,
				visibility: post.visibility,
				createdAt: post.createdAt.getTime(),
				energyCount: post._count.likes,
				commentCount: post._count.comments,
				authorId: post.author.id,
				authorUsername: post.author.username,
				authorName: post.author.displayName,
				authorAvatar: post.author.avatarUrl
			}))
		);
	}
}
