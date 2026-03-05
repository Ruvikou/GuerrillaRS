import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Preprocessor de Vite para Svelte
	preprocess: vitePreprocess(),

	kit: {
		// Adaptador Node.js para SSR
		adapter: adapter({
			// Opciones del adaptador
			out: 'build',
			precompress: false,
			envPrefix: ''
		}),

		// Alias de rutas
		alias: {
			$lib: './src/lib',
			$components: './src/lib/components',
			$types: './src/lib/types',
			$server: './src/lib/server'
		},

		// Configuración de CSRF
		csrf: {
			checkOrigin: true
		},

		// Manejo de errores
		errorHandler: ({ error, event }) => {
			console.error('Error en request:', event.url.pathname, error);
		},

		// Headers de seguridad adicionales
		csp: {
			mode: 'auto',
			directives: {
				'default-src': ["'self'"],
				'script-src': ["'self'", "'unsafe-inline'"],
				'style-src': ["'self'", "'unsafe-inline'"],
				'img-src': ["'self'", 'data:', 'blob:'],
				'font-src': ["'self'"],
				'connect-src': ["'self'"],
				'media-src': ["'self'", 'blob:'],
				'object-src': ["'none'"],
				'frame-ancestors': ["'none'"],
				'base-uri': ["'self'"],
				'form-action': ["'self'"]
			}
		}
	}
};

export default config;
