import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trophy, TrendingUp, Coins, Users, AlertCircle } from "lucide-react";
import { PerformanceTimeline } from "../components/PerformanceTimeline";
import { DeadlineCountdown } from "../components/DeadlineCountdown";
import { QuickActions } from "../components/QuickActions";
import { TeamIdInput } from "../components/TeamIdInput";
import { TeamQuickView } from "../components/TeamQuickView";
import { ChipsStatus } from "../components/ChipsStatus";
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
    currentGameweek: team?.last_deadline_event || 0,
    points: team?.stats?.event_points || 0,
    rank: team?.summary_overall_rank || 0,
    totalPoints: team?.summary_overall_points || 0,
    lastRank: team?.stats?.rank_sort || 0,
    teamValue: ((team?.last_deadline_value || 0) / 10).toFixed(1),
    bankValue: ((team?.last_deadline_bank || 0) / 10).toFixed(1),
  };

  // Points data for the history chart
  const pointsData = team?.points_history?.map(gw => ({
    gameweek: gw.event || 0,
    points: gw.points || 0,
    average: gw.average || 0
  })) || [];

  // Fetch next deadline
  const { data: nextDeadline } = useQuery({
    queryKey: ["/api/fpl/next-deadline"],
    queryFn: getNextGameweekDeadline
  });

  // Stats for quick actions
  const needsCaptain = !team?.picks?.some(p => p.is_captain);
  const hasTransfers = (team?.transfers?.limit || 0) > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <button
            onClick={() => {
              localStorage.removeItem("fpl_team_id");
              setTeamId(null);
            }}
            className="text-sm px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors duration-200"
          >
            Change Team
          </button>
        </div>
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
              <CardTitle>Overall Performance</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-3xl font-bold">
                  {gameweekData.rank.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Overall Rank</div>
                <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  {(gameweekData.lastRank - gameweekData.rank).toLocaleString()} places
                </div>
              </div>
              <div>
                <div className="text-3xl font-bold">
                  {gameweekData.totalPoints}
                </div>
                <div className="text-sm text-muted-foreground">Total Points</div>
                <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  Current GW: {gameweekData.points}
                </div>
              </div>
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-3xl font-bold">{gameweekData.points}</div>
                <div className="text-sm text-muted-foreground">GW Points</div>
              </div>
              <div>
                <div className="text-3xl font-bold">
                  {team?.stats?.event_rank?.toLocaleString() || '-'}
                </div>
                <div className="text-sm text-muted-foreground">GW Rank</div>
              </div>
            </div>
            <div className="text-sm text-muted-foreground mt-2">
              Average: {team?.stats?.event_average || Math.round(gameweekData.points * 0.85)}
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
              Cost: {team?.transfers?.made || 0} pts
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

      <div className="grid gap-6 md:grid-cols-2">
        <TeamQuickView picks={team.picks} />
        <ChipsStatus chips={team.chips} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance History</CardTitle>
        </CardHeader>
        <CardContent>
          <PerformanceTimeline data={pointsData} />
        </CardContent>
      </Card>
    </div>
  );
}
