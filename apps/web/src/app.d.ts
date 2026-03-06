import type { AccessLevel } from '$lib/types/auth';

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		interface Error {
			message: string;
			code?: string;
		}

		interface Locals {
			user?: {
				userId: string;
				username: string;
				accessLevel: AccessLevel;
			};
		}

		interface PageData {
			user?: {
				id: string;
				username: string;
				displayName: string;
				avatarUrl: string | null;
				accessLevel: AccessLevel;
			};
		}

		// interface Platform {}
	}
}

export {};
