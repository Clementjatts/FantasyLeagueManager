import { Player } from '../types/fpl';

interface FPL_Elo_Player {
  id: number;
  status: string;
  chance_of_playing_next_round: number;
  chance_of_playing_this_round: number;
  now_cost: number;
  now_cost_rank: number;
  now_cost_rank_type: string;
  cost_change_event: number;
  cost_change_event_fall: number;
  cost_change_start: number;
  cost_change_start_fall: number;
  selected_by_percent: number;
  selected_rank: number;
  selected_rank_type: string;
  total_points: number;
  event_points: number;
  points_per_game: number;
  points_per_game_rank: number;
  points_per_game_rank_type: string;
  bonus: number;
  bps: number;
  form: number;
  form_rank: number;
  form_rank_type: string;
  value_form: number;
  value_season: number;
  dreamteam_count: number;
  transfers_in: number;
  transfers_in_event: number;
  transfers_out: number;
  transfers_out_event: number;
  ep_next: number;
  ep_this: number;
  expected_goals: number;
  expected_assists: number;
  expected_goal_involvements: number;
  expected_goals_conceded: number;
  expected_goals_per_90: number;
  expected_assists_per_90: number;
  expected_goal_involvements_per_90: number;
  expected_goals_conceded_per_90: number;
  influence: number;
  influence_rank: number;
  influence_rank_type: string;
  creativity: number;
  creativity_rank: number;
  creativity_rank_type: string;
  threat: number;
  threat_rank: number;
  threat_rank_type: string;
  ict_index: number;
  ict_index_rank: number;
  ict_index_rank_type: string;
  corners_and_indirect_freekicks_order: string;
  direct_freekicks_order: string;
  penalties_order: string;
  gw: number;
  set_piece_threat: number;
}

interface FPL_Elo_Match_Stats {
  player_id: number;
  match_id: number;
  minutes_played: number;
  goals: number;
  assists: number;
  total_shots: number;
  xg: number;
  xa: number;
  xgot: number;
  shots_on_target: number;
  successful_dribbles: number;
  big_chances_missed: number;
  touches_opposition_box: number;
  touches: number;
  accurate_passes: number;
  chances_created: number;
  final_third_passes: number;
  accurate_crosses: number;
  accurate_long_balls: number;
  tackles_won: number;
  interceptions: number;
  recoveries: number;
  blocks: number;
  clearances: number;
  headed_clearances: number;
  dribbled_past: number;
  duels_won: number;
  duels_lost: number;
  ground_duels_won: number;
  aerial_duels_won: number;
  was_fouled: number;
  fouls_committed: number;
  saves: number;
  goals_conceded: number;
  xgot_faced: number;
  goals_prevented: number;
  sweeper_actions: number;
  gk_accurate_passes: number;
  gk_accurate_long_balls: number;
  offsides: number;
  high_claim: number;
  tackles: number;
  accurate_passes_percent: number;
  accurate_crosses_percent: number;
  accurate_long_balls_percent: number;
  ground_duels_won_percent: number;
  aerial_duels_won_percent: number;
  successful_dribbles_percent: number;
  tackles_won_percent: number;
  start_min: number;
  finish_min: number;
  team_goals_conceded: number;
  penalties_scored: number;
  penalties_missed: number;
}

// Cache for enhanced data
const enhancedDataCache = new Map<string, any>();

