import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    open: false,
    proxy: {
      // Обход CORS для локальной разработки, пока вопрос не решён на бэке
      // (см. buyer_mvp/api.ts и бриф, раздел 10). В проде используется
      // VITE_API_BASE напрямую, прокси в билд не попадает.
      '/api/v1/catalog': {
        target: 'http://104.171.133.95',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
