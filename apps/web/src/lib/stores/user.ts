import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import type { AccessLevel } from '$lib/types/auth';

export interface User {
	id: string;
	username: string;
	displayName: string;
	email: string;
	avatarUrl: string | null;
	accessLevel: AccessLevel;
	verifiedAt: string | null;
	createdAt: string;
	token?: string;
	unreadNotifications?: number;
}

function createUserStore() {
	const { subscribe, set, update } = writable<User | null>(null);

	return {
		subscribe,
		set,
		update,
		logout: () => {
			if (browser) {
				localStorage.removeItem('token');
			}
			set(null);
		},
		initFromStorage: () => {
			if (!browser) return;
			
			const token = localStorage.getItem('token');
			if (token) {
				// Validar token y cargar usuario
				fetch('/api/auth/validate', {
					headers: { Authorization: `Bearer ${token}` }
				})
					.then(res => res.json())
					.then(data => {
						if (data.user) {
							set({ ...data.user, token });
						} else {
							localStorage.removeItem('token');
						}
					})
					.catch(() => {
						localStorage.removeItem('token');
					});
			}
		}
	};
}

export const userStore = createUserStore();

export const isLoading = writable(true);

// Derived stores
export const isAuthenticated = derived(
	userStore,
	$user => $user !== null
);

export const isVerified = derived(
	userStore,
	$user => $user !== null && $user.accessLevel !== 'UNVERIFIED' && $user.accessLevel !== 'PUBLIC'
);

export const canCreateContent = derived(
	userStore,
	$user => $user !== null && $user.accessLevel !== 'UNVERIFIED'
);

export const canInteract = derived(
	userStore,
	$user => $user !== null && $user.accessLevel !== 'UNVERIFIED'
);
