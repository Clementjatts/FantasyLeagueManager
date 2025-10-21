import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import CaptainSuggestions from "../components/CaptainSuggestions";
import { PlayerStats } from "../components/PlayerStats";
import { DreamPitch } from "../components/pitch/DreamPitch";
import { DreamTeamLegend } from "../components/DreamTeamLegend";
import { TransferRecommendationCard } from "../components/TransferRecommendationCard";
import { fetchMyTeam, fetchPlayers, updateCaptains, fetchBootstrapStatic, fetchFixtures } from "../lib/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { CaptainDialog } from "../components/CaptainDialog";
import { TeamIdInput } from "../components/TeamIdInput";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { type Player, type Team } from "../types/fpl";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Trophy, Zap, Users, AlertCircle, ChevronDown, ChevronRight, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface TransferRecommendation {
  out: Player;
  in: Player;
}

interface OptimalTeam {
  mode: 'optimizer' | 'builder';
  optimalSquad: Player[];
  recommendedTransfers: TransferRecommendation[];
  pointsDelta: number;
  transferCost: number;
  captainId: number;
  viceCaptainId: number;
  formation: string;
  totalPoints: number;
  remainingBudget?: number;
}

function isPlayerAvailable(player: Player): boolean {
  // Consider a player unavailable if:
  // 1. They have 0% chance of playing next round
  // 2. They have no chance specified but are flagged with status
  // 3. They are suspended or unavailable
  const nextRoundChance = player.chance_of_playing_next_round;
  const thisRoundChance = player.chance_of_playing_this_round;

  if (nextRoundChance === 0 || thisRoundChance === 0) return false;
  if (player.status === 'u' || player.status === 'i' || player.status === 's') return false;
  if (player.news && player.news.toLowerCase().includes('suspended')) return false;

  return true;
}

