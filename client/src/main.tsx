// se02246/ordermaster4/OrderMaster4-impl_login/client/src/main.tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';

// IMPORTAZIONI NECESSARIE PER REACT QUERY
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient'; 

import App from './App';
import './index.css'; // Importa il CSS di Tailwind

// Recupera la chiave pubblicabile dalle variabili d'ambiente di Vite
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error('Manca la chiave pubblicabile di Clerk (VITE_CLERK_PUBLISHABLE_KEY)');
}

// Registra il Service Worker (codice esistente)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Assicurati che il file sw.js sia in /client/public/sw.js
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
      {/* Questa struttura di provider è FONDAMENTALE.
        Mancando QueryClientProvider l'app crasha e la UI si corrompe.
      */}
      <QueryClientProvider client={queryClient}>
        <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
            <App />
        </ClerkProvider>
      </QueryClientProvider>
    </React.StrictMode>
  );
}
