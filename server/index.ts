import 'dotenv/config'; // Importa all'inizio!
import express from 'express';
// NON importare più ./auth

// Importa il nuovo middleware di Clerk
import { clerkMiddleware } from './middleware'; 
import { apiRoutes } from './routes';
import { viteMiddleware } from './vite';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Rimuovi il vecchio app.use(session(...)) e setupAuth(app)
// ...

// Aggiungi il middleware Clerk PRIMA delle tue rotte API
app.use(clerkMiddleware);

// Rotte API
app.use('/api', apiRoutes);

// Middleware Vite per servire il client
app.use(viteMiddleware);

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
