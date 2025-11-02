// se02246/ordermaster4/OrderMaster4-impl_login/server/index.ts

import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// Importa solo il middleware di Clerk e le rotte
import * as middlewareModule from './middleware'; 
import { apiRoutes } from './routes';
// RIMUOVE QUALSIASI IMPORTAZIONE DI './vite'

// Funzione helper per estrarre la funzione di default
const safeExtractDefault = (module: any) => module.default || module;

// Estrae solo il middleware Clerk
const clerkMiddleware = safeExtractDefault(middlewareModule);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Aggiungi il middleware Clerk PRIMA delle tue rotte API
app.use(clerkMiddleware);
// Rotte API
app.use('/api', apiRoutes);

// --- CODICE PER LA PRODUZIONE (RISOLVE IL 502) ---
// Definisce __dirname per l'ambiente ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Trova la cartella di build del client
const clientDistPath = path.resolve(__dirname, '..', 'dist', 'client');

// 1. Serve gli asset da 'dist/client' (es. /assets/index-....js)
app.use(express.static(clientDistPath));

// 2. Serve i file public da 'dist/client/client' (es. /sw.js, /index.html)
// Questo risolve l'errore MIME type per sw.js e il 404 per index.html
app.use(express.static(path.join(clientDistPath, 'client')));

// 3. Gestione delle SPA: invia 'index.html' dalla sottocartella 'client'
// per tutte le altre richieste (es. /calendar, /employees)
app.get('*', (req, res) => {
  res.sendFile(path.join(clientDistPath, 'client', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
