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

// --- CODICE PER LA PRODUZIONE (CORREZIONE UI) ---
// Definisce __dirname per l'ambiente ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Trova la cartella di build del client (contiene index.html e la cartella assets)
const clientDistPath = path.resolve(__dirname, '..', 'dist', 'client');

// 1. Serve tutti i file statici dalla cartella di build di Vite (dist/client).
// Questo assicura che gli asset come il file CSS di Tailwind vengano caricati correttamente.
app.use(express.static(clientDistPath));

// 2. Gestione delle SPA (Single Page Application): invia 'index.html' per tutte le altre richieste.
// Questo è cruciale per il routing lato client (es. /calendar, /employees).
app.get('*', (req, res) => {
  // Invia l'index.html dalla radice della cartella di distribuzione (clientDistPath)
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
