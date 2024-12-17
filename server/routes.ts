import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "../db";
import { teams } from "../db/schema";
import { eq } from "drizzle-orm";

interface GameweekData {
  event: number;
  points: number;
  average_entry_score: number;
  total_points: number;
  overall_rank: number;
  bank: number;
  value: number;
  event_rank: number;
  points_on_bench: number;
}

export function registerRoutes(app: Express): Server {
  const httpServer = createServer(app);
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
      const currentGw = (historyData.current || []) as GameweekData[];
      const lastGw = currentGw.length > 0 ? currentGw[currentGw.length - 1] : null;

      // Get the current and last event from data
      const currentEvent = entryData.current_event || 1;
      const lastCompletedEvent = lastGw?.event || (currentEvent > 1 ? currentEvent - 1 : 1);

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

      let picks = [];
      if (picksResponse.ok) {
        const picksData = await picksResponse.json();
        picks = picksData.picks || [];
      }

      // Process gameweek history for points graph
      const pointsHistory = currentGw.map(gw => {
        try {
          // Parse and validate all numeric values
          const parseNumericValue = (value: any, defaultValue = 0): number => {
            if (value === null || value === undefined) return defaultValue;
            return typeof value === 'number' ? value : parseInt(String(value), 10) || defaultValue;
          };

          const gameweek = parseNumericValue(gw.event);
          const points = parseNumericValue(gw.points);
          const average = parseNumericValue(gw.average_entry_score);

          // Validate the gameweek number
          if (gameweek < 1 || gameweek > 38) {
            console.warn(`Invalid gameweek number: ${gameweek}`, gw);
            return null;
          }

          // Validate points and average are within reasonable bounds
          const validPoints = Math.max(0, Math.min(150, points));
          const validAverage = Math.max(0, Math.min(150, average));

          // Enhanced debug logging
          console.log('Processed gameweek data:', {
            gameweek,
            raw_points: points,
            valid_points: validPoints,
            raw_average: average,
            valid_average: validAverage,
            original_data: gw
          });

          return {
            gameweek,
            points: validPoints,
            average: validAverage
          };
        } catch (error) {
          console.error('Error processing gameweek data:', error, gw);
          return null;
        }
      })
      .filter((data): data is { gameweek: number; points: number; average: number } => 
        data !== null && data.gameweek > 0
      );

      // Parse team value
      const teamValue = lastGw?.value || entryData.last_deadline_value || 1000;
      const bankValue = lastGw?.bank || entryData.last_deadline_bank || 0;

      // Safe integer parsing
      const parseIntSafe = (value: any, defaultValue: number): number => {
        if (value === undefined || value === null) return defaultValue;
        const parsed = parseInt(String(value).replace(/[^0-9-]/g, ''));
        return isNaN(parsed) ? defaultValue : parsed;
      };

      // Structure the response data
      const combinedData = {
        picks,
        chips: historyData.chips || [],
        transfers: {
          limit: 2,
          made: Math.max(0, parseIntSafe(entryData.transfers?.made, 0)),
          bank: bankValue,
          value: teamValue,
        },
        points_history: pointsHistory,
        stats: {
          event_points: Math.max(0, parseIntSafe(lastGw?.points, 0)),
          event_average: Math.max(0, parseIntSafe(lastGw?.average_entry_score, 0)),
          event_rank: Math.max(1, parseIntSafe(lastGw?.event_rank, 1)),
          points_on_bench: Math.max(0, parseIntSafe(lastGw?.points_on_bench, 0)),
          overall_points: Math.max(0, parseIntSafe(lastGw?.total_points, 0)),
          overall_rank: Math.max(1, parseIntSafe(lastGw?.overall_rank, 1)),
          rank_sort: Math.max(1, parseIntSafe(currentGw[currentGw.length - 2]?.overall_rank, 1)),
          value: teamValue,
          bank: bankValue,
        },
        current_event: currentEvent,
        last_deadline_event: lastCompletedEvent,
        summary_overall_points: Math.max(0, parseIntSafe(lastGw?.total_points, 0)),
        summary_overall_rank: Math.max(1, parseIntSafe(lastGw?.overall_rank, 1)),
        last_deadline_bank: bankValue,
        last_deadline_value: teamValue
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

      const picks = Array.isArray(team.picks) ? team.picks : [];
      const transfers = team.transfers as any;

      if (transfers.limit <= 0) {
        res.status(400).json({ message: "No free transfers available" });
        return;
      }

      const outPlayer = picks.find(p => p.element === outId);
      if (!outPlayer) {
        res.status(400).json({ message: "Player not found in your team" });
        return;
      }

      const response = await fetch("https://fantasy.premierleague.com/api/bootstrap-static/");
      const data = await response.json();
      const newPlayer = data.elements.find((p: any) => p.id === playerId);
      const oldPlayer = data.elements.find((p: any) => p.id === outId);

      if (!newPlayer || !oldPlayer) {
        res.status(400).json({ message: "Invalid player selection" });
        return;
      }

      if (newPlayer.element_type !== oldPlayer.element_type) {
        res.status(400).json({ message: "Players must be of the same position" });
        return;
      }

      const updatedPicks = picks.map(pick => 
        pick.element === outId ? { ...pick, element: playerId } : pick
      );

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
      const now = new Date().getTime();
      
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
