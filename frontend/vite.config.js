import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { viteSeoPlugin } from './vite-plugin-seo.js';

export default defineConfig({
  plugins: [react(), viteSeoPlugin()],
  server: {
    port: 5173,
    proxy: {
      '/api': process.env.VITE_API_PROXY || 'http://localhost:4000'
    }
  }
});
