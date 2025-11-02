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
    
    // 🚨 CORREZIONE: puntiamo alla sottocartella 'client' all'interno di 'dist' 
    // (__dirname punta già a 'dist').
    const distPath = path.resolve(__dirname, './client'); 
    
    // 2. Middleware per servire i file statici
    const staticMiddleware = express.static(distPath, {
      index: false, // Impedisce a express.static di servire index.html come default
      maxAge: '1y' // Cache per i file statici
    });
    
    staticMiddleware(req, res, (err) => {
      if (err) {
        console.error('Static file error:', err);
        return res.status(500).send('Internal Server Error');
      }
      
      // 3. Per tutte le altre richieste (ad esempio /calendar, /employees),
      // invia l'index.html principale per il routing lato client (Single Page App).
      res.sendFile(path.resolve(distPath, 'index.html'), (err) => {
          if (err) {
              // Potrebbe verificarsi se index.html non esiste nel percorso atteso
              console.error('Error sending index.html:', err);
              res.status(500).send('Could not find index.html');
          }
      });
    });
  }
};

export default viteMiddleware;
