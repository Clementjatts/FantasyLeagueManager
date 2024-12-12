import { Player, Team, Fixture } from "../types/fpl";

const API_BASE = "/api/fpl";

export async function fetchMyTeam(managerId: number): Promise<Team> {
  const res = await fetch(`${API_BASE}/my-team/${managerId}/`);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to fetch team");
  }
  return res.json();
}

export async function fetchPlayers(): Promise<Player[]> {
  const res = await fetch(`${API_BASE}/players`);
  if (!res.ok) throw new Error("Failed to fetch players");
  return res.json();
}

export async function fetchFixtures(): Promise<Fixture[]> {
  const res = await fetch(`${API_BASE}/fixtures`);
  if (!res.ok) throw new Error("Failed to fetch fixtures");
  return res.json();
}

export async function fetchBootstrapStatic(): Promise<any> {
  const res = await fetch(`${API_BASE}/bootstrap-static`);
  if (!res.ok) throw new Error("Failed to fetch bootstrap data");
  return res.json();
}

export async function makeTransfer(playerId: number, outId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/transfers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ playerId, outId }),
  });
  if (!res.ok) throw new Error("Failed to make transfer");
}

export async function updateCaptains(captainId: number, viceCaptainId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/captains`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ captainId, viceCaptainId }),
  });
  if (!res.ok) throw new Error("Failed to update captains");
}

interface League {
  id: number;
  name: string;
  type: string;
  admin_entry: number;
  started: boolean;
  closed: boolean;
}

interface LeagueStanding {
  entry: number;
  entry_name: string;
  player_name: string;
  rank: number;
  last_rank: number;
  total: number;
  points_behind_leader: number;
}

interface CupMatch {
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

export async function fetchLeagues(managerId: number): Promise<League[]> {
  const res = await fetch(`${API_BASE}/leagues/${managerId}`);
  if (!res.ok) throw new Error("Failed to fetch leagues");
  return res.json();
}

export async function fetchLeagueStandings(leagueId: number): Promise<LeagueStanding[]> {
  const res = await fetch(`${API_BASE}/leagues/${leagueId}/standings`);
  if (!res.ok) throw new Error("Failed to fetch league standings");
  return res.json();
}

export async function fetchCupMatches(managerId: number): Promise<CupMatch[]> {
  const res = await fetch(`${API_BASE}/cup/${managerId}`);
  if (!res.ok) throw new Error("Failed to fetch cup matches");
  return res.json();
}
