import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Enhanced logging middleware
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

process.on('uncaughtException', (error: Error) => {
  log(`Uncaught Exception: ${error.message}`);
  log(error.stack || 'No stack trace available');
  process.exit(1);
});

process.on('unhandledRejection', (reason: unknown) => {
  log(`Unhandled Promise Rejection: ${reason instanceof Error ? reason.message : String(reason)}`);
  if (reason instanceof Error && reason.stack) {
    log(reason.stack);
  }
  process.exit(1);
});

(async () => {
  try {
    log("Starting server initialization...");
    const server = registerRoutes(app);

    // Enhanced error handling middleware
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      log(`Error encountered: ${message}`);
      if (err.stack) {
        log(`Stack trace: ${err.stack}`);
      }
      res.status(status).json({ message });
    });

    // Setup environment
    const isDevMode = app.get("env") === "development";
    if (isDevMode) {
      log("Setting up Vite development server...");
      try {
        await setupVite(app, server);
        log("Vite development server setup completed");
      } catch (error) {
        log(`Failed to setup Vite: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
      }
    } else {
      log("Setting up static file serving...");
      serveStatic(app);
      log("Static file serving setup completed");
    }

    // Start server with enhanced error handling
    const PORT = process.env.PORT || 5000;
    if (!server.listening) {
      server.listen(Number(PORT), "0.0.0.0", () => {
        log(`Server started successfully on port ${PORT}`);
        log(`Server running in ${isDevMode ? 'development' : 'production'} mode`);
      }).on('error', (error: Error) => {
        log(`Failed to start server: ${error.message}`);
        if (error.stack) {
          log(`Server startup error stack trace: ${error.stack}`);
        }
        process.exit(1);
      });
    }
  } catch (error) {
    log(`Critical server error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    if (error instanceof Error && error.stack) {
      log(`Stack trace: ${error.stack}`);
    }
    process.exit(1);
  }
})();
