import express from "express";
import { createServer } from "http";

const app = express();
app.use(express.json());

// Basic health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Basic error handling
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ message: 'Internal Server Error' });
});

const server = createServer(app);
const port = process.env.PORT || 5000;

server.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port}`);
});

export default server;
