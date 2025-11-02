// se02246/ordermaster4/OrderMaster4-impl_login/server/index.ts

import 'dotenv/config';
import express from 'express';

// 🚨 CORREZIONE: Importa i moduli come namespace per gestire l'avvolgimento di esbuild
import * as middlewareModule from './middleware'; 
import { apiRoutes } from './routes';
import * as viteMiddlewareModule from './vite'; 

// Funzione helper per estrarre la funzione di default dal wrapper del bundler
// (es. estrae la funzione da { default: [Function] })
const safeExtractDefault = (module: any) => module.default || module;

// Estrae le funzioni middleware
const clerkMiddleware = safeExtractDefault(middlewareModule);
const viteMiddleware = safeExtractDefault(viteMiddlewareModule);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Aggiungi il middleware Clerk PRIMA delle tue rotte API
app.use(clerkMiddleware); // Ora clerkMiddleware è garantito essere la funzione

// Rotte API
app.use('/api', apiRoutes);

// Middleware Vite per servire il client
app.use(viteMiddleware); // Garantisce che anche viteMiddleware sia una funzione

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
