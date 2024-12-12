export interface Player {
  id: number;
  web_name: string;
  team: number;
  element_type: number;
  selected_by_percent: string;
  now_cost: number;
  points_per_game: string;
  total_points: number;
  form: string;
  status: string;
  position: number;
}

export interface Team {
  picks: Pick[];
  chips: Chip[];
  transfers: {
    limit: number;
    made: number;
    bank: number;
    value: number;
  };
}

export interface Pick {
  element: number;
  position: number;
  is_captain: boolean;
  is_vice_captain: boolean;
  multiplier: number;
}

export interface Chip {
  name: string;
  status: string;
  events: number[];
}

export interface Fixture {
  id: number;
  team_h: number;
  team_a: number;
  difficulty: number;
  event: number;
}

export interface League {
  id: number;
  name: string;
  standings: LeagueStanding[];
  type: 'classic' | 'h2h';
  admin_entry: number;
  started: boolean;
  closed: boolean;
}

export interface LeagueStanding {
  entry: number;
  entry_name: string;
  player_name: string;
  rank: number;
  last_rank: number;
  total: number;
  points_behind_leader: number;
  matches_played?: number;
  matches_won?: number;
  matches_drawn?: number;
  matches_lost?: number;
}

export interface CupMatch {
  id: number;
  entry_1_entry: number;
  entry_1_name: string;
  entry_1_player_name: string;
  entry_1_points: number;
  entry_2_entry: number;
  entry_2_name: string;
  entry_2_player_name: string;
  entry_2_points: number;
  is_knockout: boolean;
  winner: number;
  round: number;
}
