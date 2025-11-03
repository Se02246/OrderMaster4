// 🚨 CORREZIONE: Import aggiornato da '@clerk/hono' a '@hono/clerk-auth'
import { getAuth as clerkGetAuth, clerkMiddleware } from '@hono/clerk-auth';
import { db } from './db.js'; 
import * as schema from '../shared/schema.js';
import { eq } from 'drizzle-orm';
import { createFactory } from 'hono/factory';

const factory = createFactory();

export const clerkAuthMiddleware = factory.createMiddleware(
  clerkMiddleware({
    publishableKey: process.env.VITE_CLERK_PUBLISHABLE_KEY,
    secretKey: process.env.CLERK_SECRET_KEY,
    // Imposta l'utente nel contesto e cerca/crea nel DB
    signInUrl: '/sign-in', 
    signUpUrl: '/sign-up', 
    afterAuth: async (auth, c) => {
      if (auth.userId && auth.sessionClaims) {
        try {
          // Controlla se l'utente esiste già nel tuo DB
          const user = await db.query.users.findFirst({
            where: eq(schema.users.clerkId, auth.userId),
          });

          if (!user) {
            // Se l'utente non esiste, crealo
            const email = auth.sessionClaims.email || 'no-email@provided.com'; // Gestisci email mancante
            const name = auth.sessionClaims.name || auth.sessionClaims.firstName || 'No Name'; // Gestisci nome mancante

            await db.insert(schema.users).values({
              clerkId: auth.userId,
              email: email,
              name: name,
              role: 'user', // Ruolo di default
            });
          }
          // L'utente esiste, continua
        } catch (error) {
          console.error("Errore durante la sincronizzazione dell'utente:", error);
          // Non bloccare l'accesso se la sincronizzazione fallisce, ma logga l'errore
        }
      }
    },
  })
);

// Middleware per ottenere l'auth e l'utente del DB
export const getAuth = factory.createMiddleware(async (c, next) => {
  const auth = clerkGetAuth(c);
  if (auth?.userId) {
    const user = await db.query.users.findFirst({
      where: eq(schema.users.clerkId, auth.userId),
    });
    c.set('user', user);
  }
  await next();
});
