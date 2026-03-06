<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { userStore } from '$lib/stores/user';
	import Feed from '$lib/components/feed/Feed.svelte';
	import OrganicButton from '$lib/components/ui/OrganicButton.svelte';
	import { onMount } from 'svelte';
	
	interface Profile {
		id: string;
		username: string;
		displayName: string;
		bio: string;
		avatarUrl: string | null;
		bannerUrl: string | null;
		location: string | null;
		website: string | null;
		createdAt: string;
		verifiedAt: string | null;
		isFollowing: boolean;
		_followers: { id: string }[];
		_following: { id: string }[];
		_posts: { id: string }[];
		allowFollows: boolean;
	}
	
	let profile: Profile | null = null;
	let loading = true;
	let error: string | null = null;
	let activeTab: 'posts' | 'following' | 'followers' = 'posts';
	let isFollowingLoading = false;
	
	$: username = $page.params.username;
	$: isOwnProfile = $userStore?.username === username;
	$: canFollow = $userStore && !isOwnProfile && profile?.allowFollows;
	
	onMount(() => {
		loadProfile();
	});
	
	async function loadProfile() {
		loading = true;
		error = null;
		
		try {
			const response = await fetch(`/api/users/${username}`);
			
			if (!response.ok) {
				if (response.status === 404) {
					throw new Error('Usuario no encontrado');
				}
				throw new Error('Error cargando perfil');
			}
			
			profile = await response.json();
		} catch (e: any) {
			error = e.message;
		} finally {
			loading = false;
		}
	}
	
	async function toggleFollow() {
		if (!canFollow || isFollowingLoading) return;
		
		isFollowingLoading = true;
		
		try {
			const method = profile?.isFollowing ? 'DELETE' : 'POST';
			const response = await fetch('/api/follows', {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username })
			});
			
			if (response.ok) {
				if (profile) {
					profile.isFollowing = !profile.isFollowing;
					// Actualizar contador
					if (profile.isFollowing) {
						profile._followers = [...profile._followers, { id: 'new' }];
					} else {
						profile._followers = profile._followers.slice(0, -1);
					}
				}
			}
		} catch (e) {
			console.error('Error toggling follow:', e);
		} finally {
			isFollowingLoading = false;
		}
	}
	
	function formatJoinDate(date: string): string {
		const d = new Date(date);
		return `Se unió en ${d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`;
	}
</script>

<svelte:head>
	<title>{profile?.displayName || username} | Guerrilla RS</title>
</svelte:head>