export async function fetchEnhancedFPLData(): Promise<Player[]> {
  const cacheKey = 'enhanced_fpl_data';
  
  // Check cache first
  if (enhancedDataCache.has(cacheKey)) {
    console.log('Using cached enhanced FPL data');
    return enhancedDataCache.get(cacheKey);
  }

  try {
    console.log('Fetching enhanced FPL data from FPL-Elo-Insights...');
    
    // Fetch official FPL data
    const officialResponse = await fetch('https://fantasy.premierleague.com/api/bootstrap-static/');
    const officialData = await officialResponse.json();
    
    // Fetch FPL-Elo-Insights player stats
    const eloResponse = await fetch('https://raw.githubusercontent.com/olbauday/FPL-Elo-Insights/main/data/2024-2025/playerstats/playerstats.csv');
    const eloDataText = await eloResponse.text();
    
    // Parse CSV data
    const eloPlayers = parseCSVToEloPlayers(eloDataText);
    
    // Merge the data
    const enhancedPlayers = mergeFPLData(officialData.elements, eloPlayers);
    
    // Cache the result
    enhancedDataCache.set(cacheKey, enhancedPlayers);
    
    console.log(`Successfully fetched and merged ${enhancedPlayers.length} enhanced players`);
    return enhancedPlayers;
    
  } catch (error) {
    console.error('Error fetching enhanced FPL data:', error);
    
    // Fallback to official FPL data only
    try {
      const officialResponse = await fetch('https://fantasy.premierleague.com/api/bootstrap-static/');
      const officialData = await officialResponse.json();
      return officialData.elements;
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
      throw new Error('Failed to fetch any FPL data');
    }
  }
}

function parseCSVToEloPlayers(csvText: string): FPL_Elo_Player[] {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',');
  const players: FPL_Elo_Player[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length >= headers.length) {
      const player: any = {};
      headers.forEach((header, index) => {
        const value = values[index];
        // Convert numeric fields
        if (['id', 'now_cost', 'now_cost_rank', 'cost_change_event', 'cost_change_event_fall', 
             'cost_change_start', 'cost_change_start_fall', 'selected_by_percent', 'selected_rank',
             'total_points', 'event_points', 'points_per_game', 'points_per_game_rank', 'bonus', 'bps',
             'form', 'form_rank', 'value_form', 'value_season', 'dreamteam_count', 'transfers_in',
             'transfers_in_event', 'transfers_out', 'transfers_out_event', 'ep_next', 'ep_this',
             'expected_goals', 'expected_assists', 'expected_goal_involvements', 'expected_goals_conceded',
             'expected_goals_per_90', 'expected_assists_per_90', 'expected_goal_involvements_per_90',
             'expected_goals_conceded_per_90', 'influence', 'influence_rank', 'creativity', 'creativity_rank',
             'threat', 'threat_rank', 'ict_index', 'ict_index_rank', 'gw', 'set_piece_threat',
             'chance_of_playing_next_round', 'chance_of_playing_this_round'].includes(header)) {
          player[header] = value ? parseFloat(value) : 0;
        } else {
          player[header] = value || '';
        }
      });
      players.push(player as FPL_Elo_Player);
    }
  }
  
  return players;
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
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

