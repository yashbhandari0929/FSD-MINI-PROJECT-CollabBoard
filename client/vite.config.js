import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true, // Listen on all network addresses for easy group/LAN access
    allowedHosts: true, // Allow localtunnel, ngrok, and all tunnel hostnames
    proxy: {
      '/api': {
        target: 'http://localhost:5005',
        changeOrigin: true
      },
      '/socket.io': {
        target: 'http://localhost:5005',
        ws: true,
        changeOrigin: true
      }
    }
  }
});
