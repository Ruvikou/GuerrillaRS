// Guerrilla RS - Health Check Endpoint
// USO 1: Fundamentos Privacy-First

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/server/db';

/**
 * GET /health
 * Endpoint de health check para monitoreo
 * Verifica conectividad con base de datos
 */
export const GET: RequestHandler = async () => {
	const checks: Record<string, { status: 'ok' | 'error'; responseTime?: number; error?: string }> = {};
	
	// Check database
	const dbStart = Date.now();
	try {
		await prisma.$queryRaw`SELECT 1`;
		checks.database = {
			status: 'ok',
			responseTime: Date.now() - dbStart
		};
	} catch (error) {
		checks.database = {
			status: 'error',
			error: error instanceof Error ? error.message : 'Unknown error'
		};
	}
	
	// Overall status
	const allOk = Object.values(checks).every((check) => check.status === 'ok');
	
	return json(
		{
			status: allOk ? 'healthy' : 'unhealthy',
			timestamp: new Date().toISOString(),
			version: process.env.npm_package_version || '0.1.0',
			checks
		},
		{ status: allOk ? 200 : 503 }
	);
};
