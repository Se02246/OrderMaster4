// se02246/ordermaster4/OrderMaster4-impl_login/server/index.ts

import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// 🚨 CORREZIONE: Importa i moduli come namespace per gestire l'avvolgimento di esbuild
import * as middlewareModule from './middleware'; 
import { apiRoutes } from './routes';
// Rimuovi l'importazione problematica di viteMiddlewareModule: import * as viteMiddlewareModule from './vite'; 

// Funzione helper per estrarre la funzione di default dal wrapper del bundler
const safeExtractDefault = (module: any) => module.default || module;

// Estrae la funzione middleware Clerk
const clerkMiddleware = safeExtractDefault(middlewareModule);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Aggiungi il middleware Clerk PRIMA delle tue rotte API
app.use(clerkMiddleware);
// Rotte API
app.use('/api', apiRoutes);

// --- CORREZIONE PER SERVIRE I FILE STATICI IN PRODUZIONE ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Calcola il percorso assoluto della cartella di build del client (dist/client è un livello sopra server/)
const clientDistPath = path.resolve(__dirname, '..', 'dist', 'client');

// RISOLUZIONE (per 404 e Service Worker)
// A causa della configurazione di build, gli asset sono in dist/client,
// ma altri file (index.html, sw.js) sono in dist/client/client.
// Dobbiamo servire entrambi i percorsi staticamente.

// 1. Serve 'dist/client' (per gli /assets)
app.use(express.static(clientDistPath));
// 2. Serve 'dist/client/client' (per sw.js e index.html alla root '/')
app.use(express.static(path.join(clientDistPath, 'client')));

// Gestione delle SPA: serve index.html per tutte le altre richieste (es. /calendar)
app.get('*', (req, res) => {
  // Invia 'index.html' dalla sottocartella 'client'
  res.sendFile(path.join(clientDistPath, 'client', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
