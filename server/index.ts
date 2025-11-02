import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// Importa solo il middleware di Clerk e le rotte
import * as middlewareModule from './middleware'; 
import { apiRoutes } from './routes';

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

// --- CODICE PER LA PRODUZIONE (CORREZIONE FINALE) ---
// Definisce __dirname per l'ambiente ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Trova la cartella di build del client 
const clientDistPath = path.resolve(__dirname, '..', 'dist', 'client');

// 1. Serve tutti i file statici dalla cartella di base di Vite (dist/client).
// Questo gestisce correttamente la cartella 'assets/' (CSS/JS).
app.use(express.static(clientDistPath));

// Abbiamo rimosso la riga "app.use(express.static(path.join(clientDistPath, 'client')))"
// che in precedenza causava conflitti e la UI corrotta.

// 2. Gestione delle SPA: invia 'index.html' per tutte le altre richieste.
// CORREZIONE: Usiamo il percorso annidato 'client/index.html' come indicato dal log di build.
app.get('*', (req, res) => {
  res.sendFile(path.join(clientDistPath, 'client', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
