import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    const server = registerRoutes(app);

    // Global error handler
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error('Server Error:', err);
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      
      if (!res.headersSent) {
        res.status(status).json({ message });
      }
    });

    // Setup development/production environment
    if (app.get("env") === "development") {
      log("Starting server in development mode");
      await setupVite(app, server);
    } else {
      log("Starting server in production mode");
      serveStatic(app);
    }

    // Server configuration
    const PORT = process.env.PORT || 5000;
    const HOST = "0.0.0.0";

    // Start server with proper error handling
    if (!server.listening) {
      server.listen(Number(PORT), HOST, () => {
        log(`Server started successfully on http://${HOST}:${PORT}`);
      });

      server.on('error', (error: any) => {
        if (error.syscall !== 'listen') {
          throw error;
        }

        const bind = typeof PORT === 'string' ? 'Pipe ' + PORT : 'Port ' + PORT;

        // Handle specific listen errors with friendly messages
        switch (error.code) {
          case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
          case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
          default:
            throw error;
        }
      });

      // Handle graceful shutdown
      process.on('SIGTERM', () => {
        log('SIGTERM signal received: closing HTTP server');
        server.close(() => {
          log('HTTP server closed');
          process.exit(0);
        });
      });
    }
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();
