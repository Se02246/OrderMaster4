// se02246/ordermaster4/OrderMaster4-impl_login/server/vite.ts

import { Request, Response, NextFunction } from 'express';
import { createServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express'; 

// 1. Definisce __dirname per l'ambiente ES Module (necessario per path.resolve)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const viteMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV === 'development') {
    // Sviluppo: usa Vite Dev Server
    const vite = await createServer({
      server: { middlewareMode: true },
      configFile: path.resolve(__dirname, '../../vite.config.ts'), 
    });
    vite.middlewares(req, res, next);
  } else {
    // Produzione: servi i file statici e passa il resto a index.html
    
    // Path alla root dei file client compilati: /opt/render/project/src/dist/client
    // Qui risiedono: sw.js e la cartella assets/ e la cartella client/index.html
    const clientRootPath = path.resolve(__dirname, './client'); 
    
    // Path al file index.html annidato (dist/client/client/index.html)
    const indexHtmlPath = path.resolve(clientRootPath, 'client/index.html'); 
    
    // 2. Middleware per servire TUTTI i file statici (JS, CSS, Immagini, sw.js)
    // Se la richiesta corrisponde a un file in clientRootPath, express.static la gestisce e termina.
    const staticMiddleware = express.static(clientRootPath, {
      index: false, 
      maxAge: '1y' 
    });
    
    // Usiamo il middleware statico
    staticMiddleware(req, res, (err) => {
      if (err) {
        console.error('Static file error (first attempt):', err);
        return res.status(500).send('Internal Server Error');
      }
      
      // Se la richiesta NON ha trovato un file statico (cioè è un percorso SPA come /calendar o /)
      // invia l'index.html nidificato per il routing lato client.
      res.sendFile(indexHtmlPath, (err) => {
          if (err) {
              // Se l'index.html non può essere servito, c'è un errore grave (improbabile ora).
              console.error('Error sending index.html:', err);
              res.status(500).send('Could not find SPA index.html');
          }
      });
    });
  }
};

export default viteMiddleware;
