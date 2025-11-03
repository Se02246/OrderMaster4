import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { configureVite } from "./vite.js";
import { configureRoutes } from "./routes.js";
import { authMiddleware } from "./middleware.js";

const app = express();
const port = process.env.PORT || 10000;

// Ottieni __dirname in un modulo ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware di base
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configurazione API (protetta da Clerk)
const apiRoutes = express.Router();
apiRoutes.use(authMiddleware);
configureRoutes(apiRoutes);
app.use("/api", apiRoutes);

// Configurazione Client (Vite o statico)
if (process.env.NODE_ENV === "production") {
  // 🚨 INIZIO CORREZIONE 🚨
  // In produzione, tutti i file (server e client) sono nella cartella 'dist'.
  // Diciamo a Express di servire i file statici da quella directory.
  
  // __dirname qui è /opt/render/project/src/dist
  app.use(express.static(__dirname));

  // Serve l'index.html per qualsiasi rotta non-API
  app.get("*", (req, res) => {
    if (!req.path.startsWith("/api")) {
      res.sendFile(path.join(__dirname, "index.html"));
    }
  });
  // 🚨 FINE CORREZIONE 🚨

} else {
  // In sviluppo, usa il middleware di Vite
  configureVite(app);
}

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
