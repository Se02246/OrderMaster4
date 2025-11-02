// se02246/ordermaster4/OrderMaster4-impl_login/vite.config.ts

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig({
  // Manteniamo la root per risolvere correttamente index.html
  root: './client', 
  
  plugins: [react()],
  resolve: {
    alias: {
      // @ si risolve in client/src
      '@': path.resolve(__dirname, './client/src'),
      // ⬇️ CORREZIONE CHIAVE: L'alias @shared deve puntare alla cartella 'shared'
      // Questo usa __dirname (la root del progetto) per puntare alla cartella 'shared'
      '@shared': path.resolve(__dirname, './shared'), 
    },
  },
  build: {
    // outDir risale di un livello per finire in /dist/client
    outDir: '../dist/client', 
    // Manteniamo base: './' per risolvere i percorsi degli asset (CSS/JS) in index.html.
    base: './', 
    emptyOutDir: true,
    // publicDir è ora solo 'public' rispetto alla nuova root di Vite (./client).
    publicDir: 'public', 
  },
});
