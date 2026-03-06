<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { userStore } from '$lib/stores/user';
	import OrganicButton from '$lib/components/ui/OrganicButton.svelte';
	
	const dispatch = createEventDispatcher<{
		success: void;
	});
	
	let content = '';
	let selectedFiles: File[] = [];
	let previewUrls: string[] = [];
	let selectedTags: string[] = [];
	let tagInput = '';
	let visibility: 'PUBLIC' | 'FOLLOWERS' | 'PRIVATE' = 'PUBLIC';
	let allowComments = true;
	
	let isSubmitting = false;
	let error: string | null = null;
	let showOptions = false;
	
	const MAX_CONTENT_LENGTH = 2000;
	const MAX_FILES = 4;
	const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
	
	$: remainingChars = MAX_CONTENT_LENGTH - content.length;
	$: canSubmit = content.trim().length > 0 && !isSubmitting;
	
	function handleFileSelect(event: Event) {
		const input = event.target as HTMLInputElement;
		const files = Array.from(input.files || []);
		
		// Validar cantidad
		if (selectedFiles.length + files.length > MAX_FILES) {
			error = `Máximo ${MAX_FILES} imágenes`;
			return;
		}
		
		// Validar tamaño
		const oversized = files.find(f => f.size > MAX_FILE_SIZE);
		if (oversized) {
			error = `Imagen demasiado grande (máx 10MB)`;
			return;
		}
		
		// Crear previews
		files.forEach(file => {
			const url = URL.createObjectURL(file);
			previewUrls = [...previewUrls, url];
		});
		
		selectedFiles = [...selectedFiles, ...files];
		error = null;
	}
	
	function removeImage(index: number) {
		URL.revokeObjectURL(previewUrls[index]);
		previewUrls = previewUrls.filter((_, i) => i !== index);
		selectedFiles = selectedFiles.filter((_, i) => i !== index);
	}
	
	function addTag() {
		const tag = tagInput.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
		if (tag && !selectedTags.includes(tag) && selectedTags.length < 10) {
			selectedTags = [...selectedTags, tag];
			tagInput = '';
		}
	}
	
	function removeTag(tag: string) {
		selectedTags = selectedTags.filter(t => t !== tag);
	}
	
	function handleTagKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			addTag();
		}
	}
	
	async function submitPost() {
		if (!canSubmit) return;
		
		isSubmitting = true;
		error = null;
		
		try {
			const formData = new FormData();
			formData.append('content', content.trim());
			formData.append('visibility', visibility);
			formData.append('allowComments', String(allowComments));
			formData.append('tags', JSON.stringify(selectedTags));
			
			selectedFiles.forEach(file => {
				formData.append('images', file);
			});
			
			const response = await fetch('/api/posts', {
				method: 'POST',
				body: formData
			});
			
			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.message || 'Error creando publicación');
			}
			
			// Limpiar formulario
			content = '';
			previewUrls.forEach(url => URL.revokeObjectURL(url));
			previewUrls = [];
			selectedFiles = [];
			selectedTags = [];
			visibility = 'PUBLIC';
			allowComments = true;
			
			dispatch('success');
			
		} catch (e: any) {
			error = e.message;
		} finally {
			isSubmitting = false;
		}
	}
</script>

