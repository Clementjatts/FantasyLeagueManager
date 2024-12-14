import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trophy, TrendingUp, Coins, Users, AlertCircle } from "lucide-react";
import { PerformanceTimeline } from "../components/PerformanceTimeline";
import { DeadlineCountdown } from "../components/DeadlineCountdown";
import { QuickActions } from "../components/QuickActions";
import { TeamIdInput } from "../components/TeamIdInput";
import { TeamPitch } from "../components/TeamPitch";
import { ChipsStatus } from "../components/ChipsStatus";
import { fetchMyTeam, fetchPlayers, getNextGameweekDeadline } from "../lib/api";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const [teamId, setTeamId] = useState<number | null>(() => {
    const savedId = localStorage.getItem("fpl_team_id");
    return savedId ? parseInt(savedId, 10) : null;
  });

  // Always fetch deadline, regardless of team ID
  const { data: nextDeadline } = useQuery({
    queryKey: ["/api/fpl/next-deadline"],
    queryFn: getNextGameweekDeadline
  });

  const { data: team, isLoading: isLoadingTeam } = useQuery({
    queryKey: ["/api/fpl/my-team", teamId],
    queryFn: () => teamId ? fetchMyTeam(teamId) : null,
    enabled: !!teamId
  });

  const { data: allPlayers } = useQuery({
    queryKey: ["/api/fpl/players"],
    queryFn: fetchPlayers,
    enabled: !!team
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

  if (isLoadingTeam) {
    return <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-96 w-full" />
    </div>;
  }

  if (!team) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Failed to load team data</AlertDescription>
      </Alert>
    );
  }

  const gameweekData = {
    currentGameweek: team.last_deadline_event || 0,
    points: team.stats?.event_points || 0,
    rank: team.summary_overall_rank || 0,
    totalPoints: team.summary_overall_points || 0,
    lastRank: team.stats?.rank_sort || 0,
    teamValue: ((team.last_deadline_value || 0) / 10).toFixed(1),
    bankValue: ((team.last_deadline_bank || 0) / 10).toFixed(1),
  };

  // Points data for the history chart
  const pointsData = team.points_history?.map(gw => ({
    gameweek: gw.event || 0,
    points: gw.points || 0,
    average: gw.average || 0
  })) || [];

  // Stats for quick actions
  const needsCaptain = !team.picks?.some(p => p.is_captain);
  const hasTransfers = (team.transfers?.limit || 0) > 0;

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
        <Card className="group hover:shadow-lg transition-all duration-300">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                <CardTitle className="text-lg">Overall Performance</CardTitle>
              </div>
              <div className="flex items-center gap-1.5 text-sm">
                <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                <span className="text-green-500 font-medium">
                  +{(gameweekData.lastRank - gameweekData.rank).toLocaleString()}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1 p-2 rounded-lg bg-primary/5">
                <div className="text-sm text-muted-foreground">Total Points</div>
                <div className="text-2xl font-bold bg-gradient-to-br from-primary to-primary/80 bg-clip-text text-transparent">
                  {gameweekData.totalPoints}
                </div>
              </div>
              <div className="space-y-1 p-2 rounded-lg bg-primary/5">
                <div className="text-sm text-muted-foreground">Overall Rank</div>
                <div className="text-2xl font-bold tabular-nums">
                  {gameweekData.rank.toLocaleString()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                <CardTitle className="text-lg">Gameweek Points</CardTitle>
              </div>
              <Badge variant="secondary" className="bg-primary/10">
                Average: {team.stats?.average_entry_score || Math.round(gameweekData.points * 0.85)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1 p-2 rounded-lg bg-primary/5">
                <div className="text-sm text-muted-foreground">Gameweek Points</div>
                <div className="text-2xl font-bold bg-gradient-to-br from-primary to-primary/80 bg-clip-text text-transparent">
                  {gameweekData.points}
                </div>
              </div>
              <div className="space-y-1 p-2 rounded-lg bg-primary/5">
                <div className="text-sm text-muted-foreground">Gameweek Rank</div>
                <div className="text-2xl font-bold tabular-nums">
                  {(team.stats?.event_rank || team.stats?.rank_sort || 0).toLocaleString()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                <CardTitle className="text-lg">Team Value</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1 p-2 rounded-lg bg-primary/5">
                <div className="text-sm text-muted-foreground">Squad Value</div>
                <div className="text-2xl font-bold bg-gradient-to-br from-primary to-primary/80 bg-clip-text text-transparent">
                  £{gameweekData.teamValue}m
                </div>
              </div>
              <div className="space-y-1 p-2 rounded-lg bg-primary/5">
                <div className="text-sm text-muted-foreground">In Bank</div>
                <div className="text-2xl font-bold tabular-nums">
                  £{gameweekData.bankValue}m
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                <CardTitle className="text-lg">Transfers</CardTitle>
              </div>
              <Badge variant="secondary" className="bg-primary/10">
                Cost: {team?.transfers?.made || 0} pts
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="p-2 rounded-lg bg-primary/5">
              <div className="text-sm text-muted-foreground">Free Transfers</div>
              <div className="text-2xl font-bold bg-gradient-to-br from-primary to-primary/80 bg-clip-text text-transparent">
                {team?.transfers?.limit || 0}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Live Result</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {allPlayers ? (
              <TeamPitch 
                players={team.picks
                  .filter((p: any) => p.position <= 11)
                  .map((pick: any) => ({
                    ...allPlayers.find((p: any) => p.id === pick.element),
                    is_captain: pick.is_captain,
                    is_vice_captain: pick.is_vice_captain,
                    multiplier: pick.multiplier
                  }))}
                substitutes={team.picks
                  .filter((p: any) => p.position > 11)
                  .map((pick: any) => ({
                    ...allPlayers.find((p: any) => p.id === pick.element),
                    is_captain: pick.is_captain,
                    is_vice_captain: pick.is_vice_captain,
                    multiplier: pick.multiplier
                  }))}
                captainId={team.picks.find((p: any) => p.is_captain)?.element}
                viceCaptainId={team.picks.find((p: any) => p.is_vice_captain)?.element}
              />
            ) : (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"/>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          {nextDeadline && <DeadlineCountdown deadline={nextDeadline} />}
          <QuickActions
            needsCaptain={needsCaptain}
            hasTransfers={hasTransfers}
            transfersAvailable={team?.transfers?.limit || 0}
          />
        </div>
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