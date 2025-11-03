import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "path"; // <-- Assicurati che 'path' sia importato

export default defineConfig({
  root: "client",
  plugins: [react(), tsconfigPaths()],

  // 🚨 INIZIO CORREZIONE 🚨
  // Questa sezione forza Vite a cercare i file postcss.config.js
  // e tailwind.config.ts nella cartella principale del progetto
  // (process.cwd()), invece che dentro la cartella 'client/'.
  css: {
    postcss: {
      config: {
        path: path.resolve(process.cwd()),
      },
    },
  },
  // 🚨 FINE CORREZIONE 🚨

  build: {
    outDir: "../dist",
    emptyOutDir: true,
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
