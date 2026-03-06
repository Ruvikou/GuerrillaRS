import { json, error } from '@sveltejs/kit';
import { requireAuth, requireVerified } from '$lib/server/permissions';
import { searchUsers, searchPosts, type SearchFilters } from '$lib/server/search';
import type { RequestHandler } from './$types';

// GET /api/search?q=query&type=users|posts&filters=...
export const GET: RequestHandler = async ({ url, locals }) => {
	const user = requireAuth(locals);
	requireVerified(user.accessLevel);

	const query = url.searchParams.get('q');
	const type = url.searchParams.get('type') || 'posts';
	const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
	const limit = Math.min(20, parseInt(url.searchParams.get('limit') || '10'));

	if (!query || query.trim().length < 2) {
		return json({ items: [], total: 0, page, totalPages: 0 });
	}

	const offset = (page - 1) * limit;

	try {
		if (type === 'users') {
			const filters: SearchFilters = {};
			
			if (url.searchParams.get('verifiedOnly') === 'true') {
				filters.verifiedOnly = true;
			}

			const result = await searchUsers(query, { offset, limit, filters });
			
			return json({
				items: result.hits,
				total: result.total,
				page,
				totalPages: Math.ceil(result.total / limit)
			});
		}

		if (type === 'posts') {
			const filters: SearchFilters = {
				postTypes: url.searchParams.getAll('postType') as any[],
				tags: url.searchParams.getAll('tag'),
				dateFrom: url.searchParams.get('dateFrom') || undefined,
				dateTo: url.searchParams.get('dateTo') || undefined
			};

			const result = await searchPosts(query, user.userId, { offset, limit, filters });
			
			return json({
				items: result.hits,
				total: result.total,
				page,
				totalPages: Math.ceil(result.total / limit)
			});
		}

		throw error(400, 'Tipo de búsqueda no válido');
	} catch (e: any) {
		console.error('Search error:', e);
		throw error(500, 'Error en la búsqueda');
	}
};

// POST /api/search/index - Reindexar (solo admin)
export const POST: RequestHandler = async ({ request, locals }) => {
	const user = requireAuth(locals);
	
	// Solo admin puede reindexar
	if (user.accessLevel !== 'ADMIN') {
		throw error(403, 'No autorizado');
	}

	const { type } = await request.json();
	const { reindexUsers, reindexPosts } = await import('$lib/server/search');

	if (type === 'users') {
		await reindexUsers();
		return json({ success: true, message: 'Usuarios reindexados' });
	}

	if (type === 'posts') {
		await reindexPosts();
		return json({ success: true, message: 'Publicaciones reindexadas' });
	}

	throw error(400, 'Tipo no válido');
};
