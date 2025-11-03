import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// Importa solo il middleware di Clerk e le rotte
import * as middlewareModule from './middleware'; 
import { apiRoutes } from './routes';

const safeExtractDefault = (module: any) => module.default || module;
const clerkMiddleware = safeExtractDefault(middlewareModule);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Aggiungi il middleware Clerk PRIMA delle tue rotte API
app.use(clerkMiddleware);
// Rotte API
app.use('/api', apiRoutes);

// --- CODICE PER LA PRODUZIONE (CORREZIONE UI E PATH) ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Trova la cartella di build del client (dist/client)
// CORREZIONE CHIAVE: In ambiente di produzione (dopo esbuild), __dirname è 'dist'.
// Usare path.join(__dirname, 'client') risolve correttamente in 'dist/client'.
const clientDistPath = path.join(__dirname, 'client');

// 1. Serve tutti i file statici dalla cartella di base di Vite (dist/client).
// Gestisce /assets/index-....css e altri asset.
app.use(express.static(clientDistPath));

// 2. Gestione delle SPA: invia 'index.html' per tutte le altre richieste.
app.get('*', (req, res) => {
  // Ora path.join risolve in modo pulito a: /opt/render/project/src/dist/client/index.html
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
