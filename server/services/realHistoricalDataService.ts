// Real historical data service for Fantasy Premier League seasons
// Uses Vaastav's repository for comprehensive historical data

interface HistoricalPlayerData {
  id: number;
  web_name: string;
  first_name: string;
  second_name: string;
  element_type: number;
  team: number;
  total_points: number;
  goals_scored: number;
  assists: number;
  clean_sheets: number;
  goals_conceded: number;
  minutes: number;
  form: string;
  selected_by_percent: string;
  now_cost: number;
  points_per_game: string;
  bonus: number;
  bps: number;
  influence: string;
  creativity: string;
  threat: string;
  ict_index: string;
  saves: number;
  penalties_saved: number;
  penalties_missed: number;
  yellow_cards: number;
  red_cards: number;
  own_goals: number;
  cost_change_event: number;
  cost_change_start: number;
  value_form: string;
  transfers_in_event: number;
  transfers_out_event: number;
  expected_goals: number;
  expected_assists: number;
  expected_goal_involvements: number;
  status: string;
  season: string;
  isHistorical: boolean;
}

interface HistoricalTeamData {
  id: number;
  name: string;
  short_name: string;
  strength: number;
  strength_overall_home: number;
  strength_overall_away: number;
  strength_attack_home: number;
  strength_attack_away: number;
  strength_defence_home: number;
  strength_defence_away: number;
}

interface HistoricalBootstrapData {
  elements: HistoricalPlayerData[];
  teams: HistoricalTeamData[];
  element_types: any[];
  events: any[];
  season: string;
  isHistorical: boolean;
}

// Cache for historical data to avoid repeated API calls
const historicalDataCache = new Map<string, HistoricalBootstrapData>();