function calculatePointsDeltaMaximizer(
  userTeam: Team, 
  allPlayers: Player[], 
  fixtures: any[], 
  teams: any[]
): OptimalTeam {
  // Get user's current squad
  const userSquad = userTeam.picks.map(pick => ({
    ...allPlayers.find(p => p.id === pick.element)!,
    position: pick.position,
    isUserPlayer: true
  }));

  const bank = userTeam.stats?.bank || 0;
  const freeTransfers = userTeam.transfers?.limit || 0;

  // Calculate Keep Score for each player in user's squad
  const userSquadWithKeepScore = userSquad.map(player => {
    const epNext = parseFloat(player.ep_next || '0');
    const form = parseFloat(player.form || '0');
    const ictIndex = parseFloat(player.ict_index || '0');
    const avgDifficultyNext3 = calculateAverageDifficultyNext3(player.team, fixtures);
    
    const keepScore = (epNext * 0.5) + (form * 0.2) + (ictIndex * 0.1) - (avgDifficultyNext3 * 0.2);
    
    return {
      ...player,
      keepScore
    };
  });

  // Identify weakest links (candidates for transfer OUT)
  const transferOutCandidates = userSquadWithKeepScore
    .sort((a, b) => a.keepScore - b.keepScore)
    .slice(0, 4);

  // Calculate Target Score for all available players (excluding user's players)
  const availablePlayers = allPlayers
    .filter(p => !userSquad.some(up => up.id === p.id))
    .filter(isPlayerAvailable);

  const targetPlayers = availablePlayers.map(player => {
    const epNext = parseFloat(player.ep_next || '0');
    const form = parseFloat(player.form || '0');
    const ictIndex = parseFloat(player.ict_index || '0');
    
    const targetScore = (epNext * 1.2) + (form * 0.5) + (ictIndex * 0.2);
    
    return {
      ...player,
      targetScore
    };
  });

  // Group target players by position
  const targetByPosition = {
    gk: targetPlayers.filter(p => p.element_type === 1).sort((a, b) => b.targetScore - a.targetScore),
    def: targetPlayers.filter(p => p.element_type === 2).sort((a, b) => b.targetScore - a.targetScore),
    mid: targetPlayers.filter(p => p.element_type === 3).sort((a, b) => b.targetScore - a.targetScore),
    fwd: targetPlayers.filter(p => p.element_type === 4).sort((a, b) => b.targetScore - a.targetScore)
  };

  // Simulate different transfer scenarios
  const scenarios = [];

  // Scenario 1: Single Transfer (0 points hit) - Only if free transfers available
  if (transferOutCandidates.length >= 1 && freeTransfers >= 1) {
    const outPlayer = transferOutCandidates[0];
    const positionKey = outPlayer.element_type === 1 ? 'gk' : 
                       outPlayer.element_type === 2 ? 'def' : 
                       outPlayer.element_type === 3 ? 'mid' : 'fwd';
    
    const availableBudget = outPlayer.now_cost + bank;
    const bestReplacement = targetByPosition[positionKey as keyof typeof targetByPosition]
      .find(p => p.now_cost <= availableBudget);
    
    if (bestReplacement) {
      const pointsDelta = parseFloat(bestReplacement.ep_next || '0') - parseFloat(outPlayer.ep_next || '0');
      scenarios.push({
        transfers: [{ out: outPlayer, in: bestReplacement }],
        pointsDelta,
        transferCost: 0,
        type: 'single'
      });
    }
  }

  // Scenario 2: Double Transfer (-4 points hit) - Only if free transfers available
  if (transferOutCandidates.length >= 2 && freeTransfers >= 1) {
    const outPlayer1 = transferOutCandidates[0];
    const outPlayer2 = transferOutCandidates[1];
    const availableBudget = outPlayer1.now_cost + outPlayer2.now_cost + bank;
    
    const position1Key = outPlayer1.element_type === 1 ? 'gk' : 
                        outPlayer1.element_type === 2 ? 'def' : 
                        outPlayer1.element_type === 3 ? 'mid' : 'fwd';
    const position2Key = outPlayer2.element_type === 1 ? 'gk' : 
                        outPlayer2.element_type === 2 ? 'def' : 
                        outPlayer2.element_type === 3 ? 'mid' : 'fwd';
    
    const targets1 = targetByPosition[position1Key as keyof typeof targetByPosition];
    const targets2 = targetByPosition[position2Key as keyof typeof targetByPosition];
    
    let bestPair = null;
    let bestPointsDelta = -Infinity;
    
    for (const target1 of targets1) {
      for (const target2 of targets2) {
        if (target1.id === target2.id) continue; // Can't transfer in the same player twice
        
        const totalCost = target1.now_cost + target2.now_cost;
        if (totalCost <= availableBudget) {
          const pointsDelta = (
            parseFloat(target1.ep_next || '0') + parseFloat(target2.ep_next || '0')
          ) - (
            parseFloat(outPlayer1.ep_next || '0') + parseFloat(outPlayer2.ep_next || '0')
          ) - 4;
          
          if (pointsDelta > bestPointsDelta) {
            bestPointsDelta = pointsDelta;
            bestPair = { out: outPlayer1, in: target1 };
          }
        }
      }
    }
    
    if (bestPair) {
      scenarios.push({
        transfers: [bestPair, { out: outPlayer2, in: bestPair.in }],
        pointsDelta: bestPointsDelta,
        transferCost: 4,
        type: 'double'
      });
    }
  }

  // Scenario 3: Triple Transfer (-8 points hit) - Only if free transfers available
  if (transferOutCandidates.length >= 3 && freeTransfers >= 1) {
    const outPlayer1 = transferOutCandidates[0];
    const outPlayer2 = transferOutCandidates[1];
    const outPlayer3 = transferOutCandidates[2];
    const availableBudget = outPlayer1.now_cost + outPlayer2.now_cost + outPlayer3.now_cost + bank;
    
    // Simplified triple transfer - just find the best single replacement for the weakest player
    const positionKey = outPlayer1.element_type === 1 ? 'gk' : 
                       outPlayer1.element_type === 2 ? 'def' : 
                       outPlayer1.element_type === 3 ? 'mid' : 'fwd';
    
    const bestReplacement = targetByPosition[positionKey as keyof typeof targetByPosition]
      .find(p => p.now_cost <= availableBudget);
    
    if (bestReplacement) {
      const pointsDelta = parseFloat(bestReplacement.ep_next || '0') - parseFloat(outPlayer1.ep_next || '0') - 8;
      scenarios.push({
        transfers: [{ out: outPlayer1, in: bestReplacement }],
        pointsDelta,
        transferCost: 8,
        type: 'triple'
      });
    }
  }

  // Find the best scenario
  const bestScenario = scenarios.reduce((best, current) => 
    current.pointsDelta > best.pointsDelta ? current : best, 
    { transfers: [], pointsDelta: -Infinity, transferCost: 0, type: 'none' }
  );

  // If no free transfers available, recommend holding transfers
  if (freeTransfers === 0) {
    return {
      mode: 'optimizer',
      optimalSquad: userSquad,
      recommendedTransfers: [],
      pointsDelta: 0,
      transferCost: 0,
      captainId: userTeam.picks.find(p => p.is_captain)?.element || userSquad[0].id,
      viceCaptainId: userTeam.picks.find(p => p.is_vice_captain)?.element || userSquad[1].id,
      formation: '4-4-2', // Default formation
      totalPoints: userSquad.reduce((sum, p) => sum + parseFloat(p.ep_next || '0'), 0)
    };
  }

  // If no positive scenario, recommend holding transfers
  if (bestScenario.pointsDelta <= 0) {
    return {
      mode: 'optimizer',
      optimalSquad: userSquad,
      recommendedTransfers: [],
      pointsDelta: 0,
      transferCost: 0,
      captainId: userTeam.picks.find(p => p.is_captain)?.element || userSquad[0].id,
      viceCaptainId: userTeam.picks.find(p => p.is_vice_captain)?.element || userSquad[1].id,
      formation: '4-4-2', // Default formation
      totalPoints: userSquad.reduce((sum, p) => sum + parseFloat(p.ep_next || '0'), 0)
    };
  }

  // Apply the best transfers to create optimized squad
  const optimizedSquad = [...userSquad];
  bestScenario.transfers.forEach(transfer => {
    const outIndex = optimizedSquad.findIndex(p => p.id === transfer.out.id);
    if (outIndex !== -1) {
      optimizedSquad[outIndex] = { ...transfer.in, position: transfer.out.position, isUserPlayer: false };
    }
  });

  // OPTIMIZE FIRST 11 vs BENCH SELECTION
  // Sort all players by expected points (ep_next) to find the best starting XI
  const sortedByEp = [...optimizedSquad].sort((a, b) => 
    parseFloat(b.ep_next || '0') - parseFloat(a.ep_next || '0')
  );

  // Group players by position
  const playersByPosition = {
    gk: sortedByEp.filter(p => p.element_type === 1),
    def: sortedByEp.filter(p => p.element_type === 2),
    mid: sortedByEp.filter(p => p.element_type === 3),
    fwd: sortedByEp.filter(p => p.element_type === 4)
  };

  // Try different formations and pick the one with highest total points
  const formations = [
    { def: 3, mid: 4, fwd: 3 }, // 3-4-3
    { def: 3, mid: 5, fwd: 2 }, // 3-5-2
    { def: 4, mid: 3, fwd: 3 }, // 4-3-3
    { def: 4, mid: 4, fwd: 2 }, // 4-4-2
    { def: 5, mid: 3, fwd: 2 }  // 5-3-2
  ];

  let bestFormation = formations[0];
  let bestScore = 0;

  for (const formation of formations) {
    if (playersByPosition.gk.length >= 1 && 
        playersByPosition.def.length >= formation.def && 
        playersByPosition.mid.length >= formation.mid && 
        playersByPosition.fwd.length >= formation.fwd) {
      
      const score = playersByPosition.gk[0].ep_next +
                   playersByPosition.def.slice(0, formation.def).reduce((sum, p) => sum + parseFloat(p.ep_next || '0'), 0) +
                   playersByPosition.mid.slice(0, formation.mid).reduce((sum, p) => sum + parseFloat(p.ep_next || '0'), 0) +
                   playersByPosition.fwd.slice(0, formation.fwd).reduce((sum, p) => sum + parseFloat(p.ep_next || '0'), 0);
      
      if (score > bestScore) {
        bestScore = score;
        bestFormation = formation;
      }
    }
  }

  // Build optimal starting XI (positions 1-11)
  const optimalStartingXI: any[] = [];
  
  // Goalkeeper (position 1)
  optimalStartingXI.push({ ...playersByPosition.gk[0], position: 1 });
  
  // Defenders (positions 2-6)
  for (let i = 0; i < bestFormation.def; i++) {
    optimalStartingXI.push({ ...playersByPosition.def[i], position: i + 2 });
  }
  
  // Midfielders (positions 7-11)
  for (let i = 0; i < bestFormation.mid; i++) {
    optimalStartingXI.push({ ...playersByPosition.mid[i], position: i + 2 + bestFormation.def });
  }
  
  // Forwards (positions 8-11)
  for (let i = 0; i < bestFormation.fwd; i++) {
    optimalStartingXI.push({ ...playersByPosition.fwd[i], position: i + 2 + bestFormation.def + bestFormation.mid });
  }

  // Build bench (positions 12-15) - ordered by importance for auto-substitution
  const optimalBench: any[] = [];
  
  // Remaining players sorted by expected points (most important first for auto-sub)
  const remainingPlayers = sortedByEp.filter(p => 
    !optimalStartingXI.some(xi => xi.id === p.id)
  );
  
  // Position 12: Goalkeeper substitute (if available)
  const gkSubstitute = remainingPlayers.find(p => p.element_type === 1);
  if (gkSubstitute) {
    optimalBench.push({ ...gkSubstitute, position: 12 });
  }
  
  // Positions 13-15: Other substitutes ordered by expected points
  const otherSubstitutes = remainingPlayers.filter(p => p.id !== gkSubstitute?.id);
  for (let i = 0; i < Math.min(3, otherSubstitutes.length); i++) {
    optimalBench.push({ ...otherSubstitutes[i], position: 13 + i });
  }

  // Combine optimal starting XI and bench
  const finalOptimalSquad = [...optimalStartingXI, ...optimalBench];

  // Determine formation based on selected players
  const formation = `${bestFormation.def}-${bestFormation.mid}-${bestFormation.fwd}`;

  // Set captain and vice-captain based on highest expected points in starting XI
  const captainId = optimalStartingXI[0]?.id || sortedByEp[0]?.id;
  const viceCaptainId = optimalStartingXI[1]?.id || sortedByEp[1]?.id;

  // Calculate total points for starting XI only (bench doesn't count unless auto-sub)
  const startingXIPoints = optimalStartingXI.reduce((sum, p) => sum + parseFloat(p.ep_next || '0'), 0);

  return {
    mode: 'optimizer',
    optimalSquad: finalOptimalSquad,
    recommendedTransfers: bestScenario.transfers,
    pointsDelta: bestScenario.pointsDelta,
    transferCost: bestScenario.transferCost,
    captainId,
    viceCaptainId,
    formation,
    totalPoints: startingXIPoints
  };
}

