// se02246/ordermaster4/OrderMaster4-impl_login/vite.config.ts

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig({
  // Mantenuto per risolvere index.html e l'input del build
  root: './client', 
  
  plugins: [react()],
  resolve: {
    alias: {
      // Alias @ corretto
      '@': path.resolve(__dirname, './client/src'),
      // Alias @shared corretto per risolvere l'errore di build precedente
      '@shared': path.resolve(__dirname, './shared'), 
    },
  },
  build: {
    // ⬇️ CORREZIONE CHIAVE: base: '/' garantisce che i percorsi degli asset (CSS/JS)
    // inizino con / (es. /assets/...) e vengano cercati dalla radice del dominio.
    base: '/', 
    // outDir risale di un livello per finire in /dist/client
    outDir: '../dist/client', 
    emptyOutDir: true,
    // publicDir è ora solo 'public' rispetto alla root di Vite (./client).
    publicDir: 'public', 
  },
});
