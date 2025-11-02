import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // 1. Rimuovi root: 'client'
  
  resolve: {
    alias: {
      // 2. L'alias per '@' è ancora corretto
      '@': path.resolve(__dirname, './client/src'),
    },
  },
  build: {
    // 3. Modifica outDir
    outDir: 'dist/client',
    emptyOutDir: true,
    
    // 4. Aggiungi questo
    rollupOptions: {
      input: 'client/index.html'
    }
  },
})
