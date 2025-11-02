import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  // ⬇️ CORREZIONE CHIAVE: Diciamo a Vite che la root del client è la cartella './client'.
  root: './client', 
  
  plugins: [react()],
  resolve: {
    alias: {
      // Manteniamo l'alias, ora risolto rispetto alla nuova root (che è già ./client)
      '@': path.resolve(path.dirname(fileURLToPath(import.meta.url)), './client/src'),
    },
  },
  build: {
    // ⬇️ outDir deve risalire di un livello (../) per finire in /dist/client.
    outDir: '../dist/client', 
    // Manteniamo base: './' per risolvere i percorsi degli asset (CSS/JS) in index.html.
    base: './', 
    emptyOutDir: true,
    // ⬇️ publicDir è ora solo 'public' rispetto alla nuova root di Vite (./client).
    publicDir: 'public', 
  },
});
