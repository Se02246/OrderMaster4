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
      // Configurazione allineata a vite.config.ts
      configFile: path.resolve(__dirname, '../../vite.config.ts'), 
    });
    vite.middlewares(req, res, next);
  } else {
    // Produzione: servi i file statici e passa il resto a index.html
    
    // Path alla root dei file client compilati (dove si trova la cartella 'assets')
    const clientRootPath = path.resolve(__dirname, './client'); 
    
    // Path al file index.html annidato (dist/client/client/index.html)
    const indexHtmlPath = path.resolve(clientRootPath, 'client/index.html'); 
    
    // 2. Middleware per servire i file statici (JS, CSS, Immagini)
    const staticMiddleware = express.static(clientRootPath, {
      index: false, 
      maxAge: '1y' 
    });
    
    // 3. Esegue staticMiddleware. Se un asset viene trovato (ad es. /assets/...), la richiesta finisce qui.
    staticMiddleware(req, res, (err) => {
      if (err) {
        console.error('Static file error:', err);
        return res.status(500).send('Internal Server Error');
      }
      
      // 4. Fallback per tutte le altre richieste (SPA routing)
      // Se un file non statico viene richiesto (ad esempio / o /employees), invia l'index.html
      res.sendFile(indexHtmlPath, (err) => {
          if (err) {
              console.error('Error sending index.html:', err);
              console.error('Failed to serve SPA route:', req.path); 
              res.status(404).send('Not Found');
          }
      });
    });
  }
};

export default viteMiddleware;
