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
  goals_scored: number;
  assists: number;
  cost_change_event: number;
  minutes: number;
  clean_sheets: number;
  goals_conceded: number;
  own_goals: number;
  penalties_saved: number;
  penalties_missed: number;
  yellow_cards: number;
  red_cards: number;
  saves: number;
  bonus: number;
  bps: number;
  influence: string;
  creativity: string;
  threat: string;
  ict_index: string;
}

export interface Team {
  picks: Pick[];
  chips: Chip[];
  transfers: {
    limit: number;
    made: number;
    bank: number;
    value: number;
    cost: number;
    status: string;
  };
  points_history: Array<{
    event: number;
    points: number;
    average: number;
    highest: number;
    chip?: string;
  }>;
  summary_overall_points: number;
  summary_overall_rank: number;
  last_deadline_total_transfers: number;
  last_deadline_bank: number;
  last_deadline_value: number;
  current_event: number;
  last_deadline_event: number;
  stats: {
    event_points: number;
    points_on_bench: number;
    overall_points: number;
    overall_rank: number;
    rank_sort: number;
    total_points: number;
    value: number;
    bank: number;
    event_transfers: number;
    event_transfers_cost: number;
    average_entry_score: number;
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
