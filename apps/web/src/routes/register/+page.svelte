<script lang="ts">
	/**
	 * Página de Registro
	 * USO 1: Fundamentos Privacy-First
	 */
	
	import { OrganicButton } from '$lib/components/ui';
	import { goto } from '$app/navigation';
	
	let username = '';
	let email = '';
	let password = '';
	let confirmPassword = '';
	let age = 16;
	let acceptTerms = false;
	let error = '';
	let loading = false;
	
	async function handleRegister() {
		error = '';
		
		// Validaciones
		if (password !== confirmPassword) {
			error = 'Las contraseñas no coinciden';
			return;
		}
		
		if (password.length < 12) {
			error = 'La contraseña debe tener al menos 12 caracteres';
			return;
		}
		
		if (!acceptTerms) {
			error = 'Debes aceptar los términos y condiciones';
			return;
		}
		
		if (age < 16) {
			error = 'Debes tener al menos 16 años para registrarte';
			return;
		}
		
		loading = true;
		
		try {
			const response = await fetch('/api/auth', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username, email, password, age })
			});
			
			const data = await response.json();
			
			if (!response.ok) {
				throw new Error(data.message || 'Error al registrar');
			}
			
			// Redirigir a verificación
			goto('/verify');
		} catch (err) {
			error = err instanceof Error ? err.message : 'Error desconocido';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Crear cuenta - Guerrilla RS</title>
</svelte:head>

<div class="auth-page">
	<div class="auth-card">
		<div class="auth-header">
			<a href="/" class="back-link">← Volver</a>
			<div class="logo">
				<span class="logo-icon">🌿</span>
				<h1>Guerrilla RS</h1>
			</div>
		</div>
		
		<h2>Crear cuenta</h2>
		<p class="subtitle">Únete al bosque digital</p>
		
		{#if error}
			<div class="error-message" role="alert">
				{error}
			</div>
		{/if}
		
		<form on:submit|preventDefault={handleRegister}>
			<div class="form-group">
				<label for="username">Nombre de usuario</label>
				<input
					type="text"
					id="username"
					bind:value={username}
					placeholder="@usuario"
					required
					disabled={loading}
					minlength="3"
					maxlength="32"
					pattern="[a-zA-Z0-9_-]+"
				/>
				<span class="hint">Solo letras, números, guiones y guiones bajos</span>
			</div>
			
			<div class="form-group">
				<label for="email">Email</label>
				<input
					type="email"
					id="email"
					bind:value={email}
					placeholder="tu@email.com"
					required
					disabled={loading}
				/>
			</div>
			
			<div class="form-group">
				<label for="password">Contraseña</label>
				<input
					type="password"
					id="password"
					bind:value={password}
					placeholder="••••••••••••"
					required
					disabled={loading}
					minlength="12"
				/>
				<span class="hint">Mínimo 12 caracteres</span>
			</div>
			
			<div class="form-group">
				<label for="confirmPassword">Confirmar contraseña</label>
				<input
					type="password"
					id="confirmPassword"
					bind:value={confirmPassword}
					placeholder="••••••••••••"
					required
					disabled={loading}
				/>
			</div>
			
			<div class="form-group">
				<label for="age">Edad</label>
				<input
					type="number"
					id="age"
					bind:value={age}
					min="16"
					max="120"
					required
					disabled={loading}
				/>
				<span class="hint">Debes tener al menos 16 años</span>
			</div>
			
			<div class="form-group checkbox">
				<label class="checkbox-label">
					<input
						type="checkbox"
						bind:checked={acceptTerms}
						disabled={loading}
						required
					/>
					<span>Acepto los <a href="/terms" target="_blank">términos de servicio</a> y la <a href="/privacy" target="_blank">política de privacidad</a></span>
				</label>
			</div>
			
			<OrganicButton
				variant="seed"
				size="lg"
				fullWidth
				loading={loading}
				type="submit"
			>
				{loading ? 'Creando cuenta...' : '🌱 Crear cuenta'}
			</OrganicButton>
		</form>
		
		<div class="auth-footer">
			<p>¿Ya tienes cuenta? <a href="/login">Inicia sesión</a></p>
		</div>
	</div>
</div>

<style>
	:root {
		--bg-primary: #0a0f1c;
		--bg-elevated: #1a2234;
		--moss: #059669;
		--moss-light: #34d399;
		--text-primary: #ecfdf5;
		--text-secondary: #9ca3af;
		--text-muted: #6b7280;
		--border: #1f2937;
		--error: #ef4444;
		--radius-lg: 0.75rem 1.25rem 1rem 1.5rem;
		--space-2: 0.5rem;
		--space-3: 0.75rem;
		--space-4: 1rem;
		--space-6: 1.5rem;
		--space-8: 2rem;
	}
	
	.auth-page {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-4);
		background: var(--bg-primary);
	}
	
	.auth-card {
		width: 100%;
		max-width: 420px;
		background: var(--bg-elevated);
		border-radius: var(--radius-lg);
		padding: var(--space-8);
		border: 1px solid var(--border);
	}
	
	.auth-header {
		margin-bottom: var(--space-6);
	}
	
	.back-link {
		color: var(--text-muted);
		text-decoration: none;
		font-size: 0.875rem;
		display: inline-block;
		margin-bottom: var(--space-4);
	}
	
	.back-link:hover {
		color: var(--moss-light);
	}
	
	.logo {
		display: flex;
		align-items: center;
		gap: var(--space-4);
	}
	
	.logo-icon {
		font-size: 2rem;
	}
	
	.logo h1 {
		font-size: 1.5rem;
		background: linear-gradient(135deg, var(--moss-light), #d4af37);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
	}
	
	h2 {
		font-size: 1.5rem;
		margin-bottom: var(--space-4);
		color: var(--text-primary);
	}
	
	.subtitle {
		color: var(--text-secondary);
		margin-bottom: var(--space-6);
	}
	
	.error-message {
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid var(--error);
		color: var(--error);
		padding: var(--space-4);
		border-radius: var(--radius-lg);
		margin-bottom: var(--space-6);
	}
	
	form {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}
	
	.form-group {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}
	
	.form-group.checkbox {
		flex-direction: row;
	}
	
	label {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-primary);
	}
	
	.checkbox-label {
		display: flex;
		align-items: flex-start;
		gap: var(--space-3);
		font-weight: normal;
		cursor: pointer;
	}
	
	.checkbox-label input[type="checkbox"] {
		margin-top: 2px;
		width: 18px;
		height: 18px;
		accent-color: var(--moss);
	}
	
	.checkbox-label a {
		color: var(--moss-light);
		text-decoration: none;
	}
	
	.checkbox-label a:hover {
		text-decoration: underline;
	}
	
	input {
		padding: var(--space-4);
		background: var(--bg-primary);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		color: var(--text-primary);
		font-size: 1rem;
		transition: border-color 0.2s, box-shadow 0.2s;
	}
	
	input:focus {
		outline: none;
		border-color: var(--moss);
		box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.2);
	}
	
	input::placeholder {
		color: var(--text-muted);
	}
	
	input:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	
	.hint {
		font-size: 0.75rem;
		color: var(--text-muted);
	}
	
	.auth-footer {
		margin-top: var(--space-6);
		text-align: center;
		color: var(--text-secondary);
	}
	
	.auth-footer a {
		color: var(--moss-light);
		text-decoration: none;
	}
	
	.auth-footer a:hover {
		text-decoration: underline;
	}
</style>
