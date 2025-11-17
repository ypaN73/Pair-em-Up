import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  base: '/your-repo-name/', // ЗАМЕНИТЕ your-repo-name на имя вашего репозитория
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