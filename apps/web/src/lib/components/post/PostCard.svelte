<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { goto } from '$app/navigation';
	import { userStore } from '$lib/stores/user';
	import { formatRelativeTime } from '$lib/utils/time';
	import OrganicButton from '$lib/components/ui/OrganicButton.svelte';
	
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
	
	export let post: Post;
	
	const dispatch = createEventDispatcher<{
		deleted: string;
		updated: Post;
	});
	
	let isLiking = false;
	let showOptions = false;
	let showDeleteConfirm = false;
	let imageModalOpen = false;
	let selectedImageIndex = 0;
	
	$: isAuthor = $userStore?.id === post.author.id;
	$: canInteract = $userStore && $userStore.accessLevel !== 'UNVERIFIED';
	
	async function toggleLike() {
		if (!canInteract || isLiking) return;
		
		isLiking = true;
		
		try {
			const method = post.hasLiked ? 'DELETE' : 'POST';
			const response = await fetch(`/api/interactions?action=like`, {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ postId: post.id })
			});
			
			if (response.ok) {
				post.hasLiked = !post.hasLiked;
				post.energyCount += post.hasLiked ? 1 : -1;
			}
		} catch (e) {
			console.error('Error toggling like:', e);
		} finally {
			isLiking = false;
		}
	}
	
	async function deletePost() {
		try {
			const response = await fetch(`/api/posts?id=${post.id}`, {
				method: 'DELETE'
			});
			
			if (response.ok) {
				dispatch('deleted', post.id);
			}
		} catch (e) {
			console.error('Error deleting post:', e);
		}
		showDeleteConfirm = false;
	}
	
	function navigateToProfile() {
		goto(`/profile/${post.author.username}`);
	}
	
	function navigateToPost() {
		goto(`/post/${post.id}`);
	}
	
	function openImageModal(index: number) {
		selectedImageIndex = index;
		imageModalOpen = true;
	}
	
	function closeImageModal() {
		imageModalOpen = false;
	}
	
	function navigateImages(direction: number) {
		selectedImageIndex = (selectedImageIndex + direction + post.mediaUrls.length) % post.mediaUrls.length;
	}
	
	// Cerrar modal con Escape
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && imageModalOpen) {
			closeImageModal();
		}
		if (event.key === 'ArrowLeft' && imageModalOpen) {
			navigateImages(-1);
		}
		if (event.key === 'ArrowRight' && imageModalOpen) {
			navigateImages(1);
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

<article class="post-card" data-post-id={post.id}>
	<!-- Header -->
	<header class="post-header">
		<button class="author-info" on:click={navigateToProfile}>
			<div class="avatar">
				{#if post.author.avatarUrl}
					<img src={post.author.avatarUrl} alt={post.author.displayName} />
				{:else}
					<span class="avatar-placeholder">
						{post.author.displayName.charAt(0).toUpperCase()}
					</span>
				{/if}
			</div>
			<div class="author-meta">
				<span class="display-name">{post.author.displayName}</span>
				<span class="username">@{post.author.username}</span>
				<span class="timestamp" title={new Date(post.createdAt).toLocaleString()}>
					{formatRelativeTime(post.createdAt)}
					{#if post.editedAt}
						<span class="edited">(editado)</span>
					{/if}
				</span>
			</div>
		</button>
		
		{#if isAuthor}
			<div class="options-menu">
				<button 
					class="options-btn"
					on:click={() => showOptions = !showOptions}
					aria-label="Opciones"
				>
					<svg viewBox="0 0 24 24" fill="currentColor">
						<circle cx="12" cy="6" r="2"/>
						<circle cx="12" cy="12" r="2"/>
						<circle cx="12" cy="18" r="2"/>
					</svg>
				</button>
				
				{#if showOptions}
					<div class="options-dropdown">
						<a href="/post/{post.id}/edit" class="option-item">
							<span>✏️</span> Editar
						</a>
						<button 
							class="option-item delete"
							on:click={() => { showOptions = false; showDeleteConfirm = true; }}
						>
							<span>🗑️</span> Eliminar
						</button>
					</div>
				{/if}
			</div>
		{/if}
	</header>
	
	<!-- Content -->
	<div class="post-content" on:click={navigateToPost}>
		<p class="content-text">{post.content}</p>
		
		{#if post.mediaUrls.length > 0}
			<div class="media-grid" class:single={post.mediaUrls.length === 1}>
				{#each post.mediaUrls as url, i}
					<button 
						class="media-item"
						on:click|stopPropagation={() => openImageModal(i)}
					>
						<img src={url} alt="" loading="lazy" />
					</button>
				{/each}
			</div>
		{/if}
		
		{#if post.tags.length > 0}
			<div class="tags">
				{#each post.tags as tag}
					<a href="/explore?tag={encodeURIComponent(tag)}" class="tag">
						#{tag}
					</a>
				{/each}
			</div>
		{/if}
	</div>
	
	<!-- Actions -->
	<footer class="post-actions">
		<button 
			class="action-btn energy"
			class:active={post.hasLiked}
			disabled={!canInteract || isLiking}
			on:click|stopPropagation={toggleLike}
			aria-label={post.hasLiked ? 'Retirar energía' : 'Compartir energía'}
		>
			<span class="energy-icon" class:pulse={isLiking}>
				{#if post.hasLiked}
					☀️
				{:else}
				　🌤️
				{/if}
			</span>
			<span class="count">{post.energyCount}</span>
		</button>
		
		<button 
			class="action-btn comments"
			on:click|stopPropagation={navigateToPost}
			aria-label="Comentarios"
		>
			<span class="comment-icon">💬</span>
			<span class="count">{post.commentCount}</span>
		</button>
		
		<button 
			class="action-btn share"
			on:click|stopPropagation={() => {
				navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
			}}
			aria-label="Compartir"
		>
			<span>🔗</span>
		</button>
	</footer>
</article>

<!-- Modal de imagen -->
{#if imageModalOpen}
	<div class="image-modal" on:click={closeImageModal}>
		<button class="modal-close" on:click={closeImageModal}>✕</button>
		
		{#if post.mediaUrls.length > 1}
			<button 
				class="nav-btn prev"
				on:click|stopPropagation={() => navigateImages(-1)}
			>
				‹
			</button>
			<button 
				class="nav-btn next"
				on:click|stopPropagation={() => navigateImages(1)}
			>
				›
			</button>
		{/if}
		
		<img 
			src={post.mediaUrls[selectedImageIndex]} 
			alt="" 
			on:click|stopPropagation
		/>
		
		{#if post.mediaUrls.length > 1}
			<div class="image-dots">
				{#each post.mediaUrls as _, i}
					<button 
						class="dot"
						class:active={i === selectedImageIndex}
						on:click|stopPropagation={() => selectedImageIndex = i}
					/>
				{/each}
			</div>
		{/if}
	</div>
{/if}

<!-- Confirmación de eliminación -->
{#if showDeleteConfirm}
	<div class="modal-overlay" on:click={() => showDeleteConfirm = false}>
		<div class="confirm-dialog" on:click|stopPropagation>
			<h3>¿Eliminar publicación?</h3>
			<p>Esta acción no se puede deshacer.</p>
			<div class="confirm-actions">
				<OrganicButton variant="ghost" on:click={() => showDeleteConfirm = false}>
					Cancelar
				</OrganicButton>
				<OrganicButton variant="danger" on:click={deletePost}>
					Eliminar
				</OrganicButton>
			</div>
		</div>
	</div>
{/if}

<style>
	.post-card {
		background: white;
		border-radius: 24px;
		padding: 1rem;
		box-shadow: 
			0 1px 3px rgba(0, 0, 0, 0.05),
			0 4px 12px rgba(5, 150, 105, 0.08);
		transition: transform 0.2s ease, box-shadow 0.2s ease;
	}
	
	.post-card:hover {
		transform: translateY(-2px);
		box-shadow: 
			0 4px 12px rgba(0, 0, 0, 0.08),
			0 8px 24px rgba(5, 150, 105, 0.12);
	}
	
	.post-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.75rem;
	}
	
	.author-info {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		background: none;
		border: none;
		cursor: pointer;
		text-align: left;
		padding: 0;
	}
	
	.avatar {
		width: 44px;
		height: 44px;
		border-radius: 50%;
		overflow: hidden;
		background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}
	
	.avatar img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	
	.avatar-placeholder {
		font-size: 1.25rem;
		font-weight: 600;
		color: #059669;
	}
	
	.author-meta {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}
	
	.display-name {
		font-weight: 600;
		color: #111827;
		font-size: 0.9375rem;
	}
	
	.username {
		color: #6b7280;
		font-size: 0.8125rem;
	}
	
	.timestamp {
		color: #9ca3af;
		font-size: 0.75rem;
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}
	
	.edited {
		font-style: italic;
	}
	
	.options-menu {
		position: relative;
	}
	
	.options-btn {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		border: none;
		background: transparent;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #6b7280;
		transition: background 0.2s;
	}
	
	.options-btn:hover {
		background: #f3f4f6;
	}
	
	.options-btn svg {
		width: 18px;
		height: 18px;
	}
	
	.options-dropdown {
		position: absolute;
		top: 100%;
		right: 0;
		background: white;
		border-radius: 12px;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
		padding: 0.5rem;
		min-width: 150px;
		z-index: 10;
	}
	
	.option-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		border-radius: 8px;
		color: #374151;
		font-size: 0.875rem;
		text-decoration: none;
		background: none;
		border: none;
		cursor: pointer;
		width: 100%;
		text-align: left;
	}
	
	.option-item:hover {
		background: #f3f4f6;
	}
	
	.option-item.delete {
		color: #dc2626;
	}
	
	.post-content {
		cursor: pointer;
	}
	
	.content-text {
		margin: 0 0 0.75rem;
		color: #1f2937;
		line-height: 1.6;
		white-space: pre-wrap;
		word-break: break-word;
	}
	
	.media-grid {
		display: grid;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
		border-radius: 16px;
		overflow: hidden;
	}
	
	.media-grid.single {
		grid-template-columns: 1fr;
	}
	
	.media-grid:not(.single) {
		grid-template-columns: repeat(2, 1fr);
	}
	
	.media-item {
		aspect-ratio: 1;
		overflow: hidden;
		border: none;
		padding: 0;
		cursor: pointer;
		background: #f3f4f6;
	}
	
	.media-item img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.3s ease;
	}
	
	.media-item:hover img {
		transform: scale(1.05);
	}
	
	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
	}
	
	.tag {
		color: #059669;
		font-size: 0.8125rem;
		text-decoration: none;
		font-weight: 500;
	}
	
	.tag:hover {
		text-decoration: underline;
	}
	
	.post-actions {
		display: flex;
		align-items: center;
		gap: 1.5rem;
		padding-top: 0.75rem;
		border-top: 1px solid #f3f4f6;
	}
	
	.action-btn {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		background: none;
		border: none;
		color: #6b7280;
		font-size: 0.875rem;
		cursor: pointer;
		padding: 0.375rem 0.5rem;
		border-radius: 9999px;
		transition: all 0.2s;
	}
	
	.action-btn:hover:not(:disabled) {
		background: #f3f4f6;
	}
	
	.action-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	
	.action-btn.energy.active {
		color: #ea580c;
	}
	
	.action-btn.energy.active .energy-icon {
		filter: drop-shadow(0 0 8px rgba(234, 88, 12, 0.5));
	}
	
	.energy-icon {
		font-size: 1.25rem;
		transition: transform 0.2s;
	}
	
	.energy-icon.pulse {
		animation: energyPulse 0.3s ease;
	}
	
	@keyframes energyPulse {
		0%, 100% { transform: scale(1); }
		50% { transform: scale(1.3); }
	}
	
	.count {
		font-weight: 500;
		min-width: 1.5ch;
	}
	
	/* Modal de imagen */
	.image-modal {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.95);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 2rem;
	}
	
	.image-modal img {
		max-width: 90%;
		max-height: 90%;
		object-fit: contain;
		border-radius: 8px;
	}
	
	.modal-close {
		position: absolute;
		top: 1rem;
		right: 1rem;
		width: 44px;
		height: 44px;
		border-radius: 50%;
		border: none;
		background: rgba(255, 255, 255, 0.1);
		color: white;
		font-size: 1.5rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.nav-btn {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		width: 48px;
		height: 48px;
		border-radius: 50%;
		border: none;
		background: rgba(255, 255, 255, 0.1);
		color: white;
		font-size: 2rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.nav-btn.prev { left: 1rem; }
	.nav-btn.next { right: 1rem; }
	
	.image-dots {
		position: absolute;
		bottom: 2rem;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		gap: 0.5rem;
	}
	
	.dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		border: none;
		background: rgba(255, 255, 255, 0.4);
		cursor: pointer;
	}
	
	.dot.active {
		background: white;
	}
	
	/* Modal de confirmación */
	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1rem;
	}
	
	.confirm-dialog {
		background: white;
		border-radius: 20px;
		padding: 1.5rem;
		max-width: 320px;
		width: 100%;
		text-align: center;
	}
	
	.confirm-dialog h3 {
		margin: 0 0 0.5rem;
		color: #111827;
	}
	
	.confirm-dialog p {
		color: #6b7280;
		margin-bottom: 1.5rem;
	}
	
	.confirm-actions {
		display: flex;
		gap: 0.75rem;
		justify-content: center;
	}
</style>
