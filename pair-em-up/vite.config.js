import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  base: '/pair-em-up/',
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
});