export async function fetchHistoricalPlayers(season: string): Promise<HistoricalPlayerData[]> {
  try {
    console.log(`Fetching historical players for season: ${season}`);
    
    // Check cache first
    const cacheKey = `players_${season}`;
    if (historicalDataCache.has(cacheKey)) {
      const cachedData = historicalDataCache.get(cacheKey);
      console.log(`Using cached data for season ${season}`);
      return cachedData?.elements || [];
    }

    // Fetch from Vaastav's repository - use players_raw.csv for comprehensive data
    const baseUrl = "https://raw.githubusercontent.com/vaastav/Fantasy-Premier-League/master/data";
    const playersUrl = `${baseUrl}/${season}/players_raw.csv`;
    
    console.log(`Fetching from URL: ${playersUrl}`);
    
    const response = await fetch(playersUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch historical data: ${response.status} ${response.statusText}`);
    }

    const csvText = await response.text();
    const players = parseCSVToPlayers(csvText, season);
    
    // Cache the data
    const bootstrapData: HistoricalBootstrapData = {
      elements: players,
      teams: await fetchHistoricalTeams(season),
      element_types: [], // Not needed for historical data
      events: [], // Not needed for historical data
      season,
      isHistorical: true
    };
    
    historicalDataCache.set(cacheKey, bootstrapData);
    
    console.log(`Successfully fetched ${players.length} historical players for season ${season}`);
    return players;
    
  } catch (error) {
    console.error(`Error fetching historical players for season ${season}:`, error);
    throw error;
  }
}

export async function fetchHistoricalBootstrapData(season: string): Promise<HistoricalBootstrapData> {
  try {
    console.log(`Fetching historical bootstrap data for season: ${season}`);
    
    // Check cache first
    const cacheKey = `bootstrap_${season}`;
    if (historicalDataCache.has(cacheKey)) {
      console.log(`Using cached bootstrap data for season ${season}`);
      return historicalDataCache.get(cacheKey)!;
    }

    const players = await fetchHistoricalPlayers(season);
    const teams = await fetchHistoricalTeams(season);
    
    const bootstrapData: HistoricalBootstrapData = {
      elements: players,
      teams,
      element_types: [], // Not needed for historical data
      events: [], // Not needed for historical data
      season,
      isHistorical: true
    };
    
    // Cache the data
    historicalDataCache.set(cacheKey, bootstrapData);
    
    console.log(`Successfully fetched historical bootstrap data for season ${season}`);
    return bootstrapData;
    
  } catch (error) {
    console.error(`Error fetching historical bootstrap data for season ${season}:`, error);
    throw error;
  }
}

async function fetchHistoricalTeams(season: string): Promise<HistoricalTeamData[]> {
  try {
    const baseUrl = "https://raw.githubusercontent.com/vaastav/Fantasy-Premier-League/master/data";
    const teamsUrl = `${baseUrl}/${season}/teams.csv`;
    
    console.log(`Fetching teams from URL: ${teamsUrl}`);
    
    const response = await fetch(teamsUrl);
    if (!response.ok) {
      console.warn(`Failed to fetch teams for season ${season}, using fallback`);
      return getFallbackTeams();
    }

    const csvText = await response.text();
    return parseCSVToTeams(csvText);
    
  } catch (error) {
    console.warn(`Error fetching teams for season ${season}, using fallback:`, error);
    return getFallbackTeams();
  }
}

function parseCSVToPlayers(csvText: string, season: string): HistoricalPlayerData[] {
  const lines = csvText.split('\n').filter(line => line.trim()); // Remove empty lines
  if (lines.length < 2) {
    console.warn('CSV file appears to be empty or has no data rows');
    return [];
  }
  
  const headers = parseCSVLine(lines[0]).map(h => h.trim().replace(/"/g, ''));
  console.log(`Parsing CSV with headers: ${headers.slice(0, 5).join(', ')}...`);
  
  const players: HistoricalPlayerData[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = parseCSVLine(line);
    if (values.length < headers.length) {
      console.warn(`Skipping row ${i}: insufficient columns (${values.length} vs ${headers.length})`);
      continue;
    }
    
    const player: any = {};
    headers.forEach((header, index) => {
      player[header] = values[index];
    });
    
    // Transform to our expected format based on players_raw.csv structure
    const historicalPlayer: HistoricalPlayerData = {
      id: parseInt(player.id) || i,
      web_name: player.web_name || `${player.first_name || ''} ${player.second_name || ''}`.trim() || 'Unknown',
      first_name: player.first_name || '',
      second_name: player.second_name || '',
      element_type: parseInt(player.element_type) || 1,
      team: parseInt(player.team) || 1,
      total_points: parseInt(player.total_points) || 0,
      goals_scored: parseInt(player.goals_scored) || 0,
      assists: parseInt(player.assists) || 0,
      clean_sheets: parseInt(player.clean_sheets) || 0,
      goals_conceded: parseInt(player.goals_conceded) || 0,
      minutes: parseInt(player.minutes) || 0,
      form: player.form || '0.0',
      selected_by_percent: player.selected_by_percent || '0.0',
      now_cost: parseInt(player.now_cost) || 50,
      points_per_game: player.points_per_game || '0.0',
      bonus: parseInt(player.bonus) || 0,
      bps: parseInt(player.bps) || 0,
      influence: player.influence || '0.0',
      creativity: player.creativity || '0.0',
      threat: player.threat || '0.0',
      ict_index: player.ict_index || '0.0',
      saves: parseInt(player.saves) || 0,
      penalties_saved: parseInt(player.penalties_saved) || 0,
      penalties_missed: parseInt(player.penalties_missed) || 0,
      yellow_cards: parseInt(player.yellow_cards) || 0,
      red_cards: parseInt(player.red_cards) || 0,
      own_goals: parseInt(player.own_goals) || 0,
      cost_change_event: parseInt(player.cost_change_event) || 0,
      cost_change_start: parseInt(player.cost_change_start) || 0,
      value_form: player.value_form || '0.0',
      transfers_in_event: parseInt(player.transfers_in_event) || 0,
      transfers_out_event: parseInt(player.transfers_out_event) || 0,
      expected_goals: parseFloat(player.expected_goals) || 0,
      expected_assists: parseFloat(player.expected_assists) || 0,
      expected_goal_involvements: parseFloat(player.expected_goal_involvements) || 0,
      status: player.status || 'a',
      season,
      isHistorical: true
    };
    
    players.push(historicalPlayer);
  }
  
  return players;
}

function parseCSVToTeams(csvText: string): HistoricalTeamData[] {
  const lines = csvText.split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  
  const teams: HistoricalTeamData[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = parseCSVLine(line);
    if (values.length < headers.length) continue;
    
    const team: any = {};
    headers.forEach((header, index) => {
      team[header] = values[index];
    });
    
    const historicalTeam: HistoricalTeamData = {
      id: parseInt(team.id) || 0,
      name: team.name || 'Unknown Team',
      short_name: team.short_name || team.name?.substring(0, 3).toUpperCase() || 'UNK',
      strength: parseInt(team.strength) || 1000,
      strength_overall_home: parseInt(team.strength_overall_home) || 1000,
      strength_overall_away: parseInt(team.strength_overall_away) || 1000,
      strength_attack_home: parseInt(team.strength_attack_home) || 1000,
      strength_attack_away: parseInt(team.strength_attack_away) || 1000,
      strength_defence_home: parseInt(team.strength_defence_home) || 1000,
      strength_defence_away: parseInt(team.strength_defence_away) || 1000
    };
    
    teams.push(historicalTeam);
  }
  
  return teams;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim().replace(/^"|"$/g, '')); // Remove surrounding quotes
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim().replace(/^"|"$/g, '')); // Remove surrounding quotes
  return result;
}

function getFallbackTeams(): HistoricalTeamData[] {
  // Fallback team data for when we can't fetch historical teams
  return [
    { id: 1, name: 'Arsenal', short_name: 'ARS', strength: 1000, strength_overall_home: 1000, strength_overall_away: 1000, strength_attack_home: 1000, strength_attack_away: 1000, strength_defence_home: 1000, strength_defence_away: 1000 },
    { id: 2, name: 'Aston Villa', short_name: 'AVL', strength: 1000, strength_overall_home: 1000, strength_overall_away: 1000, strength_attack_home: 1000, strength_attack_away: 1000, strength_defence_home: 1000, strength_defence_away: 1000 },
    { id: 3, name: 'Bournemouth', short_name: 'BOU', strength: 1000, strength_overall_home: 1000, strength_overall_away: 1000, strength_attack_home: 1000, strength_attack_away: 1000, strength_defence_home: 1000, strength_defence_away: 1000 },
    { id: 4, name: 'Brentford', short_name: 'BRE', strength: 1000, strength_overall_home: 1000, strength_overall_away: 1000, strength_attack_home: 1000, strength_attack_away: 1000, strength_defence_home: 1000, strength_defence_away: 1000 },
    { id: 5, name: 'Brighton', short_name: 'BHA', strength: 1000, strength_overall_home: 1000, strength_overall_away: 1000, strength_attack_home: 1000, strength_attack_away: 1000, strength_defence_home: 1000, strength_defence_away: 1000 },
    { id: 6, name: 'Chelsea', short_name: 'CHE', strength: 1000, strength_overall_home: 1000, strength_overall_away: 1000, strength_attack_home: 1000, strength_attack_away: 1000, strength_defence_home: 1000, strength_defence_away: 1000 },
    { id: 7, name: 'Crystal Palace', short_name: 'CRY', strength: 1000, strength_overall_home: 1000, strength_overall_away: 1000, strength_attack_home: 1000, strength_attack_away: 1000, strength_defence_home: 1000, strength_defence_away: 1000 },
    { id: 8, name: 'Everton', short_name: 'EVE', strength: 1000, strength_overall_home: 1000, strength_overall_away: 1000, strength_attack_home: 1000, strength_attack_away: 1000, strength_defence_home: 1000, strength_defence_away: 1000 },
    { id: 9, name: 'Fulham', short_name: 'FUL', strength: 1000, strength_overall_home: 1000, strength_overall_away: 1000, strength_attack_home: 1000, strength_attack_away: 1000, strength_defence_home: 1000, strength_defence_away: 1000 },
    { id: 10, name: 'Ipswich', short_name: 'IPS', strength: 1000, strength_overall_home: 1000, strength_overall_away: 1000, strength_attack_home: 1000, strength_attack_away: 1000, strength_defence_home: 1000, strength_defence_away: 1000 },
    { id: 11, name: 'Leicester', short_name: 'LEI', strength: 1000, strength_overall_home: 1000, strength_overall_away: 1000, strength_attack_home: 1000, strength_attack_away: 1000, strength_defence_home: 1000, strength_defence_away: 1000 },
    { id: 12, name: 'Liverpool', short_name: 'LIV', strength: 1000, strength_overall_home: 1000, strength_overall_away: 1000, strength_attack_home: 1000, strength_attack_away: 1000, strength_defence_home: 1000, strength_defence_away: 1000 },
    { id: 13, name: 'Man City', short_name: 'MCI', strength: 1000, strength_overall_home: 1000, strength_overall_away: 1000, strength_attack_home: 1000, strength_attack_away: 1000, strength_defence_home: 1000, strength_defence_away: 1000 },
    { id: 14, name: 'Man Utd', short_name: 'MUN', strength: 1000, strength_overall_home: 1000, strength_overall_away: 1000, strength_attack_home: 1000, strength_attack_away: 1000, strength_defence_home: 1000, strength_defence_away: 1000 },
    { id: 15, name: 'Newcastle', short_name: 'NEW', strength: 1000, strength_overall_home: 1000, strength_overall_away: 1000, strength_attack_home: 1000, strength_attack_away: 1000, strength_defence_home: 1000, strength_defence_away: 1000 },
    { id: 16, name: 'Nott\'m Forest', short_name: 'NFO', strength: 1000, strength_overall_home: 1000, strength_overall_away: 1000, strength_attack_home: 1000, strength_attack_away: 1000, strength_defence_home: 1000, strength_defence_away: 1000 },
    { id: 17, name: 'Southampton', short_name: 'SOU', strength: 1000, strength_overall_home: 1000, strength_overall_away: 1000, strength_attack_home: 1000, strength_attack_away: 1000, strength_defence_home: 1000, strength_defence_away: 1000 },
    { id: 18, name: 'Spurs', short_name: 'TOT', strength: 1000, strength_overall_home: 1000, strength_overall_away: 1000, strength_attack_home: 1000, strength_attack_away: 1000, strength_defence_home: 1000, strength_defence_away: 1000 },
    { id: 19, name: 'West Ham', short_name: 'WHU', strength: 1000, strength_overall_home: 1000, strength_overall_away: 1000, strength_attack_home: 1000, strength_attack_away: 1000, strength_defence_home: 1000, strength_defence_away: 1000 },
    { id: 20, name: 'Wolves', short_name: 'WOL', strength: 1000, strength_overall_home: 1000, strength_overall_away: 1000, strength_attack_home: 1000, strength_attack_away: 1000, strength_defence_home: 1000, strength_defence_away: 1000 }
  ];
}

// Clear cache function for testing
export function clearHistoricalDataCache(): void {
  historicalDataCache.clear();
  console.log('Historical data cache cleared');
}
