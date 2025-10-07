import React from "react";
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
  optimalSquad: Player[];
  recommendedTransfers: TransferRecommendation[];
  pointsDelta: number;
  transferCost: number;
  captainId: number;
  viceCaptainId: number;
  formation: string;
  totalPoints: number;
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
              AI-powered optimal team selection based on form, fixtures, and performance
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

  if (!teamId || !userTeam) {
    return (
      <div className="p-6">
        <Alert>
          <AlertDescription>
            Please connect your FPL account to view your personalized dream team.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const optimalTeam = calculatePointsDeltaMaximizer(userTeam, players, fixtures, bootstrap.teams);
  
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
              Personalized Dream Team
            </h1>
          </div>
          <p className="text-lg text-muted-foreground">
            AI-powered transfer recommendations to maximize your points for Gameweek {nextGameweek}
          </p>
        </div>

        <div className="grid gap-6">
          {/* Transfer Recommendation Card */}
          <TransferRecommendationCard
            recommendedTransfers={optimalTeam.recommendedTransfers}
            pointsDelta={optimalTeam.pointsDelta}
            transferCost={optimalTeam.transferCost}
            gameweek={nextGameweek}
            teams={bootstrap.teams}
            fixtures={fixtures}
          />

          {/* Optimized Team Pitch */}
          <Card>
            <CardContent className="pt-6">
              <div className="mb-4">
                <h3 className="text-xl font-semibold text-slate-100 mb-2">
                  Your Optimized Squad for Gameweek {nextGameweek}
                </h3>
                <p className="text-sm text-slate-400">
                  {optimalTeam.recommendedTransfers.length > 0 
                    ? `After applying the recommended transfers, your team is projected to score ${optimalTeam.totalPoints.toFixed(1)} points.`
                    : `Your current team is already optimized and projected to score ${optimalTeam.totalPoints.toFixed(1)} points.`
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