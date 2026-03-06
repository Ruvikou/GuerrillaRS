<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { userStore, isLoading } from '$lib/stores/user';
	import BottomNav from '$lib/components/navigation/BottomNav.svelte';
	import OrganicButton from '$lib/components/ui/OrganicButton.svelte';
	
	let showVerifyBanner = false;
	let ws: WebSocket | null = null;
	
	$: showVerifyBanner = $userStore?.accessLevel === 'UNVERIFIED';
	
	onMount(() => {
		// Conectar WebSocket para notificaciones
		if ($userStore?.token) {
			connectWebSocket();
		}
		
		return () => {
			ws?.close();
		};
	});
	
	function connectWebSocket() {
		const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/notifications?token=${$userStore?.token}`;
		
		ws = new WebSocket(wsUrl);
		
		ws.onopen = () => {
			console.log('WebSocket connected');
		};
		
		ws.onmessage = (event) => {
			try {
				const notification = JSON.parse(event.data);
				handleNotification(notification);
			} catch (e) {
				console.error('Error parsing notification:', e);
			}
		};
		
		ws.onclose = () => {
			// Reconectar después de 5 segundos
			setTimeout(connectWebSocket, 5000);
		};
		
		ws.onerror = (error) => {
			console.error('WebSocket error:', error);
		};
	}
	
	function handleNotification(notification: any) {
		switch (notification.type) {
			case 'NEW_FOLLOWER':
				// Mostrar toast o actualizar contador
				userStore.update(u => u ? { ...u, unreadNotifications: (u.unreadNotifications || 0) + 1 } : null);
				break;
			case 'NEW_ENERGY':
				userStore.update(u => u ? { ...u, unreadNotifications: (u.unreadNotifications || 0) + 1 } : null);
				break;
			case 'NEW_COMMENT':
				userStore.update(u => u ? { ...u, unreadNotifications: (u.unreadNotifications || 0) + 1 } : null);
				break;
		}
	}
</script>

{#if $isLoading}
	<div class="loading-screen">
		<div class="loading-spinner">
			<div class="leaf">🌿</div>
		</div>
		<p>Cargando tu jardín...</p>
	</div>
{:else if $userStore}
	<div class="app-layout">
		<!-- Banner de verificación para UNVERIFIED -->
		{#if showVerifyBanner}
			<div class="verify-banner">
				<div class="banner-content">
					<span class="banner-icon">🔒</span>
					<div class="banner-text">
						<p class="banner-title">Modo limitado activo</p>
						<p class="banner-subtitle">30 min/día • Sin interacciones • Verifica para desbloquear todo</p>
					</div>
				</div>
				<OrganicButton variant="primary" size="sm" on:click={() => goto('/verify')}>
					Verificar
				</OrganicButton>
			</div>
		{/if}
		
		<!-- Header desktop -->
		<header class="desktop-header">
			<a href="/feed" class="logo">
				<span class="logo-icon">🌿</span>
				<span class="logo-text">Guerrilla RS</span>
			</a>
			
			<nav class="desktop-nav">
				<a href="/feed" class="nav-link">Jardín</a>
				<a href="/explore" class="nav-link">Explorar</a>
				<a href="/notifications" class="nav-link">
					Notificaciones
					{#if $userStore.unreadNotifications}
						<span class="nav-badge">{$userStore.unreadNotifications}</span>
					{/if}
				</a>
			</nav>
			
			<div class="header-actions">
				<a href="/create" class="create-btn">
					<span>✨</span> Crear
				</a>
				<a href="/profile/{$userStore.username}" class="user-avatar">
					{#if $userStore.avatarUrl}
						<img src={$userStore.avatarUrl} alt={$userStore.displayName} />
					{:else}
						<span>{$userStore.displayName.charAt(0).toUpperCase()}</span>
					{/if}
				</a>
			</div>
		</header>
		
		<!-- Main content -->
		<main class:has-banner={showVerifyBanner}>
			<slot />
		</main>
		
		<!-- Bottom navigation (mobile) -->
		<BottomNav />
	</div>
{:else}
	<!-- Redirigir a login si no hay usuario -->
	{#if typeof window !== 'undefined'}
		{goto('/login'), ''}
	{/if}
{/if}

<style>
	.loading-screen {
		position: fixed;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
	}
	
	.loading-spinner {
		font-size: 3rem;
		animation: bounce 1s infinite;
	}
	
	@keyframes bounce {
		0%, 100% { transform: translateY(0); }
		50% { transform: translateY(-10px); }
	}
	
	.loading-screen p {
		color: #059669;
		font-weight: 500;
	}
	
	.app-layout {
		min-height: 100vh;
		padding-bottom: 64px; /* Espacio para bottom nav */
	}
	
	/* Banner de verificación */
	.verify-banner {
		position: sticky;
		top: 0;
		background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
		border-bottom: 1px solid #f59e0b;
		padding: 0.75rem 1rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		z-index: 50;
	}
	
	.banner-content {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex: 1;
	}
	
	.banner-icon {
		font-size: 1.5rem;
	}
	
	.banner-text {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}
	
	.banner-title {
		font-weight: 600;
		color: #92400e;
		font-size: 0.875rem;
		margin: 0;
	}
	
	.banner-subtitle {
		color: #a16207;
		font-size: 0.75rem;
		margin: 0;
	}
	
	/* Header desktop */
	.desktop-header {
		display: none;
		position: sticky;
		top: 0;
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(12px);
		border-bottom: 1px solid rgba(0, 0, 0, 0.05);
		padding: 0.75rem 1.5rem;
		align-items: center;
		justify-content: space-between;
		z-index: 40;
	}
	
	.logo {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		text-decoration: none;
		color: inherit;
	}
	
	.logo-icon {
		font-size: 1.75rem;
	}
	
	.logo-text {
		font-size: 1.25rem;
		font-weight: 700;
		background: linear-gradient(135deg, #059669 0%, #10b981 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}
	
	.desktop-nav {
		display: flex;
		gap: 2rem;
	}
	
	.nav-link {
		color: #6b7280;
		text-decoration: none;
		font-weight: 500;
		font-size: 0.9375rem;
		position: relative;
		padding: 0.5rem 0;
	}
	
	.nav-link:hover {
		color: #059669;
	}
	
	.nav-badge {
		position: absolute;
		top: 0;
		right: -12px;
		min-width: 18px;
		height: 18px;
		padding: 0 5px;
		background: #ef4444;
		color: white;
		font-size: 0.6875rem;
		font-weight: 600;
		border-radius: 9999px;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.header-actions {
		display: flex;
		align-items: center;
		gap: 1rem;
	}
	
	.create-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: linear-gradient(135deg, #059669 0%, #10b981 100%);
		color: white;
		text-decoration: none;
		border-radius: 9999px;
		font-weight: 500;
		font-size: 0.875rem;
		transition: transform 0.2s, box-shadow 0.2s;
	}
	
	.create-btn:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);
	}
	
	.user-avatar {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		overflow: hidden;
		background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
		display: flex;
		align-items: center;
		justify-content: center;
		color: #059669;
		font-weight: 600;
		text-decoration: none;
	}
	
	.user-avatar img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	
	main {
		max-width: 600px;
		margin: 0 auto;
		padding: 1rem;
	}
	
	main.has-banner {
		padding-top: 0.5rem;
	}
	
	/* Desktop styles */
	@media (min-width: 768px) {
		.app-layout {
			padding-bottom: 0;
		}
		
		.desktop-header {
			display: flex;
		}
		
		.verify-banner {
			position: relative;
		}
		
		main {
			padding: 1.5rem;
			margin-left: auto;
			margin-right: auto;
		}
	}
</style>
