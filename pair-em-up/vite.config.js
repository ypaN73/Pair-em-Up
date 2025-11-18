import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  base: '/Pair-em-Up/', // Абсолютный путь с именем репозитория
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true
  }
});