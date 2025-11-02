// se02246/ordermaster4/OrderMaster4-impl_login/server/middleware.ts

// 🚨 CORREZIONE: Usa l'importazione namespace (* as Clerk) per risolvere il 
// TypeError e accedere correttamente alla funzione in un ambiente ESM.
import * as Clerk from '@clerk/clerk-sdk-node';

// Questo è il middleware di autenticazione principale
// Deve usare "export const" per funzionare con l'index
export const clerkMiddleware = Clerk.createClerkExpressMiddleware({
  secretKey: process.env.CLERK_SECRET_KEY,
});

// Nota: se riscontri ancora problemi con l'importazione, 
// Clerk raccomanda di installare e usare il pacchetto dedicato @clerk/express.
