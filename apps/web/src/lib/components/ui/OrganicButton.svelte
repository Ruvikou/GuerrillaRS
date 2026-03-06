<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	
	type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
	type Size = 'sm' | 'md' | 'lg';
	
	export let variant: Variant = 'primary';
	export let size: Size = 'md';
	export let disabled = false;
	export let loading = false;
	export let type: 'button' | 'submit' | 'reset' = 'button';
	export let fullWidth = false;
	
	const dispatch = createEventDispatcher<{
		click: MouseEvent;
	}>();
	
	function handleClick(event: MouseEvent) {
		if (!disabled && !loading) {
			dispatch('click', event);
		}
	}
	
	$: classes = [
		'organic-button',
		`variant-${variant}`,
		`size-${size}`,
		fullWidth ? 'full-width' : '',
		loading ? 'loading' : '',
		disabled ? 'disabled' : ''
	].filter(Boolean).join(' ');
</script>

<button
	{type}
	class={classes}
	disabled={disabled || loading}
	on:click={handleClick}
>
	{#if loading}
		<span class="spinner"></span>
	{/if}
	<span class="content" class:loading>
		<slot />
	</span>
</button>

<style>
	.organic-button {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		border: none;
		border-radius: 9999px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		overflow: hidden;
	}
	
	.organic-button:focus {
		outline: none;
		box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.3);
	}
	
	/* Variants */
	.variant-primary {
		background: linear-gradient(135deg, #059669 0%, #10b981 100%);
		color: white;
		box-shadow: 0 2px 8px rgba(5, 150, 105, 0.3);
	}
	
	.variant-primary:hover:not(.disabled) {
		transform: translateY(-2px);
		box-shadow: 0 4px 16px rgba(5, 150, 105, 0.4);
	}
	
	.variant-secondary {
		background: white;
		color: #374151;
		border: 2px solid #e5e7eb;
	}
	
	.variant-secondary:hover:not(.disabled) {
		border-color: #059669;
		color: #059669;
	}
	
	.variant-ghost {
		background: transparent;
		color: #6b7280;
	}
	
	.variant-ghost:hover:not(.disabled) {
		background: #f3f4f6;
		color: #374151;
	}
	
	.variant-danger {
		background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
		color: white;
	}
	
	.variant-danger:hover:not(.disabled) {
		transform: translateY(-2px);
		box-shadow: 0 4px 16px rgba(220, 38, 38, 0.3);
	}
	
	/* Sizes */
	.size-sm {
		padding: 0.375rem 0.875rem;
		font-size: 0.8125rem;
	}
	
	.size-md {
		padding: 0.625rem 1.25rem;
		font-size: 0.9375rem;
	}
	
	.size-lg {
		padding: 0.875rem 2rem;
		font-size: 1rem;
	}
	
	/* States */
	.full-width {
		width: 100%;
	}
	
	.disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	
	.loading {
		cursor: wait;
	}
	
	.spinner {
		width: 16px;
		height: 16px;
		border: 2px solid currentColor;
		border-top-color: transparent;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}
	
	@keyframes spin {
		to { transform: rotate(360deg); }
	}
	
	.content {
		transition: opacity 0.2s;
	}
	
	.content.loading {
		opacity: 0.7;
	}
</style>
