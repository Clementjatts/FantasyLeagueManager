import express, { type Express } from "express";
import fs from "fs";
import path, { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { createServer } from "vite";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import { type Server } from "http";
import viteConfig from "../vite.config";

export async function setupVite(app: Express, server: Server) {
  const vite = await createServer({
    ...viteConfig,
    server: { middlewareMode: true },
    appType: "custom",
    base: "/",
  });

  app.use(vite.middlewares);

  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      // API requests should be handled by Express
      if (url.startsWith("/api/")) {
        next();
        return;
      }

      // Serve static files from the client directory
      let template = await vite.transformIndexHtml(
        url,
        `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Fantasy League Manager</title>
          </head>
          <body>
            <div id="root"></div>
            <script type="module" src="/src/main.tsx"></script>
          </body>
        </html>
        `
      );

      res.status(200).set({ "Content-Type": "text/html" }).end(template);
    } catch (e) {
      const error = e as Error;
      vite.ssrFixStacktrace(error);
      next(error);
    }
  });
}

export function serveStatic(app: Express) {
  app.use(express.static(resolve(__dirname, "../client/dist")));
}

export function log(message: string, source = "express") {
  const now = new Date();
  const time = now.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${time} [${source}] ${message}`);
}
