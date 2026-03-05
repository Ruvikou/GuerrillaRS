<script lang="ts">
	/**
	 * Página de inicio - Landing Page Solarpunk
	 * USO 1: Fundamentos Privacy-First
	 */
	
	import { OrganicButton } from '$lib/components/ui';
	
	// Features de la plataforma
	const features = [
		{
			icon: '🌱',
			title: 'Sin Algoritmos',
			description: 'Tú decides qué ver. No hay algoritmos que manipulen tu feed ni te mantengan enganchado.'
		},
		{
			icon: '🛡️',
			title: 'Zero Rastreadores',
			description: 'Cero cookies de terceros. Tu actividad no es vendida ni compartida con nadie.'
		},
		{
			icon: '🔒',
			title: 'Privacidad Real',
			description: 'Tus datos están encriptados y bajo tu control. Puedes exportarlos o eliminarlos en cualquier momento.'
		},
		{
			icon: '🔍',
			title: 'Código Abierto',
			description: 'Todo el código es público y auditable. No hay secretos ni puertas traseras.'
		}
	];
</script>

<svelte:head>
	<title>Guerrilla RS - Red Social Privacy-First</title>
	<meta name="description" content="Una red social radicalmente privada, sin algoritmos, sin IA, con control total del usuario." />
</svelte:head>

