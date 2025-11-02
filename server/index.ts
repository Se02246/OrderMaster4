// se02246/ordermaster4/OrderMaster4-impl_login/server/index.ts

import 'dotenv/config';
import express from 'express';

// 🚨 CORREZIONE: Cambia da import nominato a import default per clerkMiddleware
import clerkMiddleware from './middleware'; // Manteniamo il nome dell'import

import { apiRoutes } from './routes';
import viteMiddleware from './vite'; 

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// CORREZIONE PER L'ERRORE: TypeError: app.use() requires a middleware function
// A causa del bundling di esbuild con format=esm, l'esportazione di default 
// può essere incapsulata nella proprietà 'default' dell'oggetto modulo.
const clerkAuthMiddleware = (clerkMiddleware as any).default || clerkMiddleware;

// Aggiungi il middleware Clerk PRIMA delle tue rotte API
app.use(clerkAuthMiddleware);

// Rotte API
app.use('/api', apiRoutes);

// Middleware Vite per servire il client
app.use(viteMiddleware);

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
