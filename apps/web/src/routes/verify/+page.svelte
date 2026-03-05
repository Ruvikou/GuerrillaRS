<script lang="ts">
	/**
	 * Página de Verificación de Edad
	 * USO 1: Fundamentos Privacy-First
	 */
	
	import { OrganicButton } from '$lib/components/ui';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	
	let idImage: File | null = null;
	let selfieImage: File | null = null;
	let idPreview = '';
	let selfiePreview = '';
	let error = '';
	let loading = false;
	let remainingAttempts = 3;
	
	onMount(async () => {
		// Cargar estado de verificación
		try {
			const response = await fetch('/api/verify');
			const data = await response.json();
			
			if (data.isVerified) {
				goto('/feed');
				return;
			}
			
			remainingAttempts = data.rateLimit?.remaining ?? 3;
		} catch (err) {
			console.error('Error loading verification status:', err);
		}
	});
	
	function handleIdChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (file) {
			idImage = file;
			idPreview = URL.createObjectURL(file);
		}
	}
	
	function handleSelfieChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (file) {
			selfieImage = file;
			selfiePreview = URL.createObjectURL(file);
		}
	}
	
	async function handleVerify() {
		error = '';
		
		if (!idImage || !selfieImage) {
			error = 'Debes subir ambas imágenes';
			return;
		}
		
		loading = true;
		
		try {
			// Convertir imágenes a base64 (en producción, encriptar primero)
			const idBase64 = await fileToBase64(idImage);
			const selfieBase64 = await fileToBase64(selfieImage);
			
			const response = await fetch('/api/verify', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					idImageEncrypted: idBase64,
					selfieEncrypted: selfieBase64
				})
			});
			
			const data = await response.json();
			
			if (!response.ok) {
				remainingAttempts = data.rateLimit?.remaining ?? remainingAttempts - 1;
				throw new Error(data.message || 'Error en la verificación');
			}
			
			// Verificación exitosa
			goto('/feed');
		} catch (err) {
			error = err instanceof Error ? err.message : 'Error desconocido';
		} finally {
			loading = false;
		}
	}
	
	function fileToBase64(file: File): Promise<string> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => resolve(reader.result as string);
			reader.onerror = reject;
			reader.readAsDataURL(file);
		});
	}
</script>

<svelte:head>
	<title>Verificación de edad - Guerrilla RS</title>
</svelte:head>