<div class="create-post">
	<div class="composer">
		<div class="avatar">
			{#if $userStore?.avatarUrl}
				<img src={$userStore.avatarUrl} alt={$userStore.displayName} />
			{:else}
				<span class="avatar-placeholder">
					{$userStore?.displayName?.charAt(0).toUpperCase() || '?'}
				</span>
			{/if}
		</div>
		
		<div class="input-area">
			<textarea
				bind:value={content}
				placeholder="¿Qué está creciendo en tu jardín?"
				rows={Math.min(6, 2 + Math.floor(content.length / 60))}
				maxlength={MAX_CONTENT_LENGTH}
				disabled={isSubmitting}
			/>
			
			<!-- Previews de imágenes -->
			{#if previewUrls.length > 0}
				<div class="image-previews">
					{#each previewUrls as url, i}
						<div class="preview-item">
							<img src={url} alt="" />
							<button 
								class="remove-btn"
								on:click={() => removeImage(i)}
								aria-label="Eliminar imagen"
							>
								✕
							</button>
						</div>
					{/each}
				</div>
			{/if}
			
			<!-- Tags -->
			{#if selectedTags.length > 0}
				<div class="selected-tags">
					{#each selectedTags as tag}
						<span class="tag">
							#{tag}
							<button on:click={() => removeTag(tag)}>✕</button>
						</span>
					{/each}
				</div>
			{/if}
			
			<!-- Opciones -->
			{#if showOptions}
				<div class="options-panel">
					<div class="option-group">
						<label>Visibilidad</label>
						<select bind:value={visibility}>
							<option value="PUBLIC">🌐 Pública</option>
							<option value="FOLLOWERS">👥 Solo seguidores</option>
							<option value="PRIVATE">🔒 Privada</option>
						</select>
					</div>
					
					<label class="checkbox-label">
						<input type="checkbox" bind:checked={allowComments} />
						<span>Permitir comentarios</span>
					</label>
					
					<div class="tag-input-wrapper">
						<label>Etiquetas (máx 10)</label>
						<input
							type="text"
							bind:value={tagInput}
							on:keydown={handleTagKeydown}
							placeholder="Escribe y presiona Enter"
						/>
					</div>
				</div>
			{/if}
			
			<!-- Toolbar -->
			<div class="toolbar">
				<div class="tools">
					<label class="tool-btn" class:disabled={selectedFiles.length >= MAX_FILES}>
						<input
							type="file"
							accept="image/*"
							multiple
							on:change={handleFileSelect}
							disabled={selectedFiles.length >= MAX_FILES}
							hidden
						/>
						<span class="tool-icon">📷</span>
					</label>
					
					<button 
						class="tool-btn"
						class:active={showOptions}
						on:click={() => showOptions = !showOptions}
					>
						<span class="tool-icon">⚙️</span>
					</button>
				</div>
				
				<div class="actions">
					<span class="char-count" class:warning={remainingChars < 100}>
						{remainingChars}
					</span>
					
					<OrganicButton
						variant="primary"
						on:click={submitPost}
						disabled={!canSubmit}
						loading={isSubmitting}
					>
						{isSubmitting ? 'Sembrando...' : 'Compartir'}
					</OrganicButton>
				</div>
			</div>
			
			{#if error}
				<p class="error-message">{error}</p>
			{/if}
		</div>
	</div>
</div>

<style>
	.create-post {
		background: white;
		border-radius: 24px;
		padding: 1rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
	}
	
	.composer {
		display: flex;
		gap: 0.75rem;
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
	
	.input-area {
		flex: 1;
	}
	
	textarea {
		width: 100%;
		border: none;
		resize: none;
		font-size: 1rem;
		line-height: 1.5;
		padding: 0.5rem 0;
		background: transparent;
		color: #1f2937;
	}
	
	textarea:focus {
		outline: none;
	}
	
	textarea::placeholder {
		color: #9ca3af;
	}
	
	.image-previews {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
		gap: 0.5rem;
		margin: 0.75rem 0;
	}
	
	.preview-item {
		position: relative;
		aspect-ratio: 1;
		border-radius: 12px;
		overflow: hidden;
	}
	
	.preview-item img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	
	.remove-btn {
		position: absolute;
		top: 4px;
		right: 4px;
		width: 24px;
		height: 24px;
		border-radius: 50%;
		border: none;
		background: rgba(0, 0, 0, 0.6);
		color: white;
		font-size: 0.75rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.selected-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin: 0.75rem 0;
	}
	
	.tag {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.25rem 0.5rem;
		background: #d1fae5;
		color: #065f46;
		border-radius: 9999px;
		font-size: 0.8125rem;
		font-weight: 500;
	}
	
	.tag button {
		background: none;
		border: none;
		color: inherit;
		cursor: pointer;
		padding: 0;
		font-size: 0.75rem;
	}
	
	.options-panel {
		background: #f9fafb;
		border-radius: 12px;
		padding: 1rem;
		margin: 0.75rem 0;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	
	.option-group {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	
	.option-group label,
	.tag-input-wrapper label {
		font-size: 0.75rem;
		font-weight: 500;
		color: #6b7280;
		text-transform: uppercase;
		letter-spacing: 0.025em;
	}
	
	.option-group select,
	.tag-input-wrapper input {
		padding: 0.5rem;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		font-size: 0.875rem;
		background: white;
	}
	
	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		color: #374151;
		cursor: pointer;
	}
	
	.checkbox-label input {
		width: 16px;
		height: 16px;
		accent-color: #059669;
	}
	
	.tag-input-wrapper {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	
	.toolbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-top: 0.75rem;
		border-top: 1px solid #f3f4f6;
		margin-top: 0.5rem;
	}
	
	.tools {
		display: flex;
		gap: 0.25rem;
	}
	
	.tool-btn {
		width: 36px;
		height: 36px;
		border-radius: 50%;
		border: none;
		background: transparent;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background 0.2s;
	}
	
	.tool-btn:hover:not(.disabled) {
		background: #f3f4f6;
	}
	
	.tool-btn.active {
		background: #d1fae5;
	}
	
	.tool-btn.disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
	
	.tool-icon {
		font-size: 1.25rem;
	}
	
	.actions {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}
	
	.char-count {
		font-size: 0.8125rem;
		color: #9ca3af;
	}
	
	.char-count.warning {
		color: #f59e0b;
		font-weight: 500;
	}
	
	.error-message {
		color: #dc2626;
		font-size: 0.875rem;
		margin-top: 0.5rem;
	}
</style>
