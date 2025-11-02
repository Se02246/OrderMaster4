// se02246/ordermaster4/OrderMaster4-impl_login/server/middleware.ts

import * as Clerk from '@clerk/clerk-sdk-node'; 
import 'dotenv/config';

// Definisce il middleware Clerk
const clerkMiddleware = Clerk.ClerkExpressWithAuth({
  secretKey: process.env.CLERK_SECRET_KEY,
});

// 🚨 CORREZIONE: Esporta come default per risolvere il TypeError in app.use()
export default clerkMiddleware;

// Rimuove gli export aggiuntivi che non erano usati nel file index.ts:
// export const requireAuth = Clerk.ClerkExpressRequireAuth({ ... }); 
// export const requireAuthMiddleware = (req, res, next) => { ... };
