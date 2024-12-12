import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  // API data simulation
  const gameweekData = {
    currentGameweek: 16,
    points: 65,
    averagePoints: 52,
    highestPoints: 102,
    rank: 1200000,
    lastRank: 1500000,
  };

  const mockPointsData = Array.from({ length: 15 }, (_, i) => ({
    gameweek: i + 1,
    points: Math.floor(Math.random() * 30) + 40, // Random points between 40-70
    average: Math.floor(Math.random() * 20) + 40, // Random average between 40-60
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
              £{((team?.transfers?.value || 0) / 10).toFixed(1)}m
            </div>
            <div className="text-sm text-muted-foreground">
              Bank: £{((team?.transfers?.bank || 0) / 10).toFixed(1)}m
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
          <PointsChart data={mockPointsData} />
        </CardContent>
      </Card>
    </div>
  );
}
