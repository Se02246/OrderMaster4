import { useAuth } from '@clerk/clerk-react';
import { useCallback } from 'react';

// Questo hook fornisce una funzione `apiRequest` che
// allega automaticamente il token di autenticazione.
export const useApi = () => {
  const { getToken } = useAuth();

  // Usiamo useCallback per evitare ricreazioni inutili
  const apiRequest = useCallback(
    async <T = any>(
      method: 'GET' | 'POST' | 'PUT' | 'DELETE',
      endpoint: string, // es. '/employees'
      data?: any
    ): Promise<T> => {
      
      const token = await getToken();
      const url = `/api${endpoint}`; // Aggiunge /api automaticamente

      const options: RequestInit = {
        method,
        headers: new Headers({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }),
      };

      if (data && method !== 'GET') {
        options.body = JSON.stringify(data);
      }
      
      const response = await fetch(url, options);

      if (!response.ok) {
        // Prova a leggere l'errore dal corpo della risposta
        const errorBody = await response.json().catch(() => ({}));
        const errorMessage = errorBody.message || `Errore: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      if (response.status === 204) {
        // Caso "No Content" (es. per DELETE)
        return null as T;
      }

      return response.json() as Promise<T>;
    },
    [getToken] // L'hook si ricrea solo se `getToken` cambia
  );

  return { apiRequest };
};