function calculateAverageDifficultyNext3(teamId: number, fixtures: any[]): number {
  const next3Fixtures = fixtures
    .filter(f => f.team_h === teamId || f.team_a === teamId)
    .filter(f => !f.finished) // Only upcoming fixtures
    .slice(0, 3);
  
  if (next3Fixtures.length === 0) return 3; // Default to medium difficulty
  
  const totalDifficulty = next3Fixtures.reduce((sum, fixture) => {
    const isHome = fixture.team_h === teamId;
    const difficulty = isHome ? fixture.team_h_difficulty : fixture.team_a_difficulty;
    return sum + difficulty;
  }, 0);
  
  return totalDifficulty / next3Fixtures.length;
}

function buildInitialSquad(allPlayers: Player[], fixtures: any[], teams: any[]): OptimalTeam {
  // Filter out unavailable players (chance of playing < 75%)
  const availablePlayers = allPlayers.filter(player => {
    const chance = player.chance_of_playing_next_round;
    return chance === null || chance >= 75;
  });

  // Calculate Value_3GW for each player
  const playersWithValue = availablePlayers.map(player => {
    const epNext1 = parseFloat(player.ep_next || '0');
    const epNext2 = parseFloat(player.ep_next || '0') * 0.9; // Slightly reduced for GW2
    const epNext3 = parseFloat(player.ep_next || '0') * 0.8; // Further reduced for GW3
    const value3GW = (epNext1 + epNext2 + epNext3) / (player.now_cost / 10);
    
    return {
      ...player,
      value3GW,
      epNext1,
      epNext2,
      epNext3
    };
  });

  // Initialize squad building
  let remainingBudget = 100.0;
  const squad: (Player & { value3GW: number; epNext1: number; epNext2: number; epNext3: number })[] = [];
  const clubCounts: { [key: number]: number } = {};
  const positionCounts = { gk: 0, def: 0, mid: 0, fwd: 0 };

  // Greedy selection process
  while (squad.length < 15) {
    let bestPlayer = null;
    let bestValue = -1;

    // Find the best value player that can be legally added
    for (const player of playersWithValue) {
      // Skip if already in squad
      if (squad.some(p => p.id === player.id)) continue;

      // Check position limits
      const positionKey = player.element_type === 1 ? 'gk' : 
                         player.element_type === 2 ? 'def' : 
                         player.element_type === 3 ? 'mid' : 'fwd';
      
      const maxForPosition = positionKey === 'gk' ? 2 : 
                            positionKey === 'def' ? 5 : 
                            positionKey === 'mid' ? 5 : 3;
      
      if (positionCounts[positionKey] >= maxForPosition) continue;

      // Check club limit (max 3 players per club)
      const currentClubCount = clubCounts[player.team] || 0;
      if (currentClubCount >= 3) continue;

      // Check budget
      const playerCost = player.now_cost / 10;
      if (playerCost > remainingBudget) continue;

      // Check if this is the best value
      if (player.value3GW > bestValue) {
        bestValue = player.value3GW;
        bestPlayer = player;
      }
    }

    // Add the best player to squad
    if (bestPlayer) {
      squad.push(bestPlayer);
      remainingBudget -= bestPlayer.now_cost / 10;
      clubCounts[bestPlayer.team] = (clubCounts[bestPlayer.team] || 0) + 1;
      
      const positionKey = bestPlayer.element_type === 1 ? 'gk' : 
                         bestPlayer.element_type === 2 ? 'def' : 
                         bestPlayer.element_type === 3 ? 'mid' : 'fwd';
      positionCounts[positionKey]++;
    } else {
      // No valid player found, break to avoid infinite loop
      break;
    }
  }

  // OPTIMIZE FIRST 11 vs BENCH SELECTION (Same logic as optimizer)
  // Sort all players by expected points (ep_next) to find the best starting XI
  const sortedSquad = [...squad].sort((a, b) => b.epNext1 - a.epNext1);

  // Group players by position
  const playersByPosition = {
    gk: sortedSquad.filter(p => p.element_type === 1),
    def: sortedSquad.filter(p => p.element_type === 2),
    mid: sortedSquad.filter(p => p.element_type === 3),
    fwd: sortedSquad.filter(p => p.element_type === 4)
  };

  // Try different formations and pick the one with highest total points
  const formations = [
    { def: 3, mid: 4, fwd: 3 }, // 3-4-3
    { def: 3, mid: 5, fwd: 2 }, // 3-5-2
    { def: 4, mid: 3, fwd: 3 }, // 4-3-3
    { def: 4, mid: 4, fwd: 2 }, // 4-4-2
    { def: 5, mid: 3, fwd: 2 }  // 5-3-2
  ];

  let bestFormation = formations[0];
  let bestScore = 0;

  for (const formation of formations) {
    if (playersByPosition.gk.length >= 1 && 
        playersByPosition.def.length >= formation.def && 
        playersByPosition.mid.length >= formation.mid && 
        playersByPosition.fwd.length >= formation.fwd) {
      
      const score = playersByPosition.gk[0].epNext1 +
                   playersByPosition.def.slice(0, formation.def).reduce((sum, p) => sum + p.epNext1, 0) +
                   playersByPosition.mid.slice(0, formation.mid).reduce((sum, p) => sum + p.epNext1, 0) +
                   playersByPosition.fwd.slice(0, formation.fwd).reduce((sum, p) => sum + p.epNext1, 0);
      
      if (score > bestScore) {
        bestScore = score;
        bestFormation = formation;
      }
    }
  }

  // Build optimal starting XI (positions 1-11)
  const optimalStartingXI: any[] = [];
  
  // Goalkeeper (position 1)
  optimalStartingXI.push({ ...playersByPosition.gk[0], position: 1 });
  
  // Defenders (positions 2-6)
  for (let i = 0; i < bestFormation.def; i++) {
    optimalStartingXI.push({ ...playersByPosition.def[i], position: i + 2 });
  }
  
  // Midfielders (positions 7-11)
  for (let i = 0; i < bestFormation.mid; i++) {
    optimalStartingXI.push({ ...playersByPosition.mid[i], position: i + 2 + bestFormation.def });
  }
  
  // Forwards (positions 8-11)
  for (let i = 0; i < bestFormation.fwd; i++) {
    optimalStartingXI.push({ ...playersByPosition.fwd[i], position: i + 2 + bestFormation.def + bestFormation.mid });
  }

  // Build bench (positions 12-15) - ordered by importance for auto-substitution
  const optimalBench: any[] = [];
  
  // Remaining players sorted by expected points (most important first for auto-sub)
  const remainingPlayers = sortedSquad.filter(p => 
    !optimalStartingXI.some(xi => xi.id === p.id)
  );
  
  // Position 12: Goalkeeper substitute (if available)
  const gkSubstitute = remainingPlayers.find(p => p.element_type === 1);
  if (gkSubstitute) {
    optimalBench.push({ ...gkSubstitute, position: 12 });
  }
  
  // Positions 13-15: Other substitutes ordered by expected points
  const otherSubstitutes = remainingPlayers.filter(p => p.id !== gkSubstitute?.id);
  for (let i = 0; i < Math.min(3, otherSubstitutes.length); i++) {
    optimalBench.push({ ...otherSubstitutes[i], position: 13 + i });
  }

  // Combine optimal starting XI and bench
  const finalSquad = [...optimalStartingXI, ...optimalBench];

  // Determine formation based on selected players
  const formation = `${bestFormation.def}-${bestFormation.mid}-${bestFormation.fwd}`;

  // Set captain and vice-captain based on highest expected points in starting XI
  const captainId = optimalStartingXI[0]?.id || sortedSquad[0]?.id;
  const viceCaptainId = optimalStartingXI[1]?.id || sortedSquad[1]?.id;

  // Calculate total points for starting XI only (bench doesn't count unless auto-sub)
  const startingXIPoints = optimalStartingXI.reduce((sum, p) => sum + parseFloat(p.epNext1 || '0'), 0);

  return {
    mode: 'builder',
    optimalSquad: finalSquad,
    recommendedTransfers: [],
    pointsDelta: 0,
    transferCost: 0,
    captainId,
    viceCaptainId,
    formation,
    totalPoints: startingXIPoints,
    remainingBudget
  };
}

