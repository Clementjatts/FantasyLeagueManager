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

      // Ensure picks is an array
      const picks = Array.isArray(team.picks) ? team.picks : [];
      
      res.json({
        ...team,
        picks
      });
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
      const team = await db.query.teams.findFirst({
        where: eq(teams.userId, 1),
      });

      if (!team) {
        res.status(404).json({ message: "Team not found" });
        return;
      }

      // Get the current picks and transfers
      const picks = Array.isArray(team.picks) ? team.picks : [];
      const transfers = team.transfers as any;

      // Validate transfer
      if (transfers.limit <= 0) {
        res.status(400).json({ message: "No free transfers available" });
        return;
      }

      // Get the positions of both players
      const outPlayer = picks.find(p => p.element === outId);
      if (!outPlayer) {
        res.status(400).json({ message: "Player not found in your team" });
        return;
      }

      // Validate position replacement
      const response = await fetch("https://fantasy.premierleague.com/api/bootstrap-static/");
      const data = await response.json();
      const newPlayer = data.elements.find((p: any) => p.id === playerId);
      const oldPlayer = data.elements.find((p: any) => p.id === outId);

      if (!newPlayer || !oldPlayer) {
        res.status(400).json({ message: "Invalid player selection" });
        return;
      }

      // Ensure players are of the same position type
      if (newPlayer.element_type !== oldPlayer.element_type) {
        res.status(400).json({ message: "Players must be of the same position" });
        return;
      }

      // Update picks by replacing the outgoing player
      const updatedPicks = picks.map(pick => 
        pick.element === outId ? { ...pick, element: playerId } : pick
      );

      // Update transfers count and save
      const updatedTransfers = {
        ...transfers,
        limit: transfers.limit - 1,
        made: transfers.made + 1,
      };

      await db.update(teams)
        .set({ 
          picks: updatedPicks,
          transfers: updatedTransfers,
          updatedAt: new Date(),
        })
        .where(eq(teams.userId, 1));

      res.json({ success: true });
    } catch (error) {
      console.error("Transfer error:", error);
      res.status(500).json({ message: "Failed to make transfer" });
    }
  });

  app.post("/api/fpl/captains", async (req, res) => {
    const { captainId, viceCaptainId } = req.body;
    
    try {
      const team = await db.query.teams.findFirst({
        where: eq(teams.userId, 1),
      });

      if (!team) {
        res.status(404).json({ message: "Team not found" });
        return;
      }

      const picks = team.picks as any[];
      const updatedPicks = picks.map(pick => ({
        ...pick,
        is_captain: pick.element === captainId,
        is_vice_captain: pick.element === viceCaptainId,
      }));

      await db.update(teams)
        .set({ picks: updatedPicks })
        .where(eq(teams.userId, 1));

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to update captains" });
    }
  });

  return httpServer;
}
