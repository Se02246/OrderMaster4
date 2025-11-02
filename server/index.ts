// se02246/ordermaster4/OrderMaster4-impl_login/server/index.ts

import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

import * as middlewareModule from './middleware'; 
import { apiRoutes } from './routes';

const safeExtractDefault = (module: any) => module.default || module;
const clerkMiddleware = safeExtractDefault(middlewareModule);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(clerkMiddleware);
app.use('/api', apiRoutes);

// --- CORREZIONE PER SERVIRE I FILE STATICI ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistPath = path.resolve(__dirname, '..', 'dist', 'client');

// Serve gli asset da 'dist/client' (es. /assets/index-....js)
app.use(express.static(clientDistPath));

// Serve i file public da 'dist/client/client' (es. /sw.js, /index.html)
// Questo risolve l'errore MIME type per sw.js
app.use(express.static(path.join(clientDistPath, 'client')));

// Gestione delle SPA: invia 'index.html' dalla sottocartella 'client'
app.get('*', (req, res) => {
  res.sendFile(path.join(clientDistPath, 'client', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
