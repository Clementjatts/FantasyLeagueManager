import type { Express } from "express";
import { createServer, type Server } from "http";
// Drizzle is being deprecated; future mutations should be handled client-side or via Firestore
import { transformPlayerDataForSeason, getSeasonStats } from "./services/historicalDataService";
import { fetchHistoricalPlayers, fetchHistoricalBootstrapData } from "./services/realHistoricalDataService";
import { fetchEnhancedFPLData } from "./services/enhancedFPLDataService";

interface GameweekHistory {
  event: string;
  points: string;
  average_entry_score: string;
}

export function registerRoutes(app: Express): Server {
  const httpServer = createServer(app);

  // Always use port 3000 (align with dev preference)
  const port = 3000;
  
  // FPL API proxy endpoints
  app.get("/api/fpl/bootstrap-static", async (req, res) => {
    try {
      const season = req.query.season as string || "2024-25";

      console.log(`Fetching bootstrap static for season: ${season}`);

      // For current season, use the official FPL API
      if (season === "2024-25") {
        let url = "https://fantasy.premierleague.com/api/bootstrap-static/";

        const response = await fetch(url);
        if (!response.ok) {
          return res.status(500).json({ message: "Failed to fetch FPL data" });
        }

        const data = await response.json();

        // Add season metadata to the response
        data.season = season;
        data.isHistorical = false;

        console.log(`Fetched current season bootstrap static for season ${season}`);
        res.json(data);
      } else {
        // For historical seasons, use real historical data
        try {
          const historicalData = await fetchHistoricalBootstrapData(season);
          console.log(`Fetched historical bootstrap static for season ${season}`);
          res.json(historicalData);
        } catch (historicalError) {
          console.error(`Failed to fetch historical data for ${season}, falling back to mock data:`, historicalError);
          
          // Fallback to mock data if historical data fails
          let url = "https://fantasy.premierleague.com/api/bootstrap-static/";
          const response = await fetch(url);
          if (!response.ok) {
            return res.status(500).json({ message: "Failed to fetch FPL data" });
          }

          const data = await response.json();
          data.elements = transformPlayerDataForSeason(data.elements, season);
          data.season = season;
          data.isHistorical = true;

          const seasonStats = getSeasonStats(season);
          if (seasonStats) {
            data.seasonStats = seasonStats;
          }

          console.log(`Used fallback mock data for season ${season}`);
          res.json(data);
        }
      }
    } catch (error) {
      console.error("Error fetching bootstrap static:", error);
      res.status(500).json({ message: "Failed to fetch bootstrap static data" });
    }
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

    // Fetch transfer status which includes free transfers
    let transferStatus = null;
    try {
      console.log("Fetching transfer status for manager:", managerId);
      const transfersResponse = await fetch(
        `https://fantasy.premierleague.com/api/entry/${managerId}/transfers/`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0',
            'Accept': 'application/json, text/plain, */*'
          }
        }
      );

      if (!transfersResponse.ok) {
        console.error(`Transfer status response error: ${transfersResponse.status} - ${await transfersResponse.text()}`);
      } else {
        transferStatus = await transfersResponse.json();
        console.log("Transfer status response:", transferStatus);
      }
    } catch (error) {
      console.error("Error fetching transfer status:", error);
    }

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

    // Get picks from response
    let picks = [];
    if (picksResponse.ok) {
      const picksData = await picksResponse.json();
      picks = picksData.picks || [];
    }

    // Calculate free transfers using history data
    let freeTransfers = 1; // Start with 1 free transfer
    
    try {
      if (historyData && historyData.current) {
        const currentGwHistory = historyData.current;
        console.log("Current gameweek history:", currentGwHistory);
        
        // Count consecutive gameweeks with no transfers
        let consecutiveNoTransfers = 0;
        for (let i = currentGwHistory.length - 1; i >= 0; i--) {
          const gw = currentGwHistory[i];
          if ((gw.event_transfers || 0) === 0 && (gw.event_transfers_cost || 0) === 0) {
            consecutiveNoTransfers++;
          } else {
            break;
          }
        }
        
        console.log("Consecutive gameweeks with no transfers:", consecutiveNoTransfers);
        
        // Add one transfer for each unused gameweek, capped at 5 (new FPL rules)
        freeTransfers = Math.min(5, 1 + consecutiveNoTransfers);
      }
    } catch (error) {
      console.error("Error calculating free transfers:", error);
      // Keep default of 1 free transfer
    }
    
    console.log("Calculated free transfers:", freeTransfers);
    console.log("Raw transfers data:", {
      entryTransfers: entryData.transfers,
      lastGwTransfers: lastGw?.transfers,
      lastGwTransfersLimit: lastGw?.transfers_limit
    });

    // Structure the response data
    const combinedData = {
      picks,
      chips: historyData.chips || [],
      transfers: {
        limit: freeTransfers,
        made: lastGw?.event_transfers || 0,
        bank: entryData.last_deadline_bank || lastGw?.bank || 0,
        value: entryData.last_deadline_value || lastGw?.value || 0,
        cost: lastGw?.event_transfers_cost || 0
      },
      points_history: currentGw.map((gw: GameweekHistory) => ({
        event: parseInt(gw.event) || 0,
        points: parseInt(gw.points) || 0,
        average: parseInt(gw.average_entry_score) || 0
      })),
      stats: {
        event_points: lastGw?.points || 0,
        event_average: lastGw?.average_entry_score || 0,
        event_rank: lastGw?.rank || 0,
        points_on_bench: lastGw?.points_on_bench || 0,
        overall_points: lastGw?.total_points || entryData.summary_overall_points || 0,
        overall_rank: lastGw?.overall_rank || entryData.summary_overall_rank || 0,
        rank_sort: (currentGw.length > 1 ? currentGw[currentGw.length - 2].overall_rank : lastGw?.overall_rank) || 0,
        total_points: lastGw?.total_points || entryData.summary_overall_points || 0,
        value: entryData.last_deadline_value || lastGw?.value || 0,
        bank: entryData.last_deadline_bank || lastGw?.bank || 0,
      },
      current_event: currentEvent,
      last_deadline_event: lastCompletedEvent,
      summary_overall_points: lastGw?.total_points || entryData.summary_overall_points || 0,
      summary_overall_rank: lastGw?.overall_rank || entryData.summary_overall_rank || 0,
      last_deadline_bank: entryData.last_deadline_bank || lastGw?.bank || 0,
      last_deadline_value: entryData.last_deadline_value || lastGw?.value || 0
    };

    console.log("Sending response with transfers:", combinedData.transfers);
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
      const season = req.query.season as string || "2024-25";

      console.log(`Fetching players for season: ${season}`);

      // For current season, use enhanced FPL data
      if (season === "2024-25") {
        console.log("Fetching enhanced FPL data for current season");
        const enhancedPlayers = await fetchEnhancedFPLData();
        console.log(`Fetched ${enhancedPlayers.length} enhanced current season players`);
        res.json(enhancedPlayers);
      } else {
        // For historical seasons, use real historical data
        try {
          const historicalPlayers = await fetchHistoricalPlayers(season);
          console.log(`Fetched ${historicalPlayers.length} historical players for season ${season}`);
          res.json(historicalPlayers);
        } catch (historicalError) {
          console.error(`Failed to fetch historical players for ${season}, falling back to mock data:`, historicalError);
          
          // Fallback to mock data if historical data fails
          let url = "https://fantasy.premierleague.com/api/bootstrap-static/";
          const response = await fetch(url);
          if (!response.ok) {
            return res.status(500).json({ message: "Failed to fetch FPL data" });
          }

          const data = await response.json();
          const transformedPlayers = transformPlayerDataForSeason(data.elements, season);

          console.log(`Used fallback mock data for ${transformedPlayers.length} players in season ${season}`);
          res.json(transformedPlayers);
        }
      }
    } catch (error) {
      console.error("Error fetching players:", error);
      res.status(500).json({ message: "Failed to fetch players" });
    }
  });

  app.get("/api/fpl/fixtures", async (req, res) => {
    try {
      const season = req.query.season as string;
      let url = "https://fantasy.premierleague.com/api/fixtures/";

      // For historical seasons, we'll need to handle differently
      // For now, we'll return current season data but add season info
      const response = await fetch(url);
      if (!response.ok) {
        return res.status(500).json({ message: "Failed to fetch FPL data" });
      }

      const data = await response.json();

      // Add season metadata to each fixture
      const fixturesWithSeason = data.map((fixture: any) => ({
        ...fixture,
        season: season || "2024-25",
        isHistorical: season && season !== "2024-25"
      }));

      res.json(fixturesWithSeason);
    } catch (error) {
      console.error("Error fetching fixtures:", error);
      res.status(500).json({ message: "Failed to fetch fixtures" });
    }
  });

  app.post("/api/fpl/transfers", async (_req, res) => {
    res.status(410).json({ message: "Transfers mutation is deprecated in this server. Use client workflows." });
  });

  app.post("/api/fpl/captains", async (_req, res) => {
    res.status(410).json({ message: "Captain updates are deprecated in this server. Use client workflows." });
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

  app.get("/api/fpl/top-managers-team", async (req, res) => {
    try {
      console.log("Starting Elite Cohort Analysis...");
      
      // Step 1: Fetch bootstrap static data
      console.log("Fetching bootstrap static data...");
      const bootstrapResponse = await fetch("https://fantasy.premierleague.com/api/bootstrap-static/", {
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Accept': 'application/json, text/plain, */*'
        }
      });
      
      if (!bootstrapResponse.ok) {
        console.error("Failed to fetch bootstrap data:", await bootstrapResponse.text());
        return res.status(500).json({ message: "Failed to fetch FPL data" });
      }
      
      const bootstrapData = await bootstrapResponse.json();
      console.log("Successfully fetched bootstrap data");
      
      // Step 2: Fetch the Elite - Get top 1000 managers from Overall League (ID: 314)
      console.log("Fetching elite managers from Overall League...");
      const leagueResponse = await fetch("https://fantasy.premierleague.com/api/leagues-classic/314/standings/?page_standings=1", {
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Accept': 'application/json, text/plain, */*'
        }
      });
      
      if (!leagueResponse.ok) {
        console.error("Failed to fetch league standings:", await leagueResponse.text());
        return res.status(500).json({ message: "Failed to fetch elite managers data" });
      }
      
      const leagueData = await leagueResponse.json();
      const eliteManagers = leagueData.standings?.results?.slice(0, 1000) || [];
      console.log(`Found ${eliteManagers.length} elite managers`);
      
      if (eliteManagers.length === 0) {
        return res.status(500).json({ message: "No elite managers found" });
      }
      
      // Step 3: Get current gameweek
      const currentEvent = bootstrapData.events?.find((event: any) => event.is_current)?.id || 1;
      console.log(`Current gameweek: ${currentEvent}`);
      
      // Step 4: Sample the Cohort - Fetch team picks for each elite manager
      console.log("Fetching team picks for elite managers...");
      const eliteOwnership: { [playerId: number]: number } = {};
      const captaincyCount: { [playerId: number]: number } = {};
      const viceCaptaincyCount: { [playerId: number]: number } = {};
      
      // Process managers in batches to avoid overwhelming the API
      const batchSize = 50;
      const totalBatches = Math.ceil(eliteManagers.length / batchSize);
      
      for (let batch = 0; batch < totalBatches; batch++) {
        const startIndex = batch * batchSize;
        const endIndex = Math.min(startIndex + batchSize, eliteManagers.length);
        const batchManagers = eliteManagers.slice(startIndex, endIndex);
        
        console.log(`Processing batch ${batch + 1}/${totalBatches} (managers ${startIndex + 1}-${endIndex})`);
        
        // Process batch in parallel
        const batchPromises = batchManagers.map(async (manager: any) => {
          try {
            const picksResponse = await fetch(
              `https://fantasy.premierleague.com/api/entry/${manager.entry}/event/${currentEvent}/picks/`,
              {
                headers: {
                  'User-Agent': 'Mozilla/5.0',
                  'Accept': 'application/json, text/plain, */*'
                }
              }
            );
            
            if (picksResponse.ok) {
              const picksData = await picksResponse.json();
              const picks = picksData.picks || [];
              
              // Count ownership and captaincy
              picks.forEach((pick: any) => {
                if (pick.element) {
                  eliteOwnership[pick.element] = (eliteOwnership[pick.element] || 0) + 1;
                  
                  if (pick.is_captain) {
                    captaincyCount[pick.element] = (captaincyCount[pick.element] || 0) + 1;
                  }
                  
                  if (pick.is_vice_captain) {
                    viceCaptaincyCount[pick.element] = (viceCaptaincyCount[pick.element] || 0) + 1;
                  }
                }
              });
            }
          } catch (error) {
            console.error(`Error fetching picks for manager ${manager.entry}:`, error);
          }
        });
        
        await Promise.all(batchPromises);
        
        // Add delay between batches to be respectful to the API
        if (batch < totalBatches - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      console.log(`Processed ${Object.keys(eliteOwnership).length} unique players`);
      
      // Step 5: Calculate Elite Ownership % and build the Elite XI
      const totalEliteManagers = eliteManagers.length;
      const playersWithEliteOwnership = bootstrapData.elements.map((player: any) => ({
        ...player,
        eliteOwnership: ((eliteOwnership[player.id] || 0) / totalEliteManagers) * 100,
        captaincyCount: captaincyCount[player.id] || 0,
        viceCaptaincyCount: viceCaptaincyCount[player.id] || 0
      }));
      
      // Group players by position and sort by elite ownership
      const playersByPosition = playersWithEliteOwnership.reduce((acc: any, player: any) => {
        if (!acc[player.element_type]) {
          acc[player.element_type] = [];
        }
        acc[player.element_type].push(player);
        return acc;
      }, {});
      
      // Sort each position by elite ownership
      Object.keys(playersByPosition).forEach(position => {
        playersByPosition[position].sort((a: any, b: any) => b.eliteOwnership - a.eliteOwnership);
      });
      
      // Select the most elite-owned players for each position
      const gkps = playersByPosition[1]?.slice(0, 2) || [];
      const defs = playersByPosition[2]?.slice(0, 5) || [];
      const mids = playersByPosition[3]?.slice(0, 5) || [];
      const fwds = playersByPosition[4]?.slice(0, 3) || [];
      
      // Determine captain and vice-captain from elite cohort
      const allPlayers = [...gkps, ...defs, ...mids, ...fwds];
      const captain = allPlayers.reduce((prev, current) => 
        (current.captaincyCount > prev.captaincyCount) ? current : prev
      );
      const viceCaptain = allPlayers
        .filter(player => player.id !== captain.id)
        .reduce((prev, current) => 
          (current.viceCaptaincyCount > prev.viceCaptaincyCount) ? current : prev
        );
      
      // Create team structure with elite ownership data
      const teamData = {
        picks: [
          // Starting XI
          ...gkps.slice(0, 1).map((player: any) => ({
            element: player.id,
            position: 1,
            selling_price: player.now_cost,
            multiplier: 1,
            purchase_price: player.now_cost,
            is_captain: player.id === captain.id,
            is_vice_captain: player.id === viceCaptain.id,
            eliteOwnership: player.eliteOwnership,
            captaincyCount: player.captaincyCount,
            viceCaptaincyCount: player.viceCaptaincyCount
          })),
          ...defs.slice(0, 4).map((player: any, index: number) => ({
            element: player.id,
            position: index + 2,
            selling_price: player.now_cost,
            multiplier: 1,
            purchase_price: player.now_cost,
            is_captain: player.id === captain.id,
            is_vice_captain: player.id === viceCaptain.id,
            eliteOwnership: player.eliteOwnership,
            captaincyCount: player.captaincyCount,
            viceCaptaincyCount: player.viceCaptaincyCount
          })),
          ...mids.slice(0, 4).map((player: any, index: number) => ({
            element: player.id,
            position: index + 6,
            selling_price: player.now_cost,
            multiplier: 1,
            purchase_price: player.now_cost,
            is_captain: player.id === captain.id,
            is_vice_captain: player.id === viceCaptain.id,
            eliteOwnership: player.eliteOwnership,
            captaincyCount: player.captaincyCount,
            viceCaptaincyCount: player.viceCaptaincyCount
          })),
          ...fwds.slice(0, 2).map((player: any, index: number) => ({
            element: player.id,
            position: index + 10,
            selling_price: player.now_cost,
            multiplier: 1,
            purchase_price: player.now_cost,
            is_captain: player.id === captain.id,
            is_vice_captain: player.id === viceCaptain.id,
            eliteOwnership: player.eliteOwnership,
            captaincyCount: player.captaincyCount,
            viceCaptaincyCount: player.viceCaptaincyCount
          })),
          // Substitutes
          ...gkps.slice(1).map((player: any) => ({
            element: player.id,
            position: 12,
            selling_price: player.now_cost,
            multiplier: 0,
            purchase_price: player.now_cost,
            is_captain: false,
            is_vice_captain: false,
            eliteOwnership: player.eliteOwnership,
            captaincyCount: player.captaincyCount,
            viceCaptaincyCount: player.viceCaptaincyCount
          })),
          ...defs.slice(4).map((player: any) => ({
            element: player.id,
            position: 13,
            selling_price: player.now_cost,
            multiplier: 0,
            purchase_price: player.now_cost,
            is_captain: false,
            is_vice_captain: false,
            eliteOwnership: player.eliteOwnership,
            captaincyCount: player.captaincyCount,
            viceCaptaincyCount: player.viceCaptaincyCount
          })),
          ...mids.slice(4).map((player: any) => ({
            element: player.id,
            position: 14,
            selling_price: player.now_cost,
            multiplier: 0,
            purchase_price: player.now_cost,
            is_captain: false,
            is_vice_captain: false,
            eliteOwnership: player.eliteOwnership,
            captaincyCount: player.captaincyCount,
            viceCaptaincyCount: player.viceCaptaincyCount
          })),
          ...fwds.slice(2).map((player: any) => ({
            element: player.id,
            position: 15,
            selling_price: player.now_cost,
            multiplier: 0,
            purchase_price: player.now_cost,
            is_captain: false,
            is_vice_captain: false,
            eliteOwnership: player.eliteOwnership,
            captaincyCount: player.captaincyCount,
            viceCaptaincyCount: player.viceCaptaincyCount
          }))
        ],
        transfers: {
          limit: 0,
          made: 0,
          bank: 0,
          value: 0,
          extra: 0,
          cost: 0
        },
        chips: [],
        stats: {
          value: 1000,
          bank: 0,
          team_value: 1000,
          total_value: 1000
        },
        meta: {
          totalEliteManagers: totalEliteManagers,
          currentGameweek: currentEvent,
          algorithm: "Elite Cohort Analysis"
        }
      };
      
      console.log("Elite Cohort Analysis completed successfully");
      console.log(`Captain: ${captain.web_name} (${captain.captaincyCount} selections)`);
      console.log(`Vice-Captain: ${viceCaptain.web_name} (${viceCaptain.viceCaptaincyCount} selections)`);
      
      res.setHeader('Content-Type', 'application/json');
      return res.json(teamData);
    } catch (error) {
      console.error("Elite Cohort Analysis error:", error);
      return res.status(500).json({ 
        message: "Failed to fetch elite managers team",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  httpServer.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });

  return httpServer;
}