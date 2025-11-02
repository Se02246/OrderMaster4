// se02246/ordermaster4/OrderMaster4-impl_login/vite.config.ts

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
// 🚨 CORREZIONE: Importa i moduli necessari per definire __dirname in ESM
import { fileURLToPath } from 'url';

// 🚨 CORREZIONE: Definisce __dirname e __filename per l'uso in ambiente ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Aggiunto per risolvere i problemi di caricamento asset (errore MIME type precedente)
  base: '/', 
  
  resolve: {
    alias: {
      // Usa la __dirname definita per risolvere i percorsi
      '@': path.resolve(__dirname, './client/src'),
      '@shared': path.resolve(__dirname, './shared'), 
    },
  },
  build: {
    outDir: 'dist/client',
    emptyOutDir: true,
    rollupOptions: {
      input: 'client/index.html'
    }
  },
})