{#if loading}
	<div class="loading-state">
		<div class="spinner"></div>
		<p>Cargando perfil...</p>
	</div>
{:else if error}
	<div class="error-state">
		<p>{error}</p>
		<OrganicButton on:click={loadProfile}>Reintentar</OrganicButton>
	</div>
{:else if profile}
	<div class="profile-page">
		<!-- Banner -->
		<div class="banner">
			{#if profile.bannerUrl}
				<img src={profile.bannerUrl} alt="" />
			{:else}
				<div class="banner-placeholder"></div>
			{/if}
		</div>
		
		<!-- Info -->
		<div class="profile-info">
			<div class="avatar-section">
				<div class="avatar">
					{#if profile.avatarUrl}
						<img src={profile.avatarUrl} alt={profile.displayName} />
					{:else}
						<span>{profile.displayName.charAt(0).toUpperCase()}</span>
					{/if}
				</div>
				
				{#if isOwnProfile}
					<a href="/settings/profile" class="edit-btn">
						Editar perfil
					</a>
				{:else if canFollow}
					<OrganicButton
						variant={profile.isFollowing ? 'ghost' : 'primary'}
						on:click={toggleFollow}
						loading={isFollowingLoading}
					>
						{profile.isFollowing ? 'Siguiendo' : 'Seguir'}
					</OrganicButton>
				{/if}
			</div>
			
			<div class="user-info">
				<h1 class="display-name">
					{profile.displayName}
					{#if profile.verifiedAt}
						<span class="verified-badge" title="Verificado">✓</span>
					{/if}
				</h1>
				<p class="username">@{profile.username}</p>
				
				{#if profile.bio}
					<p class="bio">{profile.bio}</p>
				{/if}
				
				<div class="meta-info">
					{#if profile.location}
						<span class="meta-item">📍 {profile.location}</span>
					{/if}
					{#if profile.website}
						<a 
							href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
							target="_blank"
							rel="noopener"
							class="meta-item link"
						>
							🔗 {profile.website.replace(/^https?:\/\//, '')}
						</a>
					{/if}
					<span class="meta-item">📅 {formatJoinDate(profile.createdAt)}</span>
				</div>
				
				<div class="stats">
					<button 
						class="stat"
						on:click={() => activeTab = 'following'}
						class:active={activeTab === 'following'}
					>
						<span class="stat-value">{profile._following.length}</span>
						<span class="stat-label">Siguiendo</span>
					</button>
					<button 
						class="stat"
						on:click={() => activeTab = 'followers'}
						class:active={activeTab === 'followers'}
					>
						<span class="stat-value">{profile._followers.length}</span>
						<span class="stat-label">Seguidores</span>
					</button>
					<div class="stat">
						<span class="stat-value">{profile._posts.length}</span>
						<span class="stat-label">Publicaciones</span>
					</div>
				</div>
			</div>
		</div>
		
		<!-- Tabs -->
		<div class="tabs">
			<button 
				class="tab"
				class:active={activeTab === 'posts'}
				on:click={() => activeTab = 'posts'}
			>
				Publicaciones
			</button>
			<button 
				class="tab"
				class:active={activeTab === 'following'}
				on:click={() => activeTab = 'following'}
			>
				Siguiendo
			</button>
			<button 
				class="tab"
				class:active={activeTab === 'followers'}
				on:click={() => activeTab = 'followers'}
			>
				Seguidores
			</button>
		</div>
		
		<!-- Content -->
		<div class="tab-content">
			{#if activeTab === 'posts'}
				<Feed endpoint="/api/posts?username={username}" emptyMessage="Aún no hay publicaciones" />
			{:else if activeTab === 'following'}
				<div class="users-list">
					{#each profile._following as follow}
						<div class="user-item">
							<!-- TODO: Mostrar info de usuario seguido -->
						</div>
					{/each}
				</div>
			{:else if activeTab === 'followers'}
				<div class="users-list">
					{#each profile._followers as follower}
						<div class="user-item">
							<!-- TODO: Mostrar info de seguidor -->
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.loading-state,
	.error-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 4rem 2rem;
		gap: 1rem;
		color: #6b7280;
	}
	
	.spinner {
		width: 40px;
		height: 40px;
		border: 3px solid #d1fae5;
		border-top-color: #059669;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}
	
	@keyframes spin {
		to { transform: rotate(360deg); }
	}
	
	.profile-page {
		background: white;
		border-radius: 24px;
		overflow: hidden;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
	}
	
	.banner {
		height: 150px;
		background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 50%, #6ee7b7 100%);
		overflow: hidden;
	}
	
	.banner img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	
	.banner-placeholder {
		width: 100%;
		height: 100%;
		background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 50%, #6ee7b7 100%);
	}
	
	.profile-info {
		padding: 0 1rem 1rem;
	}
	
	.avatar-section {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		margin-top: -50px;
		margin-bottom: 1rem;
	}
	
	.avatar {
		width: 100px;
		height: 100px;
		border-radius: 50%;
		overflow: hidden;
		background: white;
		border: 4px solid white;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 2.5rem;
		font-weight: 600;
		color: #059669;
	}
	
	.avatar img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	
	.edit-btn {
		padding: 0.5rem 1rem;
		border: 1px solid #e5e7eb;
		border-radius: 9999px;
		background: white;
		color: #374151;
		font-weight: 500;
		font-size: 0.875rem;
		text-decoration: none;
		transition: all 0.2s;
	}
	
	.edit-btn:hover {
		background: #f9fafb;
		border-color: #d1d5db;
	}
	
	.user-info {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	
	.display-name {
		font-size: 1.25rem;
		font-weight: 700;
		color: #111827;
		margin: 0;
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}
	
	.verified-badge {
		width: 18px;
		height: 18px;
		background: #059669;
		color: white;
		border-radius: 50%;
		font-size: 0.625rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.username {
		color: #6b7280;
		font-size: 0.9375rem;
		margin: 0;
	}
	
	.bio {
		color: #374151;
		line-height: 1.5;
		margin: 0.5rem 0 0;
	}
	
	.meta-info {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		margin-top: 0.5rem;
	}
	
	.meta-item {
		color: #6b7280;
		font-size: 0.875rem;
	}
	
	.meta-item.link {
		color: #059669;
		text-decoration: none;
	}
	
	.meta-item.link:hover {
		text-decoration: underline;
	}
	
	.stats {
		display: flex;
		gap: 1.5rem;
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid #f3f4f6;
	}
	
	.stat {
		display: flex;
		align-items: baseline;
		gap: 0.25rem;
		background: none;
		border: none;
		cursor: pointer;
		padding: 0;
		color: inherit;
	}
	
	.stat:hover .stat-label {
		text-decoration: underline;
	}
	
	.stat-value {
		font-weight: 700;
		color: #111827;
	}
	
	.stat-label {
		color: #6b7280;
		font-size: 0.875rem;
	}
	
	.tabs {
		display: flex;
		border-bottom: 1px solid #f3f4f6;
	}
	
	.tab {
		flex: 1;
		padding: 1rem;
		background: none;
		border: none;
		color: #6b7280;
		font-weight: 500;
		font-size: 0.9375rem;
		cursor: pointer;
		position: relative;
		transition: color 0.2s;
	}
	
	.tab:hover {
		color: #374151;
		background: #f9fafb;
	}
	
	.tab.active {
		color: #059669;
	}
	
	.tab.active::after {
		content: '';
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: 2px;
		background: #059669;
	}
	
	.tab-content {
		padding: 1rem;
	}
	
	.users-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
</style>
