/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In dev, /api is proxied to the Spring Boot loan-assessment-api on port 8080,
// so the browser never needs CORS. Set VITE_API_URL to call another host.
export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_PAGES ? '/loan-assessment-dashboard/' : '/',
  server: {
    proxy: { '/api': 'http://localhost:8080' },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.ts',
  },
});
