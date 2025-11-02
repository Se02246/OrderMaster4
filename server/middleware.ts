// se02246/ordermaster4/OrderMaster4-impl_login/server/middleware.ts

import * as Clerk from '@clerk/clerk-sdk-node'; 
import 'dotenv/config';

// Definisce il middleware Clerk usando il nome di funzione corretto
const clerkMiddleware = Clerk.ClerkExpressWithAuth({
  secretKey: process.env.CLERK_SECRET_KEY,
});

// Esporta come default
export default clerkMiddleware;
