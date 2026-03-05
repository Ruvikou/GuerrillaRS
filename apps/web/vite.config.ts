import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],

	// Optimizaciones de build
	build: {
		target: 'esnext',
		minify: 'esbuild',
		sourcemap: true
	},

	// Resolución de dependencias
	resolve: {
		alias: {
			// Alias adicionales si son necesarios
		}
	},

	// Server de desarrollo
	server: {
		port: 3000,
		strictPort: false,
		host: '0.0.0.0'
	},

	// Preview
	preview: {
		port: 3000,
		strictPort: false,
		host: '0.0.0.0'
	},

	// Optimizaciones de dependencias
	optimizeDeps: {
		include: [
			'@prisma/client',
			'jose',
			'argon2'
		],
		exclude: [
			'@sveltejs/kit'
		]
	},

	// Configuración de CSS
	css: {
		devSourcemap: true
	}
});
