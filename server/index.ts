// se02246/ordermaster4/OrderMaster4-impl_login/server/index.ts

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

// --- CODICE PER LA PRODUZIONE (CORREZIONE UI FINALE) ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Trova la cartella di build del client (contiene /assets e client/index.html)
const clientDistPath = path.resolve(__dirname, '..', 'dist', 'client');

// 1. CORREZIONE: Serve tutti i file statici dalla cartella di base di Vite (dist/client).
// Questo gestisce le richieste per /assets/ (CSS/JS) generate con base: '/'.
app.use(express.static(clientDistPath));

// 2. Gestione delle SPA: invia 'index.html' per tutte le altre richieste.
// Usa il percorso annidato 'client/index.html' come confermato dai log di build.
app.get('*', (req, res) => {
  // Nota: se il file sw.js o altri asset pubblici non vengono trovati,
  // la riga express.static sopra dovrebbe coprirli.
  res.sendFile(path.join(clientDistPath, 'client', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
