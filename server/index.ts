import 'dotenv/config'; // Importa all'inizio!
import express from 'express';

// Importa con {} i file che usano "export const"
import { clerkMiddleware } from './middleware';
import { apiRoutes } from './routes';

// Importa senza {} il file che usa "export default"
import viteMiddleware from './vite';

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