export default function TeamPage() {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { profile, setFplTeamId } = useAuth();

  // Collapsible section states
  const [isCaptainSectionOpen, setIsCaptainSectionOpen] = useState(false);

  const { data: players, isLoading: isLoadingPlayers } = useQuery({
    queryKey: ["/api/fpl/players"],
    queryFn: fetchPlayers
  });

  const { data: bootstrapData, isLoading: isLoadingBootstrap } = useQuery({
    queryKey: ["/api/fpl/bootstrap-static"],
    queryFn: fetchBootstrapStatic,
  });

  const { data: fixtures, isLoading: isLoadingFixtures } = useQuery({
    queryKey: ["/api/fpl/fixtures"],
    queryFn: fetchFixtures
  });

  const teamId = profile?.fplTeamId || null;

  const { data: team, isLoading: isLoadingTeam } = useQuery({
    queryKey: ["/api/fpl/my-team", teamId],
    queryFn: () => teamId ? fetchMyTeam(teamId) : null,
    enabled: !!teamId
  });

  const [captainId, setCaptainId] = useState<number | undefined>(undefined);
  const [viceCaptainId, setViceCaptainId] = useState<number | undefined>(undefined);

  // Compute optimal team unconditionally to keep hook order stable across renders
  const optimalTeam = useMemo<OptimalTeam | null>(() => {
    if (!players || !fixtures || !bootstrapData) return null;
    // Check if the user has an existing team
    if (team && (team as any).picks && (team as any).picks.length > 0) {
      // MODE A: User is an EXISTING player
      return calculatePointsDeltaMaximizer(team as Team, players, fixtures, (bootstrapData as any).teams);
    }
    // MODE B: User is a NEW player or no team data
    return buildInitialSquad(players, fixtures, (bootstrapData as any).teams);
  }, [team, players, fixtures, bootstrapData]);

  // Initialize captain and vice-captain when team data is loaded
  useEffect(() => {
    if (team?.picks) {
      const captain = team.picks.find(pick => pick.is_captain);
      const viceCaptain = team.picks.find(pick => pick.is_vice_captain);
      setCaptainId(captain?.element);
      setViceCaptainId(viceCaptain?.element);
    }
  }, [team?.picks]);

  // Get current gameweek and next gameweek
  const currentGameweek = bootstrapData?.events?.find((event: any) => event.is_current)?.id;
  const nextGameweek = currentGameweek ? currentGameweek + 1 : null;

  if (!teamId) {
    return (
      <div className="p-6">
        <div className="space-y-8">
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-radiant-violet to-pink-500 bg-clip-text text-transparent">
                  Team Management
                </h1>
                <p className="text-lg text-slate-600 dark:text-slate-300 font-medium">
                  Manage your FPL team transfers and captain selection
                </p>
              </div>
            </div>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground" />
                <h2 className="text-2xl font-semibold">No Team Selected</h2>
                <p className="text-muted-foreground">
                  Enter your FPL team ID to view your team management page
                </p>
                <TeamIdInput onTeamIdChange={setFplTeamId} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isLoadingTeam || isLoadingPlayers || isLoadingBootstrap || isLoadingFixtures) {
    return (
      <div className="p-6">
        <div className="space-y-8">
          <div className="flex flex-col gap-4">
            <Skeleton className="h-10 w-64" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-40" />
            </div>
          </div>
          <div className="grid gap-6">
            <Skeleton className="h-[400px]" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Skeleton className="h-[300px]" />
              <Skeleton className="h-[300px]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!team || !players || !bootstrapData || !fixtures) {
    return (
      <div className="p-6">
        <Alert>
          <AlertDescription>
            Failed to load team data. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Split players into starting XI and substitutes
  const startingXI = team.picks
    .filter(pick => pick.position <= 11)
    .map(pick => ({
      ...players.find(p => p.id === pick.element)!,
      position: pick.position,
    }));
  
  const substitutes = team.picks
    .filter(pick => pick.position > 11)
    .map(pick => ({
      ...players.find(p => p.id === pick.element)!,
      position: pick.position,
    }));

  // Captain selection handler
  const handleCaptainSelect = (player: Player) => {
    setCaptainId(player.id);
    toast({
      title: "Captain Updated",
      description: `${player.web_name} is now your captain`,
    });
  };

  const handleTransfer = (inPlayer: Player, outPlayer: Player) => {
    toast({
      title: "Transfer Initiated",
      description: `${outPlayer.web_name} ➜ ${inPlayer.web_name}`,
    });
  };

  return (
    <div className="p-6">
      <div className="space-y-8">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-500 via-primary to-blue-500 bg-clip-text text-transparent">
                Gameweek {nextGameweek} Transfer Planning
              </h1>
              <p className="text-lg text-muted-foreground">
                Plan your transfers and optimize your team for the upcoming gameweek
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link 
                href="/chips"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500/10 via-primary/10 to-blue-500/10 hover:from-purple-500/20 hover:via-primary/20 hover:to-blue-500/20 text-primary transition-all duration-200 font-medium"
              >
                <Zap className="w-4 h-4" />
                Chips Strategy
              </Link>
              <Link 
                href="/top-managers-team"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500/10 via-primary/10 to-blue-500/10 hover:from-purple-500/20 hover:via-primary/20 hover:to-blue-500/20 text-primary transition-all duration-200 font-medium"
              >
                <Users className="w-4 h-4" />
                Top Managers' Team
              </Link>
            </div>
          </div>
        </div>


        {/* Captain Pick Section */}
        <div className="mb-6">
          <Collapsible open={isCaptainSectionOpen} onOpenChange={setIsCaptainSectionOpen}>
            <CollapsibleTrigger asChild>
              <Button 
                variant="ghost" 
                className="w-full justify-between p-4 h-auto bg-gradient-to-r from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/20 border border-primary/20 rounded-lg mb-4 text-primary hover:text-primary"
              >
                <div className="flex items-center gap-3">
                  <Trophy className="w-5 h-5 text-primary" />
                  <span className="text-lg font-semibold text-primary">Captain Pick Suggestions</span>
                </div>
                {isCaptainSectionOpen ? (
                  <ChevronDown className="w-5 h-5 text-primary" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-primary" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
          <CaptainSuggestions 
            allPlayers={players}
            fixtures={fixtures || []}
            teams={bootstrapData?.teams || []}
            currentCaptainId={captainId || null}
            currentViceCaptainId={viceCaptainId || null}
          />
            </CollapsibleContent>
          </Collapsible>
        </div>


        {/* Dream Team Section */}
        <div className="mb-6">
          <div className="space-y-6">
            {/* Transfer Recommendation Card - Only show for optimizer mode */}
            {optimalTeam?.mode === 'optimizer' && (
              <TransferRecommendationCard
                recommendedTransfers={optimalTeam.recommendedTransfers}
                pointsDelta={optimalTeam.pointsDelta}
                transferCost={optimalTeam.transferCost}
                gameweek={nextGameweek || 1}
                teams={bootstrapData?.teams || []}
            fixtures={fixtures || []}
              />
            )}

            {/* Squad Builder Summary - Only show for builder mode */}
            {optimalTeam?.mode === 'builder' && (
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 shadow-lg">
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    <div className="text-6xl mb-4">🏗️</div>
                    <h3 className="text-2xl font-semibold text-slate-800 mb-2">Your Optimal Starting Squad</h3>
                    <p className="text-slate-600 max-w-2xl mx-auto">
                      This optimized squad is built using the Value_3GW algorithm, prioritizing players with the best 
                      expected points per million over the next 3 gameweeks. Perfect for new managers looking for a 
                      competitive starting team.
                    </p>
                    <div className="grid grid-cols-3 gap-4 mt-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600 mb-1">
                          £{(100 - (optimalTeam.remainingBudget || 0)).toFixed(1)}m
                        </div>
                        <div className="text-sm text-slate-600">Total Cost</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600 mb-1">
                          £{(optimalTeam.remainingBudget || 0).toFixed(1)}m
                        </div>
                        <div className="text-sm text-slate-600">Remaining Budget</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-indigo-600 mb-1">
                          {optimalTeam.totalPoints.toFixed(1)}
                        </div>
                        <div className="text-sm text-slate-600">Expected Points</div>
                      </div>
                    </div>
        </div>
                </CardContent>
              </Card>
            )}

            {/* Optimized Team Pitch */}
            {optimalTeam && (
              <Card>
                <CardContent className="pt-6">
                  <div className="mb-4">
                    <h3 className="text-xl font-semibold text-slate-800 mb-2">
                      {optimalTeam.mode === 'optimizer' 
                        ? `Your Optimized Squad for Gameweek ${nextGameweek || 1}`
                        : `Your Optimal Starting Squad`
                      }
                    </h3>
                    <p className="text-sm text-slate-600">
                      {optimalTeam.mode === 'optimizer' 
                        ? (optimalTeam.recommendedTransfers.length > 0 
                            ? `After applying the recommended transfers, your team is projected to score ${optimalTeam.totalPoints.toFixed(1)} points.`
                            : `Your current team is already optimized and projected to score ${optimalTeam.totalPoints.toFixed(1)} points.`
                          )
                        : `This squad is built for long-term value and is projected to score ${optimalTeam.totalPoints.toFixed(1)} points in the upcoming gameweek.`
                      }
                    </p>
                  </div>
                  <DreamPitch 
                    players={optimalTeam.optimalSquad.filter(p => p.position <= 11)}
                    substitutes={optimalTeam.optimalSquad.filter(p => p.position > 11)}
            fixtures={fixtures || []}
            teams={bootstrapData?.teams || []}
                  />
                </CardContent>
              </Card>
            )}

            {/* Dream Team Legend */}
            {optimalTeam && (
              <DreamTeamLegend 
                formation={optimalTeam.formation}
                totalPoints={optimalTeam.totalPoints}
              />
            )}
          </div>
        </div>

        {selectedPlayer && (
          <PlayerStats player={selectedPlayer} />
        )}

        {selectedPlayer && (
          <CaptainDialog
            player={selectedPlayer}
            isOpen={!!selectedPlayer}
            onClose={() => setSelectedPlayer(null)}
            isCaptain={selectedPlayer.id === captainId}
            isViceCaptain={selectedPlayer.id === viceCaptainId}
            onMakeCaptain={() => {
              updateCaptains(selectedPlayer.id, viceCaptainId || 0)
                .then(() => {
                  queryClient.invalidateQueries({ queryKey: ["/api/fpl/my-team", teamId] });
                  toast({
                    title: "Captain Updated",
                    description: `${selectedPlayer.web_name} is now your captain`,
                  });
                  setSelectedPlayer(null);
                })
                .catch(() => {
                  toast({
                    title: "Error",
                    description: "Failed to update captain",
                    variant: "destructive",
                  });
                });
            }}
            onMakeViceCaptain={() => {
              updateCaptains(captainId || 0, selectedPlayer.id)
                .then(() => {
                  queryClient.invalidateQueries({ queryKey: ["/api/fpl/my-team", teamId] });
                  toast({
                    title: "Vice Captain Updated",
                    description: `${selectedPlayer.web_name} is now your vice captain`,
                  });
                  setSelectedPlayer(null);
                })
                .catch(() => {
                  toast({
                    title: "Error",
                    description: "Failed to update vice captain",
                    variant: "destructive",
                  });
                });
            }}
          />
        )}
      </div>
    </div>
  );
}