function mergeFPLData(officialPlayers: any[], eloPlayers: FPL_Elo_Player[]): Player[] {
  const eloMap = new Map(eloPlayers.map(p => [p.id, p]));
  
  return officialPlayers.map(officialPlayer => {
    const eloPlayer = eloMap.get(officialPlayer.id);
    
    if (!eloPlayer) {
      return officialPlayer; // Return official player if no enhanced data
    }
    
    // Merge enhanced data
    return {
      ...officialPlayer,
      // Enhanced rankings
      now_cost_rank: eloPlayer.now_cost_rank,
      now_cost_rank_type: eloPlayer.now_cost_rank_type,
      points_per_game_rank: eloPlayer.points_per_game_rank,
      points_per_game_rank_type: eloPlayer.points_per_game_rank_type,
      form_rank: eloPlayer.form_rank,
      form_rank_type: eloPlayer.form_rank_type,
      selected_rank: eloPlayer.selected_rank,
      selected_rank_type: eloPlayer.selected_rank_type,
      
      // Enhanced expected stats
      expected_goal_involvements: eloPlayer.expected_goal_involvements,
      expected_goals_conceded: eloPlayer.expected_goals_conceded,
      expected_goals_per_90: eloPlayer.expected_goals_per_90,
      expected_assists_per_90: eloPlayer.expected_assists_per_90,
      expected_goal_involvements_per_90: eloPlayer.expected_goal_involvements_per_90,
      expected_goals_conceded_per_90: eloPlayer.expected_goals_conceded_per_90,
      
      // ICT rankings
      influence_rank: eloPlayer.influence_rank,
      influence_rank_type: eloPlayer.influence_rank_type,
      creativity_rank: eloPlayer.creativity_rank,
      creativity_rank_type: eloPlayer.creativity_rank_type,
      threat_rank: eloPlayer.threat_rank,
      threat_rank_type: eloPlayer.threat_rank_type,
      ict_index_rank: eloPlayer.ict_index_rank,
      ict_index_rank_type: eloPlayer.ict_index_rank_type,
      
      // Set piece data
      corners_and_indirect_freekicks_order: eloPlayer.corners_and_indirect_freekicks_order,
      direct_freekicks_order: eloPlayer.direct_freekicks_order,
      penalties_order: eloPlayer.penalties_order,
      set_piece_threat: eloPlayer.set_piece_threat,
      
      // Enhanced availability
      chance_of_playing_next_round: eloPlayer.chance_of_playing_next_round,
      chance_of_playing_this_round: eloPlayer.chance_of_playing_this_round,
      
      // Enhanced value metrics
      value_form: eloPlayer.value_form,
      value_season: eloPlayer.value_season,
      
      // Enhanced transfer data
      transfers_in: eloPlayer.transfers_in,
      transfers_out: eloPlayer.transfers_out,
      
      // Enhanced expected points
      ep_next: eloPlayer.ep_next,
      ep_this: eloPlayer.ep_this,
      
      // Dream team appearances
      dreamteam_count: eloPlayer.dreamteam_count,
      
      // Current gameweek
      current_gw: eloPlayer.gw
    };
  });
}

export async function fetchEnhancedMatchStats(playerId: number): Promise<FPL_Elo_Match_Stats[]> {
  try {
    const response = await fetch('https://raw.githubusercontent.com/olbauday/FPL-Elo-Insights/main/data/2024-2025/playermatchstats/playermatchstats.csv');
    const csvText = await response.text();
    
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',');
    const stats: FPL_Elo_Match_Stats[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length >= headers.length) {
        const playerIdFromCSV = parseInt(values[0]);
        if (playerIdFromCSV === playerId) {
          const stat: any = {};
          headers.forEach((header, index) => {
            const value = values[index];
            // Convert numeric fields
            if (['player_id', 'match_id', 'minutes_played', 'goals', 'assists', 'total_shots',
                 'xg', 'xa', 'xgot', 'shots_on_target', 'successful_dribbles', 'big_chances_missed',
                 'touches_opposition_box', 'touches', 'accurate_passes', 'chances_created',
                 'final_third_passes', 'accurate_crosses', 'accurate_long_balls', 'tackles_won',
                 'interceptions', 'recoveries', 'blocks', 'clearances', 'headed_clearances',
                 'dribbled_past', 'duels_won', 'duels_lost', 'ground_duels_won', 'aerial_duels_won',
                 'was_fouled', 'fouls_committed', 'saves', 'goals_conceded', 'xgot_faced',
                 'goals_prevented', 'sweeper_actions', 'gk_accurate_passes', 'gk_accurate_long_balls',
                 'offsides', 'high_claim', 'tackles', 'accurate_passes_percent', 'accurate_crosses_percent',
                 'accurate_long_balls_percent', 'ground_duels_won_percent', 'aerial_duels_won_percent',
                 'successful_dribbles_percent', 'tackles_won_percent', 'start_min', 'finish_min',
                 'team_goals_conceded', 'penalties_scored', 'penalties_missed'].includes(header)) {
              stat[header] = value ? parseFloat(value) : 0;
            } else {
              stat[header] = value || '';
            }
          });
          stats.push(stat as FPL_Elo_Match_Stats);
        }
      }
    }
    
    return stats;
  } catch (error) {
    console.error('Error fetching enhanced match stats:', error);
    return [];
  }
}
