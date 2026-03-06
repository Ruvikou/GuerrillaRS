import { json, error } from '@sveltejs/kit';
import { requireAuth } from '$lib/server/permissions';
import { getFeed } from '$lib/server/feed';
import { trackTime } from '$lib/server/timeTracking';
import type { RequestHandler } from './$types';

// GET /api/feed - Obtener feed cronológico
export const GET: RequestHandler = async ({ url, locals }) => {
	const user = requireAuth(locals);

	const cursor = url.searchParams.get('cursor');
	const limit = parseInt(url.searchParams.get('limit') || '10');
	const postTypes = url.searchParams.getAll('postType') as any[];
	const tags = url.searchParams.getAll('tag');

	try {
		const result = await getFeed(
			user.userId,
			user.accessLevel,
			cursor ? JSON.parse(cursor) : undefined,
			limit,
			{ postTypes: postTypes.length > 0 ? postTypes : undefined, tags: tags.length > 0 ? tags : undefined }
		);

		return json(result);
	} catch (e: any) {
		if (e.message === 'TIME_LIMIT_EXCEEDED') {
			throw error(403, 'Has alcanzado tu límite diario de 30 minutos. Verifica tu cuenta para continuar.');
		}
		throw e;
	}
};

// POST /api/feed/track - Tracking explícito de tiempo (UNVERIFIED)
export const POST: RequestHandler = async ({ request, locals }) => {
	const user = requireAuth(locals);

	// Solo para UNVERIFIED
	if (user.accessLevel !== 'UNVERIFIED') {
		return json({ success: true });
	}

	const { seconds } = await request.json();

	if (typeof seconds !== 'number' || seconds < 0 || seconds > 300) {
		throw error(400, 'Segundos inválidos');
	}

	await trackTime(user.userId, seconds);

	return json({ success: true });
};
