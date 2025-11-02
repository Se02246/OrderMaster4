import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // 1. Rimuovi `root: 'client'`.
  //    Ora Vite opererà dalla cartella principale e troverà `node_modules`.
  
  resolve: {
    alias: {
      // 2. L'alias per '@' è ancora corretto, punta a client/src
      '@': path.resolve(__dirname, './client/src'),
    },
  },
  build: {
    // 3. Modifica outDir perché sia relativo alla root.
    outDir: 'dist/client',
    emptyOutDir: true,
    
    // 4. Aggiungi questo. È il passo cruciale:
    //    Dice a Vite dove trovare il file HTML di input,
    //    visto che non è più nella root.
    rollupOptions: {
      input: 'client/index.html'
    }
  },
})
