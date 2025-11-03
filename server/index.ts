import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { configureVite } from "./vite.js";
import { app as routesApp } from "./routes.js";
// 🚨 CORREZIONE: 
// Importa 'getRequestListener' dal pacchetto @hono/node-server
import { getRequestListener } from '@hono/node-server';

const app = express();
const port = process.env.PORT || 10000;

// Ottieni __dirname in un modulo ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware di base
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configurazione API (gestita da Hono)
// 🚨 CORREZIONE: 
// Configurazione API (gestita da Hono)
// Usa 'getRequestListener' e passa l'handler .fetch di Hono
app.use("/api", getRequestListener(routesApp.fetch));

// Configurazione Client (Vite o statico)
if (process.env.NODE_ENV === "production") {
  // In produzione, tutti i file (server e client) sono nella cartella 'dist'.
  app.use(express.static(__dirname));

  // Serve l'index.html per qualsiasi rotta non-API
  app.get("*", (req, res) => {
    if (!req.path.startsWith("/api")) {
      res.sendFile(path.join(__dirname, "index.html"));
    }
  });
} else {
  // In sviluppo, usa il middleware di Vite
  configureVite(app);
}

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
