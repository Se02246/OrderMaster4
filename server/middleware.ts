// se02246/ordermaster4/OrderMaster4-impl_login/server/middleware.ts

// 🚨 CORREZIONE: Importa la libreria come default export 'Clerk'
import Clerk from '@clerk/clerk-sdk-node'; 
import 'dotenv/config';

// Clerk non esporta 'createClerkExpressMiddleware' come named export. 
// La funzione è una proprietà dell'oggetto Clerk importato di default.
export const clerkMiddleware = Clerk.createClerkExpressMiddleware({
  secretKey: process.env.CLERK_SECRET_KEY,
});

export const requireAuth = Clerk.ClerkExpressRequireAuth({
    secretKey: process.env.CLERK_SECRET_KEY,
});

export const requireAuthMiddleware = (
    req: any, 
    res: any, 
    next: any
) => {
    // Prima usa il middleware standard di requireAuth
    Clerk.ClerkExpressRequireAuth({
        secretKey: process.env.CLERK_SECRET_KEY,
    })(req, res, (err: any) => {
        if (err) {
            // Se l'autenticazione fallisce (errore 401)
            return res.status(401).send('Unauthorized: ' + err.message);
        }
        // Se l'autenticazione ha successo, procedi
        next();
    });
};
