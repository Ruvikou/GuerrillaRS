<script lang="ts">
	/**
	 * OrganicButton - Botón con forma orgánica asimétrica
	 * USO 1: Fundamentos Privacy-First
	 * 
	 * Filosofía: Los botones "crecen" como brotes de plantas
	 * Forma asimétrica, animación orgánica, sin clones de UI tradicional
	 */

	export let variant: 'seed' | 'bloom' | 'root' | 'wither' | 'ghost' = 'seed';
	export let size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' = 'md';
	export let disabled = false;
	export let loading = false;
	export let fullWidth = false;
	export let type: 'button' | 'submit' | 'reset' = 'button';

	// Eventos
	export let onClick: (() => void) | undefined = undefined;

	// Clases CSS dinámicas
	$: variantClass = `btn-${variant}`;
	$: sizeClass = `btn-${size}`;
	$: widthClass = fullWidth ? 'btn-full' : '';
	$: stateClass = disabled ? 'btn-disabled' : loading ? 'btn-loading' : '';

	// Icono del variant
	const variantIcons: Record<string, string> = {
		seed: '🌱',
		bloom: '🌻',
		root: '🌿',
		wither: '🍂',
		ghost: '👻'
	};
</script>

<button
	{type}
	class="organic-button {variantClass} {sizeClass} {widthClass} {stateClass}"
	disabled={disabled || loading}
	on:click={() => onClick?.()}
	{...$$restProps}
