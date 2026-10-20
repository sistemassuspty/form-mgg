import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import jetVitePlugin from '@jet-admin/jet-vite-plugin';
import path from 'path';

export default defineConfig({
  plugins: [jetVitePlugin(), react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    allowedHosts: true,
  },
});
