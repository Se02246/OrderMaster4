import 'dotenv/config';
import express from 'express';

import { clerkMiddleware } from './middleware';
import { apiRoutes } from './routes';
import viteMiddleware from './vite'; // MODIFICA: Rimosse le graffe

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
