// se02246/ordermaster4/OrderMaster4-impl_login/vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // 📍 CORREZIONE: Dice a Vite dove trovare i file statici (es. sw.js)
  publicDir: 'client/public',

  resolve: {
    alias: {
      // Questo alias punta a client/src
      '@': path.resolve(__dirname, './client/src'),
      
      // Questo alias punta alla cartella 'shared' nella root
      '@shared': path.resolve(__dirname, './shared'), 
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
