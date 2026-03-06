<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import PostCard from '$lib/components/post/PostCard.svelte';
	import { userStore } from '$lib/stores/user';
	
	interface Post {
		id: string;
		content: string;
		postType: 'TEXT' | 'PHOTO' | 'VIDEO' | 'POLL';
		mediaUrls: string[];
		tags: string[];
		createdAt: string;
		editedAt: string | null;
		energyCount: number;
		commentCount: number;
		hasLiked: boolean;
		visibility: string;
		author: {
			id: string;
			username: string;
			displayName: string;
			avatarUrl: string | null;
		};
	}
	
	interface FeedFilters {
		postTypes?: ('TEXT' | 'PHOTO' | 'VIDEO' | 'POLL')[];
		tags?: string[];
	}
	
	export let filters: FeedFilters = {};
	export let endpoint: string = '/api/feed';
	export let emptyMessage: string = 'No hay publicaciones para mostrar';
	
	let posts: Post[] = [];
	let loading = false;
	let hasMore = true;
	let nextCursor: string | null = null;
	let error: string | null = null;
	let observer: IntersectionObserver | null = null;
	let loadTrigger: HTMLElement;
	
	// Tracking de tiempo para usuarios UNVERIFIED
	let timeTrackingInterval: ReturnType<typeof setInterval> | null = null;
	let remainingSeconds = Infinity;
	let showTimeWarning = false;
	
	async function loadPosts(reset = false) {
		if (loading || (!hasMore && !reset)) return;
		
		loading = true;
		error = null;
		
		try {
			const params = new URLSearchParams();
			if (nextCursor && !reset) params.set('cursor', nextCursor);
			params.set('limit', '10');
			
			if (filters.postTypes?.length) {
				filters.postTypes.forEach(t => params.append('postType', t));
			}
			if (filters.tags?.length) {
				filters.tags.forEach(t => params.append('tag', t));
			}
			
			const response = await fetch(`${endpoint}?${params}`);
			
			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.message || 'Error cargando feed');
			}
			
			const data = await response.json();
			
			if (reset) {
				posts = data.posts;
			} else {
				posts = [...posts, ...data.posts];
			}
			
			hasMore = data.hasMore;
			nextCursor = data.nextCursor;
			
			// Tracking de tiempo para UNVERIFIED
			if (data.remainingSeconds !== undefined) {
				remainingSeconds = data.remainingSeconds;
				if (remainingSeconds < 300) { // < 5 minutos
					showTimeWarning = true;
				}
			}
			
			// Enviar tracking de tiempo
			if ($userStore?.accessLevel === 'UNVERIFIED') {
				trackTime(30); // ~30 segundos por carga
			}
			
		} catch (e: any) {
			error = e.message;
		} finally {
			loading = false;
		}
	}
	
	async function trackTime(seconds: number) {
		try {
			await fetch('/api/feed/track', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ seconds })
			});
		} catch (e) {
			// Silenciar errores de tracking
		}
	}
	
	function setupInfiniteScroll() {
		if (!browser || !loadTrigger) return;
		
		observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting && hasMore && !loading) {
					loadPosts();
				}
			},
			{ rootMargin: '100px' }
		);
		
		observer.observe(loadTrigger);
	}
	
	function handlePostDeleted(event: CustomEvent<string>) {
		const postId = event.detail;
		posts = posts.filter(p => p.id !== postId);
	}
	
	function handlePostUpdated(event: CustomEvent<Post>) {
		const updatedPost = event.detail;
		const index = posts.findIndex(p => p.id === updatedPost.id);
		if (index !== -1) {
			posts[index] = updatedPost;
			posts = [...posts]; // Trigger reactivity
		}
	}
	
	// Tracking de tiempo en la página
	function startTimeTracking() {
		if (!browser || $userStore?.accessLevel !== 'UNVERIFIED') return;
		
		timeTrackingInterval = setInterval(() => {
			remainingSeconds = Math.max(0, remainingSeconds - 10);
			trackTime(10);
			
			if (remainingSeconds < 300 && !showTimeWarning) {
				showTimeWarning = true;
			}
			
			if (remainingSeconds <= 0) {
				// Recargar para mostrar límite alcanzado
				window.location.reload();
			}
		}, 10000);
	}
	
	onMount(() => {
		loadPosts(true);
		setupInfiniteScroll();
		startTimeTracking();
	});
	
	onDestroy(() => {
		if (observer) observer.disconnect();
		if (timeTrackingInterval) clearInterval(timeTrackingInterval);
	});
	
	// Recargar cuando cambian los filtros
	$: if (filters) {
		nextCursor = null;
		hasMore = true;
		loadPosts(true);
	}
