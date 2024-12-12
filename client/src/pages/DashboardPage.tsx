import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trophy, TrendingUp, Coins, Users, AlertCircle } from "lucide-react";
import { PointsChart } from "../components/PointsChart";
import { DeadlineCountdown } from "../components/DeadlineCountdown";
import { QuickActions } from "../components/QuickActions";
import { TeamIdInput } from "../components/TeamIdInput";
import { fetchMyTeam } from "../lib/api";

export default function DashboardPage() {
  const [teamId, setTeamId] = useState<number | null>(null);
  const { data: team } = useQuery({
    queryKey: ["/api/fpl/my-team", teamId],
    queryFn: () => teamId ? fetchMyTeam(teamId) : null,
    enabled: !!teamId,
  });

  if (!teamId) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <TeamIdInput onTeamIdChange={setTeamId} />
        <Card>
          <CardContent className="p-6">
            <div className="text-center space-y-2">
              <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground" />
              <h2 className="text-2xl font-semibold">No Team Selected</h2>
              <p className="text-muted-foreground">
                Enter your FPL team ID above to view your dashboard
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!team) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Failed to load team data</AlertDescription>
      </Alert>
    );
  }

  const gameweekData = {
    currentGameweek: team?.entry?.gameweek || 0,
    points: team?.entry?.gameweek_points || 0,
    rank: team?.entry?.overall_rank || 0,
    totalPoints: team?.entry?.overall_points || 0,
    lastRank: (team?.entry?.overall_rank || 0) + 1000, // Temporary: show improvement from last rank
    teamValue: ((team?.transfers?.value || 0) / 10).toFixed(1),
    bankValue: ((team?.transfers?.bank || 0) / 10).toFixed(1),
    averagePoints: Math.round((team?.entry?.overall_points || 0) / (team?.entry?.gameweek || 1))
  };

  // Create points history data
  const pointsData = Array.from({ length: gameweekData.currentGameweek || 0 }, (_, i) => ({
    gameweek: i + 1,
    points: gameweekData.averagePoints,
    average: Math.round(gameweekData.averagePoints * 0.9) // Estimate league average as 90% of user's average
  }));

  // In a real app, this would come from the API
  const nextDeadline = new Date();
  nextDeadline.setDate(nextDeadline.getDate() + 3); // Example: 3 days from now

  // Stats for quick actions
  const needsCaptain = !team?.picks?.some(p => p.is_captain);
  const hasTransfers = (team?.transfers?.limit || 0) > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-2">
          <div className="text-sm text-muted-foreground">Gameweek</div>
          <div className="text-2xl font-bold">{gameweekData.currentGameweek}</div>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              <CardTitle>Overall Rank</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {gameweekData.rank.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <TrendingUp className="w-4 h-4 text-green-500" />
              {(gameweekData.lastRank - gameweekData.rank).toLocaleString()} places
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <CardTitle>Gameweek Points</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{gameweekData.points}</div>
            <div className="text-sm text-muted-foreground">
              Average: {gameweekData.averagePoints}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-primary" />
              <CardTitle>Team Value</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              £{gameweekData.teamValue}m
            </div>
            <div className="text-sm text-muted-foreground">
              Bank: £{gameweekData.bankValue}m
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <CardTitle>Transfers</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {team?.transfers?.limit || 0} Free
            </div>
            <div className="text-sm text-muted-foreground">
              Cost: {team?.transfers?.cost || 0} pts
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <DeadlineCountdown deadline={nextDeadline.toISOString()} />
        <QuickActions
          needsCaptain={needsCaptain}
          hasTransfers={hasTransfers}
          transfersAvailable={team?.transfers?.limit || 0}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance History</CardTitle>
        </CardHeader>
        <CardContent>
          <PointsChart data={pointsData} />
        </CardContent>
      </Card>
    </div>
  );
}
