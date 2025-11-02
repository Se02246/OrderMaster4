// se02246/ordermaster4/OrderMaster4-impl_login/client/src/main.tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
// Rimosso BrowserRouter da qui, perché è già gestito in App.tsx
import { ClerkProvider } from '@clerk/clerk-react';
import App from './App';
import './index.css';

// Recupera la chiave pubblicabile dalle variabili d'ambiente di Vite
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error('Manca la chiave pubblicabile di Clerk (VITE_CLERK_PUBLISHABLE_KEY)');
}

// Registra il Service Worker (codice esistente)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      console.log('Service Worker registrato con successo:', registration);
    }).catch(registrationError => {
      console.log('Registrazione del Service Worker fallita:', registrationError);
    });
  });
}

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  
  root.render(
    <React.StrictMode>
      {/* ClerkProvider deve avvolgere l'intera applicazione 
        per fornire il contesto di autenticazione.
      */}
      <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
          <App />
      </ClerkProvider>
    </React.StrictMode>
  );
}
