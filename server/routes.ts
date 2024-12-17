import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "../db";
import { teams } from "../db/schema";
import { eq } from "drizzle-orm";

export function registerRoutes(app: Express): Server {
  const httpServer = createServer(app);

  // Set port from environment or use 5000 as fallback
  const port = process.env.PORT || 5000;
  
  // FPL API proxy endpoints
  app.get("/api/fpl/bootstrap-static", async (req, res) => {
    const response = await fetch("https://fantasy.premierleague.com/api/bootstrap-static/");
    const data = await response.json();
    res.json(data);
  });

  app.get("/api/fpl/my-team/:managerId/", async (req, res) => {
    const { managerId } = req.params;
    try {
      // First, fetch the manager/entry data
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

      // Fetch history data which includes current gameweek stats
      const historyResponse = await fetch(
        `https://fantasy.premierleague.com/api/entry/${managerId}/history/`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0',
            'Accept': 'application/json, text/plain, */*'
          }
        }
      );

      if (!historyResponse.ok) {
        console.error(`History response error: ${historyResponse.status}`);
        return res.status(500).json({ message: "Unable to fetch history data" });
      }

      const historyData = await historyResponse.json();
      const currentGw = historyData.current || [];
      const lastGw = currentGw.length > 0 ? currentGw[currentGw.length - 1] : {};

      // Get the current and last event from data
      const currentEvent = entryData.current_event || 1;
      const lastCompletedEvent = lastGw.event || (currentEvent > 1 ? currentEvent - 1 : 1);

      // Fetch picks for the current gameweek
      const picksResponse = await fetch(
        `https://fantasy.premierleague.com/api/entry/${managerId}/event/${lastCompletedEvent}/picks/`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0',
            'Accept': 'application/json, text/plain, */*'
          }
        }
      );

      // Get picks from response
      let picks = [];
      if (picksResponse.ok) {
        const picksData = await picksResponse.json();
        picks = picksData.picks || [];
      }

      // Ensure all gameweeks history is available for points graph
      const pointsHistory = currentGw.map(gw => {
        const points = parseInt(gw.points) || 0;
        const average = parseInt(gw.average_entry_score) || Math.round(points * 0.85);
        return {
          event: parseInt(gw.event) || 0,
          points: points,
          average: average
        };
      });

      // Get the most recent team value and bank, maintaining decimal precision
      const teamValue = parseFloat((entryData.last_deadline_value || lastGw.value || 0).toFixed(1));
      const bankValue = parseFloat((entryData.last_deadline_bank || lastGw.bank || 0).toFixed(1));

      // Get ranks from last completed gameweek
      const currentRank = lastGw.overall_rank || entryData.summary_overall_rank || 0;
      const previousRank = (currentGw.length > 1 ? currentGw[currentGw.length - 2].overall_rank : currentRank) || 0;

      // Get points data
      const lastGwPoints = lastGw.points || 0;
      const lastGwAveragePoints = lastGw.average_entry_score || Math.round(lastGwPoints * 0.85);

      // Structure the response data
      const combinedData = {
        picks,
        chips: historyData.chips || [],
        transfers: {
          limit: entryData.transfers?.limit || 1,
          made: entryData.transfers?.made || 0,
          bank: bankValue,
          value: teamValue,
        },
        points_history: pointsHistory,
        stats: {
          event_points: lastGwPoints,
          event_average: lastGwAveragePoints,
          points_on_bench: lastGw.points_on_bench || 0,
          overall_points: lastGw.total_points || entryData.summary_overall_points || 0,
          overall_rank: currentRank,
          rank_sort: previousRank,
          total_points: lastGw.total_points || entryData.summary_overall_points || 0,
          value: teamValue,
          bank: bankValue,
        },
        current_event: currentEvent,
        last_deadline_event: lastCompletedEvent,
        summary_overall_points: lastGw.total_points || entryData.summary_overall_points || 0,
        summary_overall_rank: currentRank,
        last_deadline_bank: bankValue,
        last_deadline_value: teamValue
      };

      res.json(combinedData);
    } catch (error) {
      console.error("Error fetching team data:", error);
      res.status(500).json({ 
        message: "Failed to fetch team data. Please ensure your team ID is correct and try again." 
      });
      console.log(`Server listening on port ${port}`);
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
  
  app.get("/api/fpl/next-deadline", async (req, res) => {
    try {
      // Fetch all fixtures
      const fixturesResponse = await fetch("https://fantasy.premierleague.com/api/fixtures/", {
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Accept': 'application/json, text/plain, */*'
        }
      });
      
      if (!fixturesResponse.ok) {
        return res.status(500).json({ message: "Failed to fetch fixtures" });
      }

      const fixtures = await fixturesResponse.json();
      
      // Get current timestamp
      const now = new Date().getTime();
      
      // Find the next fixture that hasn't started yet
      const nextFixture = fixtures
        .filter((f: any) => new Date(f.kickoff_time).getTime() > now)
        .sort((a: any, b: any) => 
          new Date(a.kickoff_time).getTime() - new Date(b.kickoff_time).getTime()
        )[0];

      if (!nextFixture) {
        return res.status(404).json({ message: "No upcoming fixtures found" });
      }

      res.json({ deadline: nextFixture.kickoff_time });
    } catch (error) {
      console.error("Error fetching next deadline:", error);
      res.status(500).json({ message: "Failed to fetch next deadline" });
    }
  });

  return httpServer;
}