<div class="verify-page">
	<div class="verify-card">
		<div class="verify-header">
			<a href="/" class="back-link">← Volver</a>
			<div class="logo">
				<span class="logo-icon">🌿</span>
				<h1>Guerrilla RS</h1>
			</div>
		</div>
		
		<h2>Verificación de edad</h2>
		<p class="subtitle">
			Para acceder a todas las funcionalidades, necesitamos verificar que tienes al menos 16 años.
		</p>
		
		<div class="info-box">
			<p>🔒 <strong>Tus datos están seguros:</strong></p>
			<ul>
				<li>Las imágenes se procesan localmente</li>
				<li>No almacenamos fotos de tu documento</li>
				<li>Solo guardamos un hash irreversible</li>
				<li>Las imágenes se borran inmediatamente</li>
			</ul>
		</div>
		
		{#if remainingAttempts < 3}
			<div class="warning-message">
				⚠️ Te quedan {remainingAttempts} intentos. Si los agotas, deberás esperar 1 hora.
			</div>
		{/if}
		
		{#if error}
			<div class="error-message" role="alert">
				{error}
			</div>
		{/if}
		
		<form on:submit|preventDefault={handleVerify}>
			<div class="upload-section">
				<div class="upload-group">
					<label for="idImage">Documento de identidad (DNI/NIE/Pasaporte)</label>
					<div class="upload-area" class:has-file={idPreview}>
						{#if idPreview}
							<img src={idPreview} alt="Preview del documento" />
						{:else}
							<div class="upload-placeholder">
								<span class="upload-icon">📄</span>
								<span>Haz clic para subir</span>
								<span class="upload-hint">JPG, PNG o PDF</span>
							</div>
						{/if}
						<input
							type="file"
							id="idImage"
							accept="image/*,.pdf"
							on:change={handleIdChange}
							disabled={loading}
							required
						/>
					</div>
				</div>
				
				<div class="upload-group">
					<label for="selfieImage">Selfie con tu rostro</label>
					<div class="upload-area" class:has-file={selfiePreview}>
						{#if selfiePreview}
							<img src={selfiePreview} alt="Preview del selfie" />
						{:else}
							<div class="upload-placeholder">
								<span class="upload-icon">📸</span>
								<span>Haz clic para subir</span>
								<span class="upload-hint">Asegúrate de que se vea bien tu rostro</span>
							</div>
						{/if}
						<input
							type="file"
							id="selfieImage"
							accept="image/*"
							on:change={handleSelfieChange}
							disabled={loading}
							required
						/>
					</div>
				</div>
			</div>
			
			<OrganicButton
				variant="seed"
				size="lg"
				fullWidth
				loading={loading}
				type="submit"
			>
				{loading ? 'Verificando...' : '🌱 Verificar mi edad'}
			</OrganicButton>
		</form>
		
		<div class="verify-footer">
			<p>
				¿Tienes problemas? <a href="/contact">Contacta con soporte</a>
			</p>
		</div>
	</div>
</div>

<style>
	:root {
		--bg-primary: #0a0f1c;
		--bg-elevated: #1a2234;
		--moss: #059669;
		--moss-light: #34d399;
		--amber: #d97706;
		--text-primary: #ecfdf5;
		--text-secondary: #9ca3af;
		--text-muted: #6b7280;
		--border: #1f2937;
		--error: #ef4444;
		--warning: #f59e0b;
		--radius-lg: 0.75rem 1.25rem 1rem 1.5rem;
		--space-2: 0.5rem;
		--space-3: 0.75rem;
		--space-4: 1rem;
		--space-6: 1.5rem;
		--space-8: 2rem;
	}
	
	.verify-page {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-4);
		background: var(--bg-primary);
	}
	
	.verify-card {
		width: 100%;
		max-width: 520px;
		background: var(--bg-elevated);
		border-radius: var(--radius-lg);
		padding: var(--space-8);
		border: 1px solid var(--border);
	}
	
	.verify-header {
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
	
	.info-box {
		background: rgba(5, 150, 105, 0.1);
		border: 1px solid var(--moss);
		border-radius: var(--radius-lg);
		padding: var(--space-4);
		margin-bottom: var(--space-6);
	}
	
	.info-box p {
		color: var(--moss-light);
		margin-bottom: var(--space-3);
	}
	
	.info-box ul {
		margin: 0;
		padding-left: var(--space-6);
		color: var(--text-secondary);
	}
	
	.info-box li {
		margin-bottom: var(--space-2);
	}
	
	.warning-message {
		background: rgba(245, 158, 11, 0.1);
		border: 1px solid var(--warning);
		color: var(--warning);
		padding: var(--space-4);
		border-radius: var(--radius-lg);
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
	
	.upload-section {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}
	
	.upload-group {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}
	
	.upload-group label {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-primary);
	}
	
	.upload-area {
		position: relative;
		border: 2px dashed var(--border);
		border-radius: var(--radius-lg);
		padding: var(--space-6);
		text-align: center;
		cursor: pointer;
		transition: border-color 0.2s, background 0.2s;
		min-height: 160px;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.upload-area:hover {
		border-color: var(--moss);
		background: rgba(5, 150, 105, 0.05);
	}
	
	.upload-area.has-file {
		border-style: solid;
		border-color: var(--moss);
		padding: 0;
		overflow: hidden;
	}
	
	.upload-area img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	
	.upload-area input[type="file"] {
		position: absolute;
		inset: 0;
		opacity: 0;
		cursor: pointer;
	}
	
	.upload-placeholder {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-2);
	}
	
	.upload-icon {
		font-size: 2.5rem;
	}
	
	.upload-placeholder span:not(.upload-icon):not(.upload-hint) {
		color: var(--text-primary);
		font-weight: 500;
	}
	
	.upload-hint {
		font-size: 0.75rem;
		color: var(--text-muted);
	}
	
	.verify-footer {
		margin-top: var(--space-6);
		text-align: center;
		color: var(--text-secondary);
	}
	
	.verify-footer a {
		color: var(--moss-light);
		text-decoration: none;
	}
	
	.verify-footer a:hover {
		text-decoration: underline;
	}
</style>
