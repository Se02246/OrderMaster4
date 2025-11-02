// se02246/ordermaster4/OrderMaster4-impl_login/server/index.ts

import 'dotenv/config';
import express from 'express';
// Importa gli strumenti 'path' e 'url' necessari per la gestione dei percorsi in ambiente ESM
import path from 'path';
import { fileURLToPath } from 'url';

// 🚨 CORREZIONE: Importa i moduli come namespace per gestire l'avvolgimento di esbuild
import * as middlewareModule from './middleware'; 
import { apiRoutes } from './routes';
// Rimosso: import * as viteMiddlewareModule from './vite'; 

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
// Definisce __dirname e __filename per l'uso in ambiente ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Calcola il percorso assoluto della cartella di build del client (dist/client è un livello sopra server/)
const clientDistPath = path.resolve(__dirname, '..', 'dist', 'client');

// Middleware per servire i file statici del client (percorso di build: dist/client)
// Questo risolve l'errore "app.use() requires a middleware function" in produzione.
app.use(express.static(clientDistPath));

// Gestione delle SPA: serve index.html per tutte le altre richieste non gestite
// (essenziale per React Router/routing lato client)
app.get('*', (req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
