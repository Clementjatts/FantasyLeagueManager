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
