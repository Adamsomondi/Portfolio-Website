import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://portfolio-website-k93t.onrender.com',
        changeOrigin: true,
        secure: true,
      },
    },
  },
});