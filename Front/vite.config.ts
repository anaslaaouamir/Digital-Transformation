import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/',
  server: {
    proxy: {
      // /api/* → dt-backend (Spring main backend) on 8080
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },

      // /lead_agent/* → dt-lead-intelli on port 8082
      // Confirmed API: POST http://localhost:8082/api/lead_agent/start
      // Rewrite: /lead_agent/start → /api/lead_agent/start on port 8082
      '/lead_agent': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/lead_agent/, '/api/lead_agent'),
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    chunkSizeWarningLimit: 3000,
  },
});