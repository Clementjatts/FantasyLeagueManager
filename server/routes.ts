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
      // Fetch entry/manager data first
      const entryResponse = await fetch(`https://fantasy.premierleague.com/api/entry/${managerId}/`, {
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Accept': 'application/json, text/plain, */*'
        }
      });

      if (!entryResponse.ok) {
        console.error(`Entry response error: ${entryResponse.status} - ${await entryResponse.text()}`);
        return res.status(404).json({ message: "Team not found. Please check your team ID." });
      }

      const entryData = await entryResponse.json();
      const currentEvent = entryData.current_event;

      // Fetch current gameweek data
      const gwResponse = await fetch(
        `https://fantasy.premierleague.com/api/entry/${managerId}/event/${currentEvent}/picks/`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0',
            'Accept': 'application/json, text/plain, */*'
          }
        }
      );

      if (!gwResponse.ok) {
        console.error(`Gameweek response error: ${gwResponse.status} - ${await gwResponse.text()}`);
        return res.status(500).json({ message: "Unable to fetch gameweek data" });
      }

      const gwData = await gwResponse.json();

      // For transfers and team value, we'll use the entry data
      const combinedData = {
        picks: gwData.picks || [],
        chips: [], // Will be populated when we have access to the chips endpoint
        transfers: {
          limit: 1, // Default to 1 free transfer
          made: 0,
          bank: entryData.bank || 0,
          value: entryData.value || 0,
        },
        entry: {
          overall_points: entryData.summary_overall_points,
          overall_rank: entryData.summary_overall_rank,
          gameweek_points: gwData.entry_history?.points || 0,
          gameweek: currentEvent,
          team_value: entryData.value || 0,
          bank: entryData.bank || 0,
        }
      };

      res.json(combinedData);
    } catch (error) {
      console.error("Error fetching team data:", error);
      res.status(500).json({ 
        message: "Failed to fetch team data. Please ensure your team ID is correct and try again." 
      });
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
  app.get("/api/fpl/leagues/:managerId", async (req, res) => {
    const { managerId } = req.params;
    try {
      // Mock data for leagues
      const leagues = [
        {
          id: 1,
          name: "Classic League",
          type: "classic",
          admin_entry: 1,
          started: true,
          closed: false
        },
        {
          id: 2,
          name: "Head-to-Head League",
          type: "h2h",
          admin_entry: 1,
          started: true,
          closed: false
        }
      ];
      res.json(leagues);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch leagues" });
    }
  });

  app.get("/api/fpl/leagues/:leagueId/standings", async (req, res) => {
    const { leagueId } = req.params;
    try {
      // Mock data for league standings
      const standings = Array.from({ length: 10 }, (_, i) => ({
        entry: i + 1,
        entry_name: `Team ${i + 1}`,
        player_name: `Manager ${i + 1}`,
        rank: i + 1,
        last_rank: i + 1,
        total: Math.floor(Math.random() * 1000),
        points_behind_leader: i * 10
      }));
      res.json(standings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch standings" });
    }
  });

  app.get("/api/fpl/cup/:managerId", async (req, res) => {
    const { managerId } = req.params;
    try {
      // Mock data for cup matches
      const matches = [
        {
          id: 1,
          entry_1_entry: 1,
          entry_1_name: "Team A",
          entry_1_player_name: "Manager A",
          entry_1_points: 65,
          entry_2_entry: 2,
          entry_2_name: "Team B",
          entry_2_player_name: "Manager B",
          entry_2_points: 55,
          is_knockout: true,
          winner: 1,
          round: 1
        }
      ];
      res.json(matches);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch cup matches" });
    }
  });

  return httpServer;
}