<script lang="ts">
	import { onMount } from 'svelte';
	import { userStore } from '$lib/stores/user';
	import Feed from '$lib/components/feed/Feed.svelte';
	import CreatePost from '$lib/components/post/CreatePost.svelte';
	
	let showCreatePost = false;
	let refreshFeed = 0;
	
	function handlePostCreated() {
		showCreatePost = false;
		refreshFeed++; // Trigger re-render del feed
	}
</script>

<svelte:head>
	<title>Jardín | Guerrilla RS</title>
</svelte:head>

<div class="feed-page">
	<!-- Crear post (solo para verificados) -->
	{#if $userStore?.accessLevel !== 'UNVERIFIED'}
		{#if showCreatePost}
			<CreatePost on:success={handlePostCreated} />
		{:else}
			<button class="create-prompt" on:click={() => showCreatePost = true}>
				<div class="avatar">
					{#if $userStore?.avatarUrl}
						<img src={$userStore.avatarUrl} alt={$userStore.displayName} />
					{:else}
						<span>{$userStore?.displayName?.charAt(0).toUpperCase()}</span>
					{/if}
				</div>
				<span class="prompt-text">¿Qué está creciendo en tu jardín?</span>
				<span class="create-icon">✨</span>
			</button>
		{/if}
	{/if}
	
	<!-- Feed -->
	{#key refreshFeed}
		<Feed />
	{/key}
</div>

<style>
	.feed-page {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	
	.create-prompt {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem;
		background: white;
		border-radius: 24px;
		border: none;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
		cursor: pointer;
		transition: all 0.2s;
		text-align: left;
	}
	
	.create-prompt:hover {
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
	}
	
	.avatar {
		width: 40px;
		height: 40px;
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
	
	.avatar span {
		font-weight: 600;
		color: #059669;
	}
	
	.prompt-text {
		flex: 1;
		color: #9ca3af;
		font-size: 0.9375rem;
	}
	
	.create-icon {
		font-size: 1.25rem;
		opacity: 0.6;
	}
</style>
