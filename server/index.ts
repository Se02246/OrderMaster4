// se02246/ordermaster4/OrderMaster4-impl_login/server/index.ts

import 'dotenv/config';
import express from 'express';

// Rimuovi l'importazione statica del middleware Clerk

import { apiRoutes } from './routes';
import viteMiddleware from './vite'; 

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Avvolgi la logica in una funzione asincrona per usare l'importazione dinamica
async function startServer() {
  
  // FIX DEFINITIVO: Usa l'importazione dinamica per risolvere correttamente 
  // l'export di default del middleware Clerk.
  const clerkModule = await import('./middleware'); 
  const clerkAuthMiddleware = clerkModule.default;

  // Aggiungi il middleware Clerk PRIMA delle tue rotte API
  // Ora clerkAuthMiddleware è garantito essere la funzione middleware
  app.use(clerkAuthMiddleware);

  // Rotte API
  app.use('/api', apiRoutes);

  // Middleware Vite per servire il client
  app.use(viteMiddleware);

  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

startServer();
