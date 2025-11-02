// se02246/ordermaster4/OrderMaster4-impl_login/vite.config.ts

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  // 🚨 CORREZIONE: Imposta il base path a '/' per garantire che gli asset 
  // siano richiesti come percorsi assoluti (es. /assets/...), evitando 
  // il fallback del server all'index.html.
  base: '/',
  plugins: [react()],
  root: path.resolve(__dirname, 'client'), // Usa 'client' come root
  build: {
    // Scegli una directory di output che non crei nidificazioni inutili. 
    // Poiché il server si aspetta i file in `dist/client`, manteniamo questo.
    outDir: path.resolve(__dirname, 'dist/client'),
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client/src"),
    },
  },
});
