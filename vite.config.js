import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' permite servir el build desde cualquier subruta (GitHub Pages, etc.)
export default defineConfig({
  base: './',
  plugins: [react()],
  server: { host: true, port: 5173 },
});
