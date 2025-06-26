import { Player, Team, Fixture, BootstrapStatic } from "../types/fpl";

const API_BASE = "/api/fpl";

export async function fetchMyTeam(managerId: number): Promise<Team> {
  console.log("Fetching my team...");
  const res = await fetch(`${API_BASE}/my-team/${managerId}/`);
  if (!res.ok) {
    const error = await res.json();
    console.error("Failed to fetch team. Status:", res.status, "Error:", error);
    throw new Error(error.message || "Failed to fetch team");
  }
  const data = await res.json();
  console.log("Successfully fetched team:", data);
  return data;
}

export async function fetchPlayers(season?: string): Promise<Player[]> {
  console.log("Fetching players...", season ? `for season ${season}` : "");
  const url = season ? `${API_BASE}/players?season=${season}` : `${API_BASE}/players`;
  const res = await fetch(url);
  if (!res.ok) {
    console.error("Failed to fetch players. Status:", res.status);
    throw new Error("Failed to fetch players");
  }
  const data = await res.json();
  console.log(`Successfully fetched ${data.length} players`);
  return data;
}

export async function fetchFixtures(season?: string): Promise<Fixture[]> {
  console.log("Fetching fixtures...", season ? `for season ${season}` : "");
  const url = season ? `${API_BASE}/fixtures?season=${season}` : `${API_BASE}/fixtures`;
  const res = await fetch(url);
  if (!res.ok) {
    console.error("Failed to fetch fixtures. Status:", res.status);
    throw new Error("Failed to fetch fixtures");
  }
  const data = await res.json();
  console.log(`Successfully fetched ${data.length} fixtures`);
  return data;
}

export async function fetchBootstrapStatic(season?: string): Promise<BootstrapStatic> {
  console.log("Fetching bootstrap static...", season ? `for season ${season}` : "");
  const url = season ? `${API_BASE}/bootstrap-static?season=${season}` : `${API_BASE}/bootstrap-static`;
  const res = await fetch(url);
  if (!res.ok) {
    console.error("Failed to fetch bootstrap static. Status:", res.status);
    throw new Error("Failed to fetch bootstrap static");
  }
  const data = await res.json();
  console.log("Successfully fetched bootstrap static");
  return data;
}

export async function makeTransfer(playerId: number, outId: number): Promise<void> {
  console.log("Making transfer...");
  const res = await fetch(`${API_BASE}/transfers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ playerId, outId }),
  });
  if (!res.ok) {
    console.error("Failed to make transfer. Status:", res.status);
    throw new Error("Failed to make transfer");
  }
  console.log("Successfully made transfer");
}

export async function updateCaptains(captainId: number, viceCaptainId: number): Promise<void> {
  console.log("Updating captains...");
  const res = await fetch(`${API_BASE}/captains`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ captainId, viceCaptainId }),
  });
  if (!res.ok) {
    console.error("Failed to update captains. Status:", res.status);
    throw new Error("Failed to update captains");
  }
  console.log("Successfully updated captains");
}

export async function getNextGameweekDeadline(): Promise<string> {
  console.log("Fetching next gameweek deadline...");
  const res = await fetch(`${API_BASE}/next-deadline`);
  if (!res.ok) {
    console.error("Failed to fetch next deadline. Status:", res.status);
    throw new Error("Failed to fetch next deadline");
  }
  const data = await res.json();
  console.log("Successfully fetched next deadline:", data.deadline);
  return data.deadline;
}

export async function fetchTopManagersTeam(): Promise<Team> {
  console.log("Fetching top managers team...");
  const res = await fetch(`${API_BASE}/top-managers-team`);
  console.log("Response status:", res.status);
  console.log("Response headers:", Object.fromEntries(res.headers.entries()));
  
  // Get the raw text first
  const rawText = await res.text();
  console.log("Raw response:", rawText);
  
  if (!res.ok) {
    console.error("Failed to fetch top managers' team. Status:", res.status, "Response:", rawText);
    throw new Error(rawText || "Failed to fetch top managers' team");
  }
  
  try {
    const data = JSON.parse(rawText);
    console.log("Successfully parsed top managers team:", data);
    return data;
  } catch (error) {
    console.error("Failed to parse response as JSON:", error);
    throw new Error("Invalid JSON response from server");
  }
}