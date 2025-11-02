// se02246/ordermaster4/OrderMaster4-impl_login/server/middleware.ts

// 🚨 CORREZIONE: Usiamo l'importazione namespace (* as Clerk) per catturare 
// tutti gli export in un ambiente ESM (come la tua build).
import * as Clerk from '@clerk/clerk-sdk-node'; 
import 'dotenv/config';

// Questo è il middleware di autenticazione principale
// 🚨 CORREZIONE: Il nome della funzione corretta è ClerkExpressWithAuth (o ClerkExpressRequireAuth 
// per proteggere strettamente tutte le route), non createClerkExpressMiddleware.
export const clerkMiddleware = Clerk.ClerkExpressWithAuth({
  secretKey: process.env.CLERK_SECRET_KEY,
});

// Il codice qui sotto non è necessario per l'errore attuale, ma ho 
// omesso le esportazioni extra che hai aggiunto in precedenza per mantenere 
// la soluzione mirata e pulita.
