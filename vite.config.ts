import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Client-Side Dev Proxy Configuration
const proxyTarget = process.env.VITE_API_PROXY_TARGET || process.env.VITE_API_URL || 'https://bishal-travels.onrender.com';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: proxyTarget,
        changeOrigin: true,
        secure: false,
        headers: {
          'X-Client-Proxy': 'ViteDevServerProxy'
        },
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.warn('[Client-Side Proxy Error]:', err.message);
          });
          proxy.on('proxyReq', (_proxyReq, req, _res) => {
            // Forward original host for proper server-side proxy handling
            _proxyReq.setHeader('X-Forwarded-Host', req.headers.host || 'localhost:5173');
          });
        }
      }
    }
  }
});
