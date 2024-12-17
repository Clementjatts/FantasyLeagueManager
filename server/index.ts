import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import cors from "cors";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// Basic middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

// Request logging middleware with detailed error logging
app.use((req, res, next) => {
  const start = Date.now();
  
  // Capture original send/json methods
  const originalSend = res.send;
  const originalJson = res.json;
  
  // Override send
  res.send = function (body: any) {
    if (req.path.startsWith("/api")) {
      log(`Response body: ${typeof body === 'string' ? body : JSON.stringify(body)}`);
    }
    return originalSend.apply(res, [body]);
  };
  
  // Override json
  res.json = function (body: any) {
    if (req.path.startsWith("/api")) {
      log(`Response body: ${JSON.stringify(body)}`);
    }
    return originalJson.apply(res, [body]);
  };
  
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (req.path.startsWith("/api")) {
      log(`${req.method} ${req.path} ${res.statusCode} in ${duration}ms`);
    }
  });
  
  next();
});

// Start server
(async () => {
  const PORT = 5000;
  const HOST = "0.0.0.0";
  
  try {
    log("Creating HTTP server...");
    const server = createServer(app);

    // Setup development/production environment first
    if (process.env.NODE_ENV !== "production") {
      log("Starting server in development mode");
      try {
        log("Setting up Vite middleware...");
        await setupVite(app, server);
        log("Vite middleware setup completed");
      } catch (viteError) {
        console.error("Vite setup failed:", viteError);
        if (viteError instanceof Error) {
          console.error("Vite error details:", viteError.message);
          console.error("Stack trace:", viteError.stack);
        }
        throw new Error("Failed to setup Vite middleware");
      }
    } else {
      log("Starting server in production mode");
      try {
        serveStatic(app);
        log("Static file serving setup completed");
      } catch (staticError) {
        console.error("Static setup failed:", staticError);
        throw staticError;
      }
    }

    // Register API routes after middleware setup
    try {
      log("Registering API routes...");
      registerRoutes(app);
      log("API routes registered successfully");
    } catch (routeError) {
      console.error("Failed to register routes:", routeError);
      throw routeError;
    }

    // Global error handler with better logging - register last
    app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
      console.error('Server Error:', {
        error: err,
        path: req.path,
        method: req.method,
        query: req.query,
        body: req.body,
      });
      
      if (!res.headersSent) {
        res.status(err.status || 500).json({ 
          message: err.message || "Internal Server Error",
          path: req.path,
        });
      }
    });

    // Wrap server startup in a promise for better error handling
    await new Promise<void>((resolve, reject) => {
      log("Starting server on port " + PORT);
      server.listen(PORT, HOST)
        .once('listening', () => {
          log(`Server started successfully on http://${HOST}:${PORT}`);
          resolve();
        })
        .once('error', (error: Error) => {
          console.error('Server startup error:', {
            error: error.message,
            stack: error.stack,
            code: (error as any).code
          });
          reject(error);
        });
    });

  } catch (error) {
    console.error('Server initialization failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace available'
    });
    process.exit(1);
  }
})().catch(error => {
  console.error('Unhandled server startup error:', error);
  process.exit(1);
});