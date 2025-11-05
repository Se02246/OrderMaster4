import express, { type Express, type Request, type Response, type NextFunction } from "express"; // Importa Request, Response, NextFunction
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

// === INIZIO MODIFICA ===
export function serveStatic(app: Express) {
  // Il server compilato è in 'dist/server/vite.js'
  // Dobbiamo risalire di due livelli (../../) per trovare la root
  // e poi scendere in 'client/dist'
  const distPath = path.resolve(import.meta.dirname, "../../client/dist");

  log(`Serving static files from: ${distPath}`, "express");

  if (!fs.existsSync(distPath)) {
    log(`Build directory NOT FOUND at: ${distPath}`, "express-ERROR");
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  // 1. Servi i file statici (es. /assets/index-BlU5T4zM.js)
  app.use(express.static(distPath));

  // 2. La rotta catch-all serve index.html solo per le rotte NON-API
  app.use("*", (req: Request, res: Response, next: NextFunction) => {
    // Salta le richieste API, altrimenti non funzioneranno
    if (req.originalUrl.startsWith("/api")) {
      return next();
    }
    // Per tutte le altre richieste (es. /calendar, /), invia l'app React
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
// === FINE MODIFICA ===