</script>

<!-- Warning de tiempo para UNVERIFIED -->
{#if showTimeWarning && remainingSeconds < 300}
	<div class="time-warning">
		<span class="warning-icon">⏱️</span>
		<p>
			Te quedan {Math.floor(remainingSeconds / 60)} minutos 
			{remainingSeconds % 60} segundos hoy
		</p>
		<a href="/verify" class="verify-link">Verificar cuenta →</a>
	</div>
{/if}

<!-- Feed -->
<div class="feed-container">
	{#if posts.length === 0 && !loading}
		<div class="empty-state">
			<div class="empty-icon">🌱</div>
			<p>{emptyMessage}</p>
		</div>
	{:else}
		<div class="posts-list">
			{#each posts as post (post.id)}
				<PostCard 
					{post} 
					on:deleted={handlePostDeleted}
					on:updated={handlePostUpdated}
				/>
			{/each}
		</div>
	{/if}
	
	<!-- Trigger para infinite scroll -->
	<div bind:this={loadTrigger} class="load-trigger">
		{#if loading}
			<div class="loading-indicator">
				<div class="spinner"></div>
				<p>Cargando más energía...</p>
			</div>
		{:else if !hasMore && posts.length > 0}
			<div class="end-message">
				<span>🌿</span>
				<p>Has llegado al final del jardín</p>
			</div>
		{/if}
	</div>
	
	{#if error}
		<div class="error-message">
			<p>{error}</p>
			<button on:click={() => loadPosts()}>Reintentar</button>
		</div>
	{/if}
</div>

<style>
	.feed-container {
		width: 100%;
		max-width: 600px;
		margin: 0 auto;
	}
	
	.time-warning {
		background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
		border: 1px solid #f59e0b;
		border-radius: 16px;
		padding: 1rem;
		margin-bottom: 1rem;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		animation: pulse 2s infinite;
	}
	
	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.8; }
	}
	
	.warning-icon {
		font-size: 1.5rem;
	}
	
	.time-warning p {
		flex: 1;
		margin: 0;
		color: #92400e;
		font-size: 0.875rem;
	}
	
	.verify-link {
		color: #92400e;
		font-weight: 600;
		text-decoration: underline;
		white-space: nowrap;
	}
	
	.posts-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	
	.empty-state {
		text-align: center;
		padding: 4rem 2rem;
		color: #6b7280;
	}
	
	.empty-icon {
		font-size: 4rem;
		margin-bottom: 1rem;
		opacity: 0.6;
	}
	
	.empty-state p {
		font-size: 1.125rem;
	}
	
	.load-trigger {
		padding: 2rem;
		text-align: center;
	}
	
	.loading-indicator {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		color: #059669;
	}
	
	.spinner {
		width: 32px;
		height: 32px;
		border: 3px solid #d1fae5;
		border-top-color: #059669;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}
	
	@keyframes spin {
		to { transform: rotate(360deg); }
	}
	
	.end-message {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		color: #6b7280;
		font-size: 0.875rem;
	}
	
	.end-message span {
		font-size: 1.5rem;
	}
	
	.error-message {
		text-align: center;
		padding: 2rem;
		color: #dc2626;
	}
	
	.error-message button {
		margin-top: 0.75rem;
		padding: 0.5rem 1.5rem;
		background: #dc2626;
		color: white;
		border: none;
		border-radius: 9999px;
		cursor: pointer;
		font-weight: 500;
	}
	
	.error-message button:hover {
		background: #b91c1c;
	}
</style>
