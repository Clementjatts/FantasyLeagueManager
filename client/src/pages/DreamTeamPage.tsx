
import React from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TeamPitch } from "../components/TeamPitch";
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

function calculateOptimalTeam(allPlayers: Player[], fixtures: any[], teams: any[]): OptimalTeam {
  // Calculate player scores based on multiple factors for better points prediction
  const playerScores = allPlayers.map(player => {
    const form = parseFloat(player.form || '0') * 1.5;
    const ppg = parseFloat(player.points_per_game || '0');
    const fixtures_score = calculateFixtureScore(player.team, fixtures);
    const minutes_factor = Math.min(player.minutes / 900, 1);
    const bonus_factor = (player.bonus / Math.max(player.minutes / 90, 1)) * 2;
    
    const expected_points = (
      (form * 0.35) +
      (ppg * 0.25) +
      (fixtures_score * 0.20) +
      (minutes_factor * 0.10) +
      (bonus_factor * 0.10)
    ) * 6;
    
    return {
      ...player,
      score: expected_points,
      is_optimal: true,
      optimal_reason: `Expected: ${expected_points.toFixed(1)} (Form: ${form.toFixed(1)}, Fixtures: ${fixtures_score.toFixed(1)})`
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
  const { data: players, isLoading: isLoadingPlayers } = useQuery({
    queryKey: ["/api/fpl/players"],
    queryFn: fetchPlayers
  });

  const { data: fixtures, isLoading: isLoadingFixtures } = useQuery({
    queryKey: ["/api/fpl/fixtures"],
    queryFn: fetchFixtures
  });

  const { data: bootstrapData, isLoading: isLoadingBootstrap } = useQuery({
    queryKey: ["/api/fpl/bootstrap-static"],
    queryFn: fetchBootstrapStatic
  });

  const isLoading = isLoadingPlayers || isLoadingFixtures || isLoadingBootstrap;

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-7xl py-6 px-4 min-h-screen">
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!players || !fixtures || !bootstrapData) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Failed to load data</AlertDescription>
      </Alert>
    );
  }

  const optimalTeam = calculateOptimalTeam(players, fixtures, bootstrapData.teams);

  return (
    <div className="container mx-auto max-w-7xl py-6 px-4 min-h-screen space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/team">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Dream Team</h1>
      </div>

      <Card className="bg-accent/50">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">Recommended Formation: {optimalTeam.formation}</h3>
              <p className="text-sm text-muted-foreground">
                This formation maximizes expected points based on player form and fixture difficulty.
                Total expected points: {optimalTeam.totalPoints.toFixed(1)}
              </p>
            </div>

            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Selection factors:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Recent form (35% weight)</li>
                <li>Season performance (25% weight)</li>
                <li>Upcoming fixtures (20% weight)</li>
                <li>Playing time reliability (10% weight)</li>
                <li>Bonus point potential (10% weight)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <TeamPitch 
        players={optimalTeam.firstTeam}
        substitutes={optimalTeam.substitutes}
        captainId={optimalTeam.captainId}
        viceCaptainId={optimalTeam.viceCaptainId}
        fixtures={fixtures}
        teams={bootstrapData.teams}
        showOptimalReasons={true}
      />
    </div>
  );
}
