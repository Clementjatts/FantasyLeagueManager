import React, { useMemo } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DreamPitch } from "../components/pitch/DreamPitch";
import { DreamTeamLegend } from "../components/DreamTeamLegend";
import { TransferRecommendationCard } from "../components/TransferRecommendationCard";
import { fetchPlayers, fetchFixtures, fetchBootstrapStatic, fetchMyTeam } from "../lib/api";
import { type Player, type Team } from "../types/fpl";

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

  // Scenario 1: Single Transfer (0 points hit)
  if (transferOutCandidates.length >= 1) {
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

  // Scenario 2: Double Transfer (-4 points hit)
  if (transferOutCandidates.length >= 2) {
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

  // Scenario 3: Triple Transfer (-8 points hit) - Optional
  if (transferOutCandidates.length >= 3) {
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

  // Set captain and vice-captain based on highest expected points
  const sortedByEp = [...optimizedSquad].sort((a, b) => 
    parseFloat(b.ep_next || '0') - parseFloat(a.ep_next || '0')
  );
  const captainId = sortedByEp[0].id;
  const viceCaptainId = sortedByEp[1].id;

  return {
    mode: 'optimizer',
    optimalSquad: optimizedSquad,
    recommendedTransfers: bestScenario.transfers,
    pointsDelta: bestScenario.pointsDelta,
    transferCost: bestScenario.transferCost,
    captainId,
    viceCaptainId,
    formation: '4-4-2', // Default formation for now
    totalPoints: optimizedSquad.reduce((sum, p) => sum + parseFloat(p.ep_next || '0'), 0)
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

  // Sort squad by ep_next for starting XI selection
  const sortedSquad = [...squad].sort((a, b) => b.epNext1 - a.epNext1);

  // Determine starting XI and formation
  const gks = sortedSquad.filter(p => p.element_type === 1);
  const defs = sortedSquad.filter(p => p.element_type === 2);
  const mids = sortedSquad.filter(p => p.element_type === 3);
  const fwds = sortedSquad.filter(p => p.element_type === 4);

  // Try different formations and pick the best one
  const formations = [
    { def: 3, mid: 4, fwd: 3 },
    { def: 3, mid: 5, fwd: 2 },
    { def: 4, mid: 3, fwd: 3 },
    { def: 4, mid: 4, fwd: 2 },
    { def: 5, mid: 3, fwd: 2 }
  ];

  let bestFormation = formations[0];
  let bestScore = 0;

  for (const formation of formations) {
    if (defs.length >= formation.def && mids.length >= formation.mid && fwds.length >= formation.fwd) {
      const score = defs.slice(0, formation.def).reduce((sum, p) => sum + p.epNext1, 0) +
                   mids.slice(0, formation.mid).reduce((sum, p) => sum + p.epNext1, 0) +
                   fwds.slice(0, formation.fwd).reduce((sum, p) => sum + p.epNext1, 0) +
                   gks[0].epNext1;
      
      if (score > bestScore) {
        bestScore = score;
        bestFormation = formation;
      }
    }
  }

  // Create starting XI
  const startingXI = [
    gks[0],
    ...defs.slice(0, bestFormation.def),
    ...mids.slice(0, bestFormation.mid),
    ...fwds.slice(0, bestFormation.fwd)
  ].map((p, i) => ({ ...p, position: i + 1 }));

  // Create substitutes
  const substitutes = [
    gks[1],
    ...defs.slice(bestFormation.def),
    ...mids.slice(bestFormation.mid),
    ...fwds.slice(bestFormation.fwd)
  ].filter(Boolean).map((p, i) => ({ ...p, position: i + 12 }));

  const finalSquad = [...startingXI, ...substitutes];

  // Set captain and vice-captain
  const captainId = startingXI[0].id;
  const viceCaptainId = startingXI[1].id;

  return {
    mode: 'builder',
    optimalSquad: finalSquad,
    recommendedTransfers: [],
    pointsDelta: 0,
    transferCost: 0,
    captainId,
    viceCaptainId,
    formation: `${bestFormation.def}-${bestFormation.mid}-${bestFormation.fwd}`,
    totalPoints: finalSquad.reduce((sum, p) => sum + p.epNext1, 0),
    remainingBudget
  };
}

function calculateFixtureScore(teamId: number, fixtures: any[]): number {
  const nextGameweekFixtures = fixtures.slice(0, 5);
  const teamFixtures = nextGameweekFixtures.filter(f => f.team_h === teamId || f.team_a === teamId);
  
  if (teamFixtures.length === 0) return 1;
  
  return teamFixtures.reduce((score, fixture, index) => {
    const isHome = fixture.team_h === teamId;
    const difficulty = isHome ? fixture.team_h_difficulty : fixture.team_a_difficulty;
    const homeBonus = isHome ? 0.2 : 0;
    const gameweekWeight = (5 - index) / 5;
    const baseScore = (6 - difficulty) / 5;
    return score + (baseScore + homeBonus) * gameweekWeight;
  }, 0) / teamFixtures.length;
}

export default function DreamTeamPage() {
  const teamId = localStorage.getItem("fpl_team_id") ? parseInt(localStorage.getItem("fpl_team_id")!, 10) : null;

  const { data: players, isLoading: playersLoading, error: playersError } = useQuery({
    queryKey: ['players'],
    queryFn: fetchPlayers
  });

  const { data: fixtures, isLoading: fixturesLoading } = useQuery({
    queryKey: ['fixtures'],
    queryFn: fetchFixtures
  });

  const { data: bootstrap, isLoading: bootstrapLoading } = useQuery({
    queryKey: ['bootstrap'],
    queryFn: fetchBootstrapStatic
  });

  const { data: userTeam, isLoading: teamLoading } = useQuery({
    queryKey: ['my-team', teamId],
    queryFn: () => teamId ? fetchMyTeam(teamId) : null,
    enabled: !!teamId
  });

  const isLoading = playersLoading || fixturesLoading || bootstrapLoading || teamLoading;
  const error = playersError;

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="space-y-8">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Link 
                href="/team" 
                className="p-2 rounded-lg hover:bg-primary/10 transition-colors duration-200"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-500 via-primary to-blue-500 bg-clip-text text-transparent">
                Dream Team
              </h1>
            </div>
            <p className="text-lg text-muted-foreground">
              Data-driven optimal team selection based on form, fixtures, and performance
            </p>
          </div>
          <Card>
            <CardContent className="pt-6">
              <Skeleton className="h-32" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !players || !fixtures || !bootstrap) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load dream team data. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Dual-mode algorithm logic
  const optimalTeam = useMemo(() => {
    // Check if the user has an existing team
    if (userTeam && userTeam.picks && userTeam.picks.length > 0) {
      // MODE A: User is an EXISTING player
      // Run the "Personalized Points Maximizer" algorithm
      return calculatePointsDeltaMaximizer(userTeam, players, fixtures, bootstrap.teams);
    } else {
      // MODE B: User is a NEW player or no team data
      // Run the "Initial Squad Builder" algorithm
      return buildInitialSquad(players, fixtures, bootstrap.teams);
    }
  }, [userTeam, players, fixtures, bootstrap.teams]);
  
  // Get current gameweek
  const currentGameweek = bootstrap.events?.find((event: any) => event.is_current)?.id || 1;
  const nextGameweek = currentGameweek + 1;

  return (
    <div className="p-6">
      <div className="space-y-8">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Link 
              href="/team" 
              className="p-2 rounded-lg hover:bg-primary/10 transition-colors duration-200"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-500 via-primary to-blue-500 bg-clip-text text-transparent">
              {optimalTeam.mode === 'optimizer' ? 'Personalized Dream Team' : 'Initial Squad Builder'}
            </h1>
          </div>
          <p className="text-lg text-muted-foreground">
            {optimalTeam.mode === 'optimizer' 
              ? `Data-driven transfer recommendations to maximize your points for Gameweek ${nextGameweek}`
              : `Data-driven optimal squad builder for new managers - the perfect starting team within £100m budget`
            }
          </p>
        </div>

        <div className="grid gap-6">
          {/* Transfer Recommendation Card - Only show for optimizer mode */}
          {optimalTeam.mode === 'optimizer' && (
            <TransferRecommendationCard
              recommendedTransfers={optimalTeam.recommendedTransfers}
              pointsDelta={optimalTeam.pointsDelta}
              transferCost={optimalTeam.transferCost}
              gameweek={nextGameweek}
              teams={bootstrap.teams}
              fixtures={fixtures}
            />
          )}

          {/* Squad Builder Summary - Only show for builder mode */}
          {optimalTeam.mode === 'builder' && (
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
          <Card>
            <CardContent className="pt-6">
              <div className="mb-4">
                <h3 className="text-xl font-semibold text-slate-800 mb-2">
                  {optimalTeam.mode === 'optimizer' 
                    ? `Your Optimized Squad for Gameweek ${nextGameweek}`
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
                captainId={optimalTeam.captainId}
                viceCaptainId={optimalTeam.viceCaptainId}
                fixtures={fixtures}
                teams={bootstrap.teams}
              />
            </CardContent>
          </Card>

          <DreamTeamLegend 
            formation={optimalTeam.formation}
            totalPoints={optimalTeam.totalPoints}
          />
        </div>
      </div>
    </div>
  );
}