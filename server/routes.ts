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
      interface GameweekData {
        event: number;
        points: number;
        value?: number;
        bank?: number;
        total_points?: number;
        event_rank?: number;
        points_on_bench?: number;
        overall_rank?: number;
        rank_sort?: number;
        average_entry_score?: number;
      }

      const currentGw = (historyData.current || []) as GameweekData[];
      const lastGw = currentGw.length > 0 ? currentGw[currentGw.length - 1] : {} as GameweekData;

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

      // Process gameweek history for points graph
      const pointsHistory = (currentGw || []).map((gw: GameweekData) => ({
        gameweek: Number(gw.event),
        points: Math.max(0, Math.min(200, Number(gw.points)))
      })).filter(gw => gw.gameweek > 0);

      // Parse team value (in tenths of millions, e.g., 1006 = £100.6m)
      const parseTeamValue = (value: any): number => {
        if (!value) return 1000; // Default £100.0m
        
        try {
          // If it's already a number
          if (typeof value === 'number') {
            // If it's in the correct range (950-1200 = £95.0m-£120.0m)
            if (value >= 950 && value <= 1200) {
              return value;
            }
            // If it needs to be converted to tenths (95-120 = £95.0m-£120.0m)
            if (value >= 95 && value <= 120) {
              return Math.floor(value * 10);
            }
          }
          
          // Convert to string and clean it
          const strValue = value.toString().trim();
          
          // If it's a decimal format (e.g., "100.6")
          if (strValue.includes('.')) {
            const [whole, decimal] = strValue.split('.');
            const wholeNum = parseInt(whole);
            const decimalNum = parseInt(decimal.charAt(0) || '0');
            
            // Combine whole and decimal to get tenths
            const combined = wholeNum * 10 + decimalNum;
            if (combined >= 950 && combined <= 1200) {
              return combined;
            }
          }
          
          // If it's a whole number string
          const parsed = parseInt(strValue);
          if (!isNaN(parsed)) {
            if (parsed >= 950 && parsed <= 1200) {
              return parsed;
            }
            if (parsed >= 95 && parsed <= 120) {
              return parsed * 10;
            }
          }
          
          // Log the problematic value for debugging
          console.log('Invalid team value format:', value);
          return 1000; // Default to £100.0m
        } catch (error) {
          console.error('Error parsing team value:', error);
          return 1000; // Default to £100.0m
        }
      };
      
      // Parse bank value (in tenths of millions, max £30.0m)
      const parseBankValue = (value: any): number => {
        if (!value) return 0;
        
        let numericValue: number;
        
        if (typeof value === 'number') {
          numericValue = value;
        } else {
          const cleanStr = value.toString().replace(/[^\d.]/g, '');
          numericValue = parseFloat(cleanStr);
        }
        
        // If it's already in tenths format (e.g., 300 = £30.0m)
        if (numericValue >= 0 && numericValue <= 300) {
          return Math.round(numericValue);
        }
        
        // If it's in regular format (e.g., 30.0)
        if (numericValue >= 0 && numericValue <= 30) {
          return Math.round(numericValue * 10);
        }
        
        return 0; // Default to £0.0m if value is invalid
      };

      // Calculate team and bank values
      const teamValue = parseTeamValue(lastGw?.value || entryData.last_deadline_value);
      const bankValue = parseBankValue(lastGw?.bank || entryData.last_deadline_bank);

      // Calculate free transfers based on rules
      const baseTransfers = 1;
      const savedTransfers = entryData.transfers?.limit !== undefined ? 
        parseInt(entryData.transfers.limit.toString()) : 2; // Default to 2 if undefined
      const transfersMade = entryData.transfers?.made !== undefined ? 
        parseInt(entryData.transfers.made.toString()) : 0;
      
      // Always ensure 2 free transfers are available as per user requirement
      const freeTransfers = 2;

      // Get the last gameweek's data for points and rank with proper type handling
      const parseNumber = (value: any): number => {
        if (!value) return 0;
        const parsed = parseInt(value.toString());
        return isNaN(parsed) ? 0 : parsed;
      };

      const parseIntSafe = (value: any, defaultValue: number): number => {
        if (value === undefined || value === null) return defaultValue;
        const parsed = parseInt(String(value).replace(/[^0-9-]/g, ''));
        return isNaN(parsed) ? defaultValue : parsed;
      };

      const lastGwPoints = parseIntSafe(lastGw?.points || entryData.summary_event_points, 0);
      const lastGwAveragePoints = parseIntSafe(lastGw?.average_entry_score, 0);
      const currentRank = Math.max(1, parseIntSafe(lastGw?.overall_rank || entryData.summary_overall_rank, 1));
      const previousRank = Math.max(1, parseIntSafe(
        currentGw.length > 1 
          ? currentGw[currentGw.length - 2].overall_rank 
          : entryData.summary_overall_rank,
        1
      ));

      // Validate numeric ranges
      const validatedPoints = Math.min(200, Math.max(0, lastGwPoints));
      const validatedAverage = Math.min(150, Math.max(0, lastGwAveragePoints));
      const validatedRank = Math.min(10000000, Math.max(1, currentRank));

      // Structure the response data with proper type handling
      const combinedData = {
        picks,
        chips: historyData.chips || [],
        transfers: {
          limit: freeTransfers, // Set to 2 as per requirement
          made: Math.max(0, parseIntSafe(transfersMade, 0)),
          bank: bankValue,
          value: teamValue,
        },
        points_history: pointsHistory,
        stats: {
          event_points: Math.min(200, Math.max(0, parseIntSafe(lastGw?.points || entryData.summary_event_points, 0))),
          event_average: Math.min(150, Math.max(0, parseIntSafe(currentGw.length > 0 ? currentGw[currentGw.length - 1].average_entry_score : 0, 0))),
          event_rank: Math.min(10000000, Math.max(1, parseIntSafe(lastGw?.event_rank || entryData.summary_event_rank, 1))),
          points_on_bench: Math.min(100, Math.max(0, parseIntSafe(lastGw?.points_on_bench, 0))),
          overall_points: Math.max(0, parseIntSafe(lastGw?.total_points || entryData.summary_overall_points, 0)),
          overall_rank: Math.min(10000000, Math.max(1, parseIntSafe(lastGw?.overall_rank || entryData.summary_overall_rank, 1))),
          rank_sort: Math.max(1, previousRank),
          total_points: Math.max(0, parseIntSafe(lastGw?.total_points || entryData.summary_overall_points, 0)),
          value: teamValue,
          bank: bankValue,
        },
        current_event: parseInt(String(currentEvent)) || 1,
        last_deadline_event: parseInt(String(lastCompletedEvent)) || 1,
        summary_overall_points: Math.max(0, parseInt(String(lastGw.total_points)) || parseInt(String(entryData.summary_overall_points)) || 0),
        summary_overall_rank: Math.max(1, parseInt(String(currentRank)) || 1),
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