<div class="landing">
	<!-- Hero Section -->
	<section class="hero">
		<div class="hero-content">
			<div class="hero-logo">
				<span class="logo-icon">🌿</span>
				<h1>Guerrilla RS</h1>
			</div>
			<p class="hero-tagline">
				Un bosque digital donde la tecnología crece orgánicamente
			</p>
			<p class="hero-description">
				Red social privacy-first, sin algoritmos, sin rastreadores. 
				Verificación de edad local, código abierto, zero third-parties.
			</p>
			<div class="hero-actions">
				<a href="/register">
					<OrganicButton variant="seed" size="lg">
						🌱 Unirse a la comunidad
					</OrganicButton>
				</a>
				<a href="/login">
					<OrganicButton variant="root" size="lg">
						🌿 Iniciar sesión
					</OrganicButton>
				</a>
			</div>
		</div>
		
		<!-- Decoración orgánica -->
		<div class="hero-decoration" aria-hidden="true">
			<div class="organic-shape shape-1"></div>
			<div class="organic-shape shape-2"></div>
			<div class="organic-shape shape-3"></div>
		</div>
	</section>
	
	<!-- Features Section -->
	<section class="features">
		<h2>¿Por qué Guerrilla RS?</h2>
		<div class="features-grid">
			{#each features as feature}
				<div class="feature-card">
					<span class="feature-icon">{feature.icon}</span>
					<h3>{feature.title}</h3>
					<p>{feature.description}</p>
				</div>
			{/each}
		</div>
	</section>
	
	<!-- CTA Section -->
	<section class="cta">
		<div class="cta-content">
			<h2>Únete a la revolución</h2>
			<p>
				Guerrilla RS es un proyecto comunitario. Tu contribución, 
				ya sea código, diseño o difusión, es bienvenida.
			</p>
			<div class="cta-actions">
				<a href="https://github.com/guerrillars/guerrillars" target="_blank" rel="noopener">
					<OrganicButton variant="bloom" size="md">
						🌻 Ver en GitHub
					</OrganicButton>
				</a>
			</div>
		</div>
	</section>
	
	<!-- Footer -->
	<footer class="footer">
		<p>
			© 2026 Guerrilla RS · 
			<a href="/privacy">Privacidad</a> · 
			<a href="/terms">Términos</a> · 
			<a href="/about">Acerca de</a>
		</p>
	</footer>
</div>

<style>
	/* ========================================
	   TOKENS CSS
   ======================================== */
	:root {
		--bg-primary: #0a0f1c;
		--bg-secondary: #111827;
		--bg-elevated: #1a2234;
		--moss: #059669;
		--moss-light: #34d399;
		--amber: #d97706;
		--amber-light: #fbbf24;
		--text-primary: #ecfdf5;
		--text-secondary: #9ca3af;
		--text-muted: #6b7280;
		--border: #1f2937;
		--radius-lg: 0.75rem 1.25rem 1rem 1.5rem;
		--ease-grow: cubic-bezier(0.34, 1.56, 0.64, 1);
		--space-4: 1rem;
		--space-6: 1.5rem;
		--space-8: 2rem;
		--space-12: 3rem;
		--space-16: 4rem;
		--space-24: 6rem;
	}
	
	/* ========================================
	   LAYOUT
   ======================================== */
	.landing {
		min-height: 100vh;
		background: var(--bg-primary);
		color: var(--text-primary);
	}
	
	/* ========================================
	   HERO
   ======================================== */
	.hero {
		position: relative;
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-8);
		overflow: hidden;
	}
	
	.hero-content {
		position: relative;
		z-index: 2;
		text-align: center;
		max-width: 800px;
	}
	
	.hero-logo {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-4);
		margin-bottom: var(--space-6);
	}
	
	.logo-icon {
		font-size: 4rem;
		animation: float 6s ease-in-out infinite;
	}
	
	@keyframes float {
		0%, 100% { transform: translateY(0) rotate(-5deg); }
		50% { transform: translateY(-20px) rotate(5deg); }
	}
	
	.hero-logo h1 {
		font-size: clamp(2.5rem, 8vw, 5rem);
		font-weight: 700;
		background: linear-gradient(135deg, var(--moss-light), var(--amber-light));
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}
	
	.hero-tagline {
		font-size: clamp(1.25rem, 3vw, 1.75rem);
		color: var(--moss-light);
		margin-bottom: var(--space-4);
		font-weight: 500;
	}
	
	.hero-description {
		font-size: clamp(1rem, 2vw, 1.25rem);
		color: var(--text-secondary);
		margin-bottom: var(--space-8);
		line-height: 1.7;
	}
	
	.hero-actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-4);
		justify-content: center;
	}
	
	/* ========================================
	   DECORACIÓN ORGÁNICA
   ======================================== */
	.hero-decoration {
		position: absolute;
		inset: 0;
		pointer-events: none;
		z-index: 1;
	}
	
	.organic-shape {
		position: absolute;
		border-radius: 60% 40% 55% 45% / 45% 55% 45% 55%;
		opacity: 0.1;
		animation: morph 20s ease-in-out infinite;
	}
	
	.shape-1 {
		width: 600px;
		height: 600px;
		background: linear-gradient(135deg, var(--moss), transparent);
		top: -200px;
		right: -200px;
		animation-delay: 0s;
	}
	
	.shape-2 {
		width: 400px;
		height: 400px;
		background: linear-gradient(135deg, var(--amber), transparent);
		bottom: -100px;
		left: -100px;
		animation-delay: -5s;
	}
	
	.shape-3 {
		width: 300px;
		height: 300px;
		background: linear-gradient(135deg, var(--moss-light), transparent);
		top: 50%;
		left: 10%;
		animation-delay: -10s;
	}
	
	@keyframes morph {
		0%, 100% { border-radius: 60% 40% 55% 45% / 45% 55% 45% 55%; }
		25% { border-radius: 55% 45% 60% 40% / 55% 45% 55% 45%; }
		50% { border-radius: 50% 50% 55% 45% / 50% 50% 50% 50%; }
		75% { border-radius: 45% 55% 50% 50% / 45% 55% 45% 55%; }
	}
	
	/* ========================================
	   FEATURES
   ======================================== */
	.features {
		padding: var(--space-24) var(--space-8);
		background: var(--bg-secondary);
	}
	
	.features h2 {
		text-align: center;
		font-size: clamp(1.75rem, 4vw, 2.5rem);
		margin-bottom: var(--space-12);
		color: var(--text-primary);
	}
	
	.features-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: var(--space-6);
		max-width: 1200px;
		margin: 0 auto;
	}
	
	.feature-card {
		background: var(--bg-elevated);
		border-radius: var(--radius-lg);
		padding: var(--space-8);
		text-align: center;
		transition: transform 0.3s var(--ease-grow), box-shadow 0.3s var(--ease-grow);
		border: 1px solid var(--border);
	}
	
	.feature-card:hover {
		transform: translateY(-8px);
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
	}
	
	.feature-icon {
		font-size: 3rem;
		margin-bottom: var(--space-4);
		display: block;
	}
	
	.feature-card h3 {
		font-size: 1.25rem;
		margin-bottom: var(--space-4);
		color: var(--moss-light);
	}
	
	.feature-card p {
		color: var(--text-secondary);
		line-height: 1.6;
	}
	
	/* ========================================
	   CTA
   ======================================== */
	.cta {
		padding: var(--space-24) var(--space-8);
		text-align: center;
		background: linear-gradient(180deg, var(--bg-secondary) 0%, var(--bg-primary) 100%);
	}
	
	.cta-content {
		max-width: 600px;
		margin: 0 auto;
	}
	
	.cta h2 {
		font-size: clamp(1.75rem, 4vw, 2.5rem);
		margin-bottom: var(--space-4);
		color: var(--text-primary);
	}
	
	.cta p {
		color: var(--text-secondary);
		margin-bottom: var(--space-8);
		line-height: 1.6;
	}
	
	/* ========================================
	   FOOTER
   ======================================== */
	.footer {
		padding: var(--space-8);
		text-align: center;
		background: var(--bg-primary);
		border-top: 1px solid var(--border);
	}
	
	.footer p {
		color: var(--text-muted);
	}
	
	.footer a {
		color: var(--moss-light);
		text-decoration: none;
	}
	
	.footer a:hover {
		text-decoration: underline;
	}
	
	/* ========================================
	   RESPONSIVE
   ======================================== */
	@media (max-width: 640px) {
		.hero {
			padding: var(--space-6);
		}
		
		.hero-actions {
			flex-direction: column;
			align-items: center;
		}
		
		.features {
			padding: var(--space-12) var(--space-4);
		}
		
		.features-grid {
			grid-template-columns: 1fr;
		}
	}
	
	/* ========================================
	   REDUCED MOTION
   ======================================== */
	@media (prefers-reduced-motion: reduce) {
		.logo-icon,
		.organic-shape {
			animation: none;
		}
		
		.feature-card:hover {
			transform: none;
		}
	}
</style>
