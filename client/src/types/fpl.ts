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
  cost_change_start: number;
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
  expected_goals?: number;
  expected_assists?: number;
  expected_goal_involvements?: number;
  value_form?: string;
  transfers_in_event?: number;
  transfers_out_event?: number;
  event_points?: number;
  is_optimal?: boolean;
  optimal_reason?: string;
  chance_of_playing_next_round: number | null;
  chance_of_playing_this_round: number | null;
  news: string;
  news_added: string | null;
  cost_change_event_fall?: number;
  next_fixture?: {
    opponent: number;
    difficulty: number;
    clean_sheet_probability?: number;
  };
  stats?: {
    triple_captain_history?: {
      event: number;
      points: number;
    }[];
  };
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
    status?: string;
    transfers_limit?: number;
    event_transfers?: number;
    event_transfers_cost?: number;
  };
  points_history: Array<{
    event: number;
    points: number;
    average: number;
    highest?: number;
    chip?: string;
    points_on_bench?: number;
    event_transfers?: number;
    event_transfers_cost?: number;
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
    event_rank: number;
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
    form?: number;
    value_form?: number;
  };
}

export interface Pick {
  element: number;
  position: number;
  is_captain: boolean;
  is_vice_captain: boolean;
  multiplier: number;
  event_points?: number;
  selection_percentage?: number;
}

export interface Chip {
  name: string;
  time: string;
  event: number;
  status?: string;  // Keep for backwards compatibility
  events?: number[];  // Keep for backwards compatibility
}

export interface Fixture {
  id: number;
  team_h: number;
  team_a: number;
  team_h_score?: number;
  team_a_score?: number;
  finished: boolean;
  started: boolean;
  kickoff_time: string;
  event: number;
  difficulty?: number;
}

export interface GameweekEvent {
  id: number;
  name: string;
  deadline_time: string;
  average_entry_score: number;
  finished: boolean;
  data_checked: boolean;
  highest_scoring_entry?: number;
  deadline_time_epoch: number;
  deadline_time_game_offset: number;
  highest_score?: number;
  is_previous: boolean;
  is_current: boolean;
  is_next: boolean;
  chip_plays: any[];
  most_selected?: number;
  most_transferred_in?: number;
  top_element?: number;
  top_element_info?: any;
  transfers_made: number;
  most_captained?: number;
  most_vice_captained?: number;
  difficulty?: number;
  fixtures: Fixture[];
}

export interface BootstrapTeam {
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
  clean_sheet_probability?: number;
}

export interface GameSettings {
  league_join_private_max: number;
  league_join_public_max: number;
  league_max_size_public_classic: number;
  league_max_size_public_h2h: number;
  league_max_size_private_h2h: number;
  league_max_ko_rounds_private_h2h: number;
  squad_squadplay: number;
  squad_squadsize: number;
  squad_team_limit: number;
  squad_total_spend: number;
  ui_currency_multiplier: number;
  ui_use_special_shirts: boolean;
  stats_form_days: number;
  sys_vice_captain_enabled: boolean;
  transfers_cap: number;
  transfers_sell_on_fee: number;
  cup_start_event_id: number;
  timezone: string;
}

export interface Phase {
  id: number;
  name: string;
  start_event: number;
  stop_event: number;
}

export interface BootstrapStatic {
  events: GameweekEvent[];
  game_settings: GameSettings;
  phases: Phase[];
  teams: BootstrapTeam[];
  total_players: number;
  elements: Player[];
  element_stats: ElementStats[];
  element_types: ElementType[];
  fixtures: Fixture[];
}

export interface ChipInfo {
  name: string;
  played: number;
  max_played: number;
}

export interface ElementStats {
  label: string;
  name: string;
}

export interface ElementType {
  id: number;
  plural_name: string;
  plural_name_short: string;
  singular_name: string;
  singular_name_short: string;
  squad_select: number;
  squad_min_play: number;
  squad_max_play: number;
  element_count: number;
}

export interface ChipPlay {
  chip_name: string;
  num_played: number;
  max_played?: number;
  average_entry_score?: number;
  highest_score?: number;
  most_transferred_in?: number;
  most_transferred_out?: number;
}

export type ChipName = 'wildcard' | 'freehit' | 'bboost' | '3xc';

export type ChipRecommendations = {
  [K in ChipName]: string[];
};

export interface ChipStrategy {
  name: string;
  description: string;
  icon: JSX.Element;
  bestTiming: string[];
  considerations: string[];
  chipName: ChipName;
}