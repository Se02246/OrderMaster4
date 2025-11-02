// se02246/ordermaster4/OrderMaster4-impl_login/server/index.ts

import 'dotenv/config';
import express from 'express';

// 🚨 CORREZIONE: Importa il modulo middleware come namespace per gestire 
// l'wrapping di esbuild intorno all'export default.
import * as middlewareModule from './middleware'; 
import { apiRoutes } from './routes';
import viteMiddleware from './vite'; 

// 🚨 CORREZIONE: Estrae la funzione middleware dalla proprietà 'default' 
// o usa il modulo stesso se non ha la proprietà 'default' (per maggiore compatibilità).
const clerkMiddleware = (middlewareModule as any).default || middlewareModule;


const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Aggiungi il middleware Clerk PRIMA delle tue rotte API
app.use(clerkMiddleware);

// Rotte API
app.use('/api', apiRoutes);

// Middleware Vite per servire il client
app.use(viteMiddleware);

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
