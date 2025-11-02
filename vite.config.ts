import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Rimuovi root: 'client' se c'è
  
  resolve: {
    alias: {
      // L'alias @ ora punta a client/src dalla root
      '@': path.resolve(__dirname, './client/src'),
    },
  },
  build: {
    // L'output è relativo alla root
    outDir: 'dist/client',
    emptyOutDir: true,
    
    // Questo dice a Vite dove trovare l'HTML
    rollupOptions: {
      input: 'client/index.html'
    }
  },
})
