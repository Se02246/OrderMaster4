import { createClerkExpressMiddleware } from '@clerk/clerk-sdk-node';

// Questo è il middleware di autenticazione principale
// Deve usare "export const" per funzionare con l'index
export const clerkMiddleware = createClerkExpressMiddleware({
  secretKey: process.env.CLERK_SECRET_KEY,
});
