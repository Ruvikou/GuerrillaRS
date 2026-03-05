// Guerrilla RS - Tipos de SvelteKit
// USO 1: Fundamentos Privacy-First

/// <reference types="@sveltejs/kit" />

declare global {
	namespace App {
		// Interface para error pages
		interface Error {
			message: string;
			details?: string;
			code?: string;
		}

		// Interface para locals (disponible en hooks.server.ts y endpoints)
		interface Locals {
			user: import('$lib/types/auth').AuthenticatedUser | null;
			accessLevel: import('$lib/types/auth').AccessLevel;
			permissions: Record<import('$lib/types/auth').Permission, boolean>;
		}

		// Interface para page data
		interface PageData {
			user?: import('$lib/types/auth').AuthenticatedUser | null;
			accessLevel?: import('$lib/types/auth').AccessLevel;
		}

		// Interface para platform (Cloudflare, Vercel, etc.)
		interface Platform {
			env?: Record<string, string>;
			context?: {
				waitUntil(promise: Promise<unknown>): void;
			};
			caches?: CacheStorage;
		}
	}
}

// Tipos adicionales para módulos

declare module '*.svelte' {
	import type { ComponentType, SvelteComponent } from 'svelte';
	const component: ComponentType<SvelteComponent>;
	export default component;
}

declare module '$env/static/private' {
	export const DATABASE_URL: string;
	export const REDIS_URL: string;
	export const JWT_PRIVATE_KEY: string;
	export const JWT_PUBLIC_KEY: string;
	export const SESSION_SALT: string;
	export const EPHEMERAL_KEY: string;
	export const MINIO_ENDPOINT: string;
	export const MINIO_ACCESS_KEY: string;
	export const MINIO_SECRET_KEY: string;
}

declare module '$env/static/public' {
	export const PUBLIC_APP_URL: string;
}

// Tipos para face-api.js con canvas

declare module 'face-api.js' {
	export * from 'face-api.js/build/commonjs/index';
	
	export const env: {
		monkeyPatch: (patch: { Canvas: unknown; Image: unknown }) => void;
	};
	
	export function euclideanDistance(desc1: Float32Array, desc2: Float32Array): number;
}

export {};
