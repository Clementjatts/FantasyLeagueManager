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
import { fetchPlayers, fetchFixtures, fetchBootstrapStatic } from "../lib/api";
import { type Player } from "../types/fpl";

interface OptimalTeam {
  firstTeam: Player[];
  substitutes: Player[];
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

function calculateOptimalTeam(allPlayers: Player[], fixtures: any[], teams: any[]): OptimalTeam {
  // Filter out injured and unavailable players first
  const availablePlayers = allPlayers.filter(isPlayerAvailable);

  // Calculate player scores based on multiple factors for better points prediction
  const playerScores = availablePlayers.map(player => {
    const form = parseFloat(player.form || '0') * 1.5;
    const ppg = parseFloat(player.points_per_game || '0');
    const fixtures_score = calculateFixtureScore(player.team, fixtures);
    const minutes_factor = Math.min(player.minutes / 900, 1);
    const bonus_factor = (player.bonus / Math.max(player.minutes / 90, 1)) * 2;

    // Add availability factor - reduce score if there's any doubt about playing
    const availabilityFactor = player.chance_of_playing_next_round === null ? 
      1 : player.chance_of_playing_next_round / 100;

    const expected_points = (
      (form * 0.35) +
      (ppg * 0.25) +
      (fixtures_score * 0.20) +
      (minutes_factor * 0.10) +
      (bonus_factor * 0.10)
    ) * 6 * availabilityFactor;

    return {
      ...player,
      score: expected_points,
      is_optimal: true,
      optimal_reason: ''
    };
  });

  const goalkeepers = playerScores.filter(p => p.element_type === 1).sort((a, b) => b.score - a.score);
  const defenders = playerScores.filter(p => p.element_type === 2).sort((a, b) => b.score - a.score);
  const midfielders = playerScores.filter(p => p.element_type === 3).sort((a, b) => b.score - a.score);
  const forwards = playerScores.filter(p => p.element_type === 4).sort((a, b) => b.score - a.score);

  const formations = [
    { def: 4, mid: 3, fwd: 3 },
    { def: 3, mid: 5, fwd: 2 },
    { def: 4, mid: 4, fwd: 2 },
    { def: 5, mid: 3, fwd: 2 },
    { def: 4, mid: 5, fwd: 1 }
  ];

  let bestFormation = formations[0];
  let highestScore = 0;

  formations.forEach(formation => {
    const score = (
      defenders.slice(0, formation.def).reduce((sum, p) => sum + p.score, 0) +
      midfielders.slice(0, formation.mid).reduce((sum, p) => sum + p.score, 0) +
      forwards.slice(0, formation.fwd).reduce((sum, p) => sum + p.score, 0) +
      goalkeepers[0].score
    );

    if (score > highestScore) {
      highestScore = score;
      bestFormation = formation;
    }
  });

  const firstTeam = [
    goalkeepers[0],
    ...defenders.slice(0, bestFormation.def),
    ...midfielders.slice(0, bestFormation.mid),
    ...forwards.slice(0, bestFormation.fwd)
  ].map((p, i) => ({ ...p, position: i + 1 }));

  const substitutes = [
    goalkeepers[1],
    defenders[bestFormation.def],
    midfielders[bestFormation.mid],
    forwards[bestFormation.fwd]
  ].filter(Boolean).map((p, i) => ({ ...p, position: i + 12 }));

  // Set optimal reasons for first team players
  firstTeam.forEach(player => {
    player.optimal_reason = `Selected for high form (${player.form}) and fixtures score`;
  });

  const sortedByScore = [...firstTeam].sort((a, b) => b.score - a.score);
  const captainId = sortedByScore[0].id;
  const viceCaptainId = sortedByScore[1].id;

  return {
    firstTeam,
    substitutes,
    captainId,
    viceCaptainId,
    formation: `${bestFormation.def}-${bestFormation.mid}-${bestFormation.fwd}`,
    totalPoints: highestScore
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

  const isLoading = playersLoading || fixturesLoading || bootstrapLoading;
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

  const optimalTeam = calculateOptimalTeam(players, fixtures, bootstrap.teams);

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

        <div className="grid gap-6">
          <Card>
            <CardContent className="pt-6">
              <DreamPitch 
                players={optimalTeam.firstTeam}
                substitutes={optimalTeam.substitutes}
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