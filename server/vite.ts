// se02246/ordermaster4/OrderMaster4-impl_login/server/vite.ts

import { Request, Response, NextFunction } from 'express';
import { createServer } from 'vite';
import path from 'path';
// 🚨 CORREZIONE 1: Importa i moduli necessari per definire __dirname in ESM
import { fileURLToPath } from 'url';
// 🚨 CORREZIONE 2: Importa express per usare express.static() in produzione
import express from 'express'; 

// 🚨 CORREZIONE 1: Definizione di __dirname e __filename per ambienti ES Module (ESM)
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
    // Usiamo la __dirname definita per l'ambiente ESM.
    const distPath = path.resolve(__dirname, '../client'); 
    
    // Servi i file statici (CSS, JS, immagini) da dist/client/assets
    const staticMiddleware = express.static(distPath, {
      index: false, 
    });
    
    staticMiddleware(req, res, () => {
      // Per tutte le altre richieste (es. /calendar, /employees),
      // invia l'index.html principale per il routing lato client.
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }
};

// MODIFICA: usa export default
export default viteMiddleware;
