// Guerrilla RS - Prisma Client Singleton
// USO 1: Fundamentos Privacy-First

import { PrismaClient } from '@prisma/client';

// Singleton pattern para PrismaClient en desarrollo
// Evita múltiples instancias en hot-reload

declare global {
	// eslint-disable-next-line no-var
	var __prisma: PrismaClient | undefined;
}

export const prisma = globalThis.__prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
	globalThis.__prisma = prisma;
}

// Middleware para logging de queries en desarrollo
if (process.env.NODE_ENV === 'development') {
	prisma.$on('query', (e) => {
		console.log('Query: ' + e.query);
		console.log('Params: ' + e.params);
		console.log('Duration: ' + e.duration + 'ms');
	});
}
