import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "../db";
import { teams } from "../db/schema";
import { eq } from "drizzle-orm";

export function registerRoutes(app: Express): Server {
  const httpServer = createServer(app);

  // FPL API proxy endpoints
  app.get("/api/fpl/bootstrap-static", async (req, res) => {
    const response = await fetch("https://fantasy.premierleague.com/api/bootstrap-static/");
    const data = await response.json();
    res.json(data);
  });

  app.get("/api/fpl/my-team/:managerId", async (req, res) => {
    const { managerId } = req.params;
    
    try {
      const team = await db.query.teams.findFirst({
        where: eq(teams.userId, parseInt(managerId)),
      });

      if (!team) {
        res.status(404).json({ message: "Team not found" });
        return;
      }

      res.json(team);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch team" });
    }
  });

  app.get("/api/fpl/players", async (req, res) => {
    try {
      const response = await fetch("https://fantasy.premierleague.com/api/bootstrap-static/");
      const data = await response.json();
      res.json(data.elements);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch players" });
    }
  });

  app.get("/api/fpl/fixtures", async (req, res) => {
    try {
      const response = await fetch("https://fantasy.premierleague.com/api/fixtures/");
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch fixtures" });
    }
  });

  app.post("/api/fpl/transfers", async (req, res) => {
    const { playerId, outId } = req.body;
    
    try {
      // Implement transfer logic here
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to make transfer" });
    }
  });

  return httpServer;
}
