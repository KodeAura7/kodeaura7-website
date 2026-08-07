import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { viteSeoPlugin } from './vite-plugin-seo.js';

const PUBLIC_ROUTES = ['/', '/services', '/portfolio', '/about'];

export default defineConfig({
  plugins: [react(), viteSeoPlugin()],
  server: {
    port: 5173,
    proxy: {
      '/api': process.env.VITE_API_PROXY || 'http://localhost:4000',
      '/assets': process.env.VITE_API_PROXY || 'http://localhost:4000'
    }
  },
  ssr: {
    // react-helmet-async's published exports don't interop cleanly with Node's
    // native ESM loader when left externalized in the SSR bundle — bundle it in.
    noExternal: ['react-helmet-async']
  },
  ssgOptions: {
    dirStyle: 'nested',
    beastiesOptions: false,
    includedRoutes(paths) {
      // vite-react-ssg's routesToPaths() only prefixes nested child paths with '/'
      // when their parent segment is non-root, so top-level children of the '/'
      // route (e.g. 'services') come back without a leading slash — normalize
      // both sides before comparing against PUBLIC_ROUTES.
      return paths.filter((p) => PUBLIC_ROUTES.includes(p === '/' ? '/' : `/${p.replace(/^\//, '')}`));
    }
  }
});
