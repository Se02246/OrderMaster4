import { Request, Response, NextFunction } from 'express';
import { createServer } from 'vite';
import path from 'path';

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
