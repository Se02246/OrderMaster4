// se02246/ordermaster4/OrderMaster4-impl_login/vite.config.ts

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(path.dirname(fileURLToPath(import.meta.url)), './client/src'),
    },
  },
  build: {
    // ⬇️ CORREZIONE 1: Imposta i percorsi relativi in index.html.
    base: './', 
    // L'output è relativo alla root (quindi dist/client)
    outDir: 'dist/client', 
    emptyOutDir: true,
    // La cartella per i file pubblici che non vengono importati (es. sw.js)
    publicDir: 'client/public', 
  },
});
