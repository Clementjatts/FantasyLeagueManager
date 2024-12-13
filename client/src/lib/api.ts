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

export async function getNextGameweekDeadline(): Promise<string> {
  const res = await fetch(`${API_BASE}/next-deadline`);
  if (!res.ok) throw new Error("Failed to fetch next deadline");
  const data = await res.json();
  return data.deadline;
}