<script lang="ts">
	import { page } from '$app/stores';
	import { userStore } from '$lib/stores/user';
	
	$: currentPath = $page.url.pathname;
	
	const navItems = [
		{ path: '/feed', label: 'Jardín', icon: '🌱' },
		{ path: '/explore', label: 'Explorar', icon: '🔍' },
		{ path: '/create', label: 'Crear', icon: '✨', highlight: true },
		{ path: '/notifications', label: 'Notis', icon: '🔔' },
		{ path: '/profile', label: 'Perfil', icon: '👤' },
	];
	
	$: notificationCount = $userStore?.unreadNotifications || 0;
</script>

<nav class="bottom-nav">
	{#each navItems as item}
		<a 
			href={item.path}
			class="nav-item"
			class:active={currentPath.startsWith(item.path)}
			class:highlight={item.highlight}
		>
			<span class="icon">
				{item.icon}
				{#if item.path === '/notifications' && notificationCount > 0}
					<span class="badge">{Math.min(notificationCount, 99)}</span>
				{/if}
			</span>
			<span class="label">{item.label}</span>
		</a>
	{/each}
</nav>

<style>
	.bottom-nav {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		height: 64px;
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(12px);
		border-top: 1px solid rgba(0, 0, 0, 0.05);
		display: flex;
		justify-content: space-around;
		align-items: center;
		padding: 0 0.5rem;
		padding-bottom: env(safe-area-inset-bottom, 0);
		z-index: 100;
	}
	
	.nav-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.25rem;
		padding: 0.5rem;
		color: #6b7280;
		text-decoration: none;
		transition: color 0.2s;
		position: relative;
		flex: 1;
		max-width: 80px;
	}
	
	.nav-item.active {
		color: #059669;
	}
	
	.nav-item.highlight {
		position: relative;
		top: -12px;
	}
	
	.nav-item.highlight .icon {
		width: 52px;
		height: 52px;
		background: linear-gradient(135deg, #059669 0%, #10b981 100%);
		color: white;
		border-radius: 50%;
		box-shadow: 0 4px 12px rgba(5, 150, 105, 0.4);
		font-size: 1.5rem;
	}
	
	.icon {
		position: relative;
		width: 28px;
		height: 28px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.25rem;
		transition: transform 0.2s;
	}
	
	.nav-item:hover .icon {
		transform: scale(1.1);
	}
	
	.label {
		font-size: 0.6875rem;
		font-weight: 500;
	}
	
	.badge {
		position: absolute;
		top: -4px;
		right: -4px;
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
	
	/* Desktop: ocultar bottom nav */
	@media (min-width: 768px) {
		.bottom-nav {
			display: none;
		}
	}
</style>