>
	{#if loading}
		<span class="spinner" aria-hidden="true" />
		<span class="sr-only">Cargando...</span>
	{:else}
		<span class="btn-icon" aria-hidden="true">{variantIcons[variant]}</span>
	{/if}
	<span class="btn-content" class:ml-2={!loading}>
		<slot />
	</span>
</button>

<style>
	/* ========================================
	   TOKENS CSS (deben estar en :root global)
   ======================================== */
	:root {
		/* Colores Solarpunk */
		--moss: #059669;
		--moss-light: #34d399;
		--moss-dark: #064e3b;
		--amber: #d97706;
		--amber-light: #fbbf24;
		--amber-dark: #92400e;
		--error: #ef4444;
		--error-dark: #991b1b;
		
		/* Fondos */
		--bg-primary: #0a0f1c;
		--bg-elevated: #232b3d;
		--border: #1f2937;
		
		/* Texto */
		--text-primary: #ecfdf5;
		--text-muted: #6b7280;
		
		/* Easing orgánico */
		--ease-grow: cubic-bezier(0.34, 1.56, 0.64, 1);
		--ease-sprout: cubic-bezier(0.68, -0.55, 0.265, 1.55);
		
		/* Espaciado */
		--space-1: 0.25rem;
		--space-2: 0.5rem;
		--space-3: 0.75rem;
		--space-4: 1rem;
		--space-5: 1.25rem;
		--space-6: 1.5rem;
		
		/* Radios asimétricos (orgánicos) */
		--radius-sm: 0.375rem;
		--radius-md: 0.5rem 0.75rem 0.625rem 0.875rem;
		--radius-lg: 0.75rem 1.25rem 1rem 1.5rem;
		--radius-xl: 1rem 1.5rem 1.25rem 2rem;
		
		/* Duraciones */
		--duration-fast: 150ms;
		--duration-normal: 250ms;
		--duration-slow: 350ms;
	}

	/* ========================================
	   BASE BUTTON
   ======================================== */
	.organic-button {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		font-family: system-ui, -apple-system, sans-serif;
		font-weight: 500;
		border: none;
		cursor: pointer;
		overflow: hidden;
		transition: 
			all var(--duration-normal) var(--ease-grow);
		outline: none;
		
		/* Efecto de "brillo" interno */
		&::before {
			content: '';
			position: absolute;
			top: 0;
			left: -100%;
			width: 100%;
			height: 100%;
			background: linear-gradient(
				90deg,
				transparent,
				rgba(255, 255, 255, 0.1),
				transparent
			);
			transition: left var(--duration-slow) ease;
		}
		
		&:hover::before {
			left: 100%;
		}
		
		/* Focus visible */
		&:focus-visible {
			box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.4);
		}
		
		/* Active/Pressed - se "contrae" como semilla */
		&:active:not(.btn-disabled):not(.btn-loading) {
			transform: scale(0.96);
			transition-duration: var(--duration-fast);
		}
	}

	/* ========================================
	   VARIANTS
   ======================================== */
	
	/* SEED: Acción primaria (verde, prominente) */
	.btn-seed {
		background: linear-gradient(135deg, var(--moss) 0%, var(--moss-light) 100%);
		color: white;
		border-radius: var(--radius-lg);
		box-shadow: 
			0 2px 4px rgba(5, 150, 105, 0.3),
			0 4px 8px rgba(5, 150, 105, 0.2),
			inset 0 1px 0 rgba(255, 255, 255, 0.1);
		
		&:hover:not(.btn-disabled):not(.btn-loading) {
			transform: translateY(-2px) scale(1.02);
			box-shadow: 
				0 4px 8px rgba(5, 150, 105, 0.4),
				0 8px 16px rgba(5, 150, 105, 0.3),
				inset 0 1px 0 rgba(255, 255, 255, 0.15);
			border-radius: 0.8rem 1.3rem 1.1rem 1.6rem; /* Cambio sutil de forma */
		}
	}
	
	/* BLOOM: Acción secundaria (ámbar, destacada) */
	.btn-bloom {
		background: linear-gradient(135deg, var(--amber) 0%, var(--amber-light) 100%);
		color: var(--bg-primary);
		border-radius: var(--radius-lg);
		box-shadow: 
			0 2px 4px rgba(217, 119, 6, 0.3),
			0 4px 8px rgba(217, 119, 6, 0.2);
		
		&:hover:not(.btn-disabled):not(.btn-loading) {
			transform: translateY(-2px) scale(1.02);
			box-shadow: 
				0 4px 8px rgba(217, 119, 6, 0.4),
				0 8px 16px rgba(217, 119, 6, 0.3);
			border-radius: 0.8rem 1.3rem 1.1rem 1.6rem;
		}
	}
	
	/* ROOT: Acción terciaria (outline, sutil) */
	.btn-root {
		background: transparent;
		color: var(--text-primary);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		
		&:hover:not(.btn-disabled):not(.btn-loading) {
			border-color: var(--moss);
			color: var(--moss-light);
			background: rgba(5, 150, 105, 0.05);
		}
		
		&:focus-visible {
			box-shadow: 0 0 0 2px rgba(5, 150, 105, 0.3);
		}
	}
	
	/* WITHER: Acción destructiva (rojo) */
	.btn-wither {
		background: linear-gradient(135deg, var(--error) 0%, #f87171 100%);
		color: white;
		border-radius: var(--radius-lg);
		box-shadow: 
			0 2px 4px rgba(239, 68, 68, 0.3),
			0 4px 8px rgba(239, 68, 68, 0.2);
		
		&:hover:not(.btn-disabled):not(.btn-loading) {
			transform: translateY(-2px) scale(1.02);
			box-shadow: 
				0 4px 8px rgba(239, 68, 68, 0.4),
				0 8px 16px rgba(239, 68, 68, 0.3);
		}
		
		&:focus-visible {
			box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.4);
		}
	}
	
	/* GHOST: Botón invisible, solo icono/texto */
	.btn-ghost {
		background: transparent;
		color: var(--text-muted);
		border-radius: var(--radius-md);
		
		&:hover:not(.btn-disabled):not(.btn-loading) {
			color: var(--text-primary);
			background: rgba(255, 255, 255, 0.05);
		}
	}

	/* ========================================
	   SIZES
   ======================================== */
	.btn-xs {
		padding: var(--space-1) var(--space-2);
		font-size: 0.75rem;
		min-height: 1.75rem;
	}
	
	.btn-sm {
		padding: var(--space-2) var(--space-3);
		font-size: 0.875rem;
		min-height: 2.25rem;
	}
	
	.btn-md {
		padding: var(--space-3) var(--space-4);
		font-size: 1rem;
		min-height: 2.75rem;
	}
	
	.btn-lg {
		padding: var(--space-4) var(--space-6);
		font-size: 1.125rem;
		min-height: 3.25rem;
	}
	
	.btn-xl {
		padding: var(--space-5) var(--space-8);
		font-size: 1.25rem;
		min-height: 4rem;
	}

	/* ========================================
	   ESTADOS
   ======================================== */
	.btn-full {
		width: 100%;
	}
	
	.btn-disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none !important;
		box-shadow: none !important;
	}
	
	.btn-loading {
		cursor: wait;
		opacity: 0.8;
	}

	/* ========================================
	   SPINNER
   ======================================== */
	.spinner {
		width: 1em;
		height: 1em;
		border: 2px solid transparent;
		border-top-color: currentColor;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}
	
	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	/* ========================================
	   ICONO
   ======================================== */
	.btn-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font-size: 1.1em;
		transition: transform var(--duration-normal) var(--ease-sprout);
	}
	
	.organic-button:hover .btn-icon {
		transform: scale(1.1) rotate(-5deg);
	}

	/* ========================================
	   UTILIDADES
   ======================================== */
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
	
	.ml-2 {
		margin-left: var(--space-2);
	}

	/* ========================================
	   REDUCED MOTION
   ======================================== */
	@media (prefers-reduced-motion: reduce) {
		.organic-button,
		.organic-button::before,
		.btn-icon,
		.spinner {
			animation: none !important;
			transition: none !important;
		}
	}
</style>
