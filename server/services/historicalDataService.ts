// Historical data service for Fantasy Premier League seasons
// Since the FPL API only provides current season data, we'll create representative historical data

interface HistoricalPlayerData {
  [playerId: number]: {
    total_points: number;
    goals_scored: number;
    assists: number;
    clean_sheets: number;
    minutes: number;
    form: string;
    selected_by_percent: string;
    now_cost: number;
  };
}

interface SeasonData {
  season: string;
  playerAdjustments: HistoricalPlayerData;
  seasonStats: {
    averagePoints: number;
    topScorer: { id: number; points: number };
    totalPlayers: number;
  };
}

// Sample historical data for demonstration
const HISTORICAL_SEASONS: { [season: string]: SeasonData } = {
  "2023-24": {
    season: "2023-24",
    playerAdjustments: {
      // Erling Haaland - was top scorer in 2023-24
      1: { total_points: 224, goals_scored: 27, assists: 5, clean_sheets: 0, minutes: 2580, form: "8.5", selected_by_percent: "45.2", now_cost: 140 },
      // Mohamed Salah
      2: { total_points: 211, goals_scored: 18, assists: 10, clean_sheets: 0, minutes: 2890, form: "7.8", selected_by_percent: "38.7", now_cost: 130 },
      // Cole Palmer - breakout season
      3: { total_points: 244, goals_scored: 22, assists: 11, clean_sheets: 0, minutes: 2700, form: "9.2", selected_by_percent: "42.1", now_cost: 105 },
      // Bukayo Saka
      4: { total_points: 195, goals_scored: 16, assists: 9, clean_sheets: 0, minutes: 2650, form: "7.5", selected_by_percent: "35.8", now_cost: 115 },
      // Son Heung-min
      5: { total_points: 171, goals_scored: 17, assists: 6, clean_sheets: 0, minutes: 2400, form: "6.8", selected_by_percent: "28.3", now_cost: 100 }
    },
    seasonStats: {
      averagePoints: 89,
      topScorer: { id: 3, points: 244 }, // Cole Palmer
      totalPlayers: 685
    }
  },
  "2022-23": {
    season: "2022-23",
    playerAdjustments: {
      // Erling Haaland - debut season, record breaking
      1: { total_points: 272, goals_scored: 36, assists: 8, clean_sheets: 0, minutes: 2769, form: "9.8", selected_by_percent: "52.1", now_cost: 120 },
      // Harry Kane
      2: { total_points: 219, goals_scored: 30, assists: 3, clean_sheets: 0, minutes: 2985, form: "8.2", selected_by_percent: "41.5", now_cost: 115 },
      // Mohamed Salah
      3: { total_points: 180, goals_scored: 19, assists: 12, clean_sheets: 0, minutes: 2670, form: "7.1", selected_by_percent: "35.2", now_cost: 125 },
      // Marcus Rashford - excellent season
      4: { total_points: 198, goals_scored: 17, assists: 5, clean_sheets: 0, minutes: 2580, form: "7.8", selected_by_percent: "38.9", now_cost: 85 },
      // Kevin De Bruyne
      5: { total_points: 193, goals_scored: 7, assists: 16, clean_sheets: 0, minutes: 2340, form: "7.6", selected_by_percent: "33.7", now_cost: 120 }
    },
    seasonStats: {
      averagePoints: 92,
      topScorer: { id: 1, points: 272 }, // Haaland
      totalPlayers: 678
    }
  },
  "2021-22": {
    season: "2021-22",
    playerAdjustments: {
      // Mohamed Salah - incredible season
      1: { total_points: 303, goals_scored: 23, assists: 13, clean_sheets: 0, minutes: 3060, form: "9.5", selected_by_percent: "58.3", now_cost: 130 },
      // Son Heung-min - Golden Boot winner
      2: { total_points: 258, goals_scored: 23, assists: 7, clean_sheets: 0, minutes: 2850, form: "8.9", selected_by_percent: "45.7", now_cost: 105 },
      // Cristiano Ronaldo
      3: { total_points: 178, goals_scored: 18, assists: 3, clean_sheets: 0, minutes: 2580, form: "6.8", selected_by_percent: "32.1", now_cost: 125 },
      // Sadio Mané
      4: { total_points: 231, goals_scored: 16, assists: 2, clean_sheets: 0, minutes: 2790, form: "8.1", selected_by_percent: "41.2", now_cost: 115 },
      // Kevin De Bruyne
      5: { total_points: 219, goals_scored: 8, assists: 8, clean_sheets: 0, minutes: 2510, form: "7.9", selected_by_percent: "38.4", now_cost: 120 }
    },
    seasonStats: {
      averagePoints: 95,
      topScorer: { id: 1, points: 303 }, // Salah
      totalPlayers: 672
    }
  }
};

export function getHistoricalSeasonData(season: string): SeasonData | null {
  return HISTORICAL_SEASONS[season] || null;
}

export function transformPlayerDataForSeason(currentPlayers: any[], season: string): any[] {
  const historicalData = getHistoricalSeasonData(season);
  
  if (!historicalData || season === "2024-25") {
    // Return current data for current season
    return currentPlayers.map(player => ({
      ...player,
      season: season || "2024-25",
      isHistorical: season && season !== "2024-25"
    }));
  }

  // Transform current players with historical data
  return currentPlayers.map((player, index) => {
    const historicalPlayerData = historicalData.playerAdjustments[player.id] || 
                                historicalData.playerAdjustments[index + 1];
    
    if (historicalPlayerData) {
      return {
        ...player,
        ...historicalPlayerData,
        season: season,
        isHistorical: true
      };
    }

    // For players without specific historical data, apply season-wide adjustments
    const seasonMultiplier = getSeasonMultiplier(season);
    return {
      ...player,
      total_points: Math.round(player.total_points * seasonMultiplier.points),
      goals_scored: Math.round(player.goals_scored * seasonMultiplier.goals),
      assists: Math.round(player.assists * seasonMultiplier.assists),
      form: (parseFloat(player.form || "0") * seasonMultiplier.form).toFixed(1),
      selected_by_percent: (parseFloat(player.selected_by_percent || "0") * seasonMultiplier.ownership).toFixed(1),
      season: season,
      isHistorical: true
    };
  });
}

function getSeasonMultiplier(season: string): any {
  const multipliers: { [key: string]: any } = {
    "2023-24": { points: 0.95, goals: 0.9, assists: 1.1, form: 0.92, ownership: 0.88 },
    "2022-23": { points: 1.05, goals: 1.15, assists: 0.95, form: 1.08, ownership: 0.95 },
    "2021-22": { points: 1.1, goals: 0.85, assists: 1.2, form: 1.12, ownership: 1.05 }
  };
  
  return multipliers[season] || { points: 1, goals: 1, assists: 1, form: 1, ownership: 1 };
}

export function getSeasonStats(season: string) {
  const historicalData = getHistoricalSeasonData(season);
  return historicalData?.seasonStats || null;
}
