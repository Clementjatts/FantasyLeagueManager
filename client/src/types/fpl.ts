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
