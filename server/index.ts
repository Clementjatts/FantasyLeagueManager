import express from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// Register routes
const server = registerRoutes(app);

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ message: 'Internal Server Error' });
});

// Start server
const port = process.env.PORT ? parseInt(process.env.PORT) : 5000;

server.listen(port, "0.0.0.0", async () => {
  log(`Server running on port ${port}`);
  
  // Setup Vite in development mode
  if (process.env.NODE_ENV !== "production") {
    try {
      await setupVite(app, server);
      log("Vite development server ready");
    } catch (error) {
      console.error("Vite setup error:", error);
      // Continue running even if Vite setup fails
    }
  } else {
    serveStatic(app);
    log("Static file serving ready");
  }
});
