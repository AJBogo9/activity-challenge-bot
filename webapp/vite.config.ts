import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  },
  build: {
    outDir: '../dist/webapp',
    emptyOutDir: true,
    target: 'esnext',
    minify: 'esbuild' // Fast and efficient
  }
});
