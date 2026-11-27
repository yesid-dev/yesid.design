import { defineConfig } from 'vitest/config';
import type { Plugin } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import kit from './kit.config.js';

// Playwright's request client (route.fetch, page.request) keeps sockets alive across tests, while Node closes idle
// ones after 5 s. A request sent on a socket as the server closes it fails with "socket hang up". The preview server
// runs the Gallery browser tests, so it keeps idle sockets open instead.
const keepIdleSockets: Plugin = {
	name: 'gallery-preview-keep-idle-sockets',
	configurePreviewServer({ httpServer }) {
		if ('keepAliveTimeout' in httpServer) httpServer.keepAliveTimeout = 0;
	},
};

export default defineConfig({
	plugins: [tailwindcss(), sveltekit(kit), keepIdleSockets],
	test: {
		include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
		environment: 'node',
		globals: true,
	},
});
