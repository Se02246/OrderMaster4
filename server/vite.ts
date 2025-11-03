import { Express } from "express";
import { createServer } from "vite";

export async function configureVite(app: Express) {
  // Crea il server Vite in modalità middleware
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: "spa", 
    // 🚨 CORREZIONE: La riga 'root: "client"' è stata rimossa da qui
    // perché è già specificata in 'vite.config.ts'.
  });

  // Usa il middleware di Vite
  app.use(vite.middlewares);
}
