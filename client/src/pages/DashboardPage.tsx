import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, Coins, Users, AlertCircle, LogOut } from "lucide-react";
import { PerformanceTimeline } from "../components/PerformanceTimeline";
import { DeadlineCountdown } from "../components/DeadlineCountdown";
import { TeamIdInput } from "../components/TeamIdInput";
import { LivePitch } from "../components/pitch/LivePitch";
import { Player, Pick } from "../types/fpl";
import { fetchMyTeam, fetchPlayers, getNextGameweekDeadline, fetchBootstrapStatic, fetchFixtures } from "../lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { PlayersToWatch } from "@/components/PlayersToWatch";

export default function DashboardPage() {
  const { profile, setFplTeamId } = useAuth();
  const teamId = useMemo(() => profile?.fplTeamId ?? null, [profile?.fplTeamId]);
  const [minimizeStats, setMinimizeStats] = useState(false);

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

  const { data: bootstrapData } = useQuery({
    queryKey: ["/api/fpl/bootstrap-static"],
    queryFn: fetchBootstrapStatic,
  });

  const { data: fixtures } = useQuery({
    queryKey: ["/api/fpl/fixtures"],
    queryFn: fetchFixtures
  });

  const { data: allPlayers } = useQuery({
    queryKey: ["/api/fpl/players"],
    queryFn: fetchPlayers,
    enabled: !!team
  });

  if (!teamId) {
    return (
      <div className="p-6">
        <div className="space-y-8">
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-electric-cyan via-vibrant-magenta to-electric-cyan bg-clip-text text-transparent">
                    Dashboard
                  </h1>
                  <div className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-gradient-to-r from-electric-cyan/20 to-vibrant-magenta/20 backdrop-blur-sm border border-electric-cyan/30 shadow-electric">
                    <span className="text-sm font-medium text-deep-ink dark:text-clean-slate">Gameweek</span>
                    <span className="text-xl font-bold text-electric-cyan">-</span>
                  </div>
                </div>
                <p className="text-lg text-slate-600 dark:text-slate-300 font-medium">
                  Your FPL overview and team management hub
                </p>
              </div>
            </div>
          </div>

          <Card variant="electric">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <AlertCircle className="w-12 h-12 mx-auto text-electric-cyan" />
                <h2 className="text-2xl font-semibold text-deep-ink dark:text-clean-slate">No Team Selected</h2>
                <p className="text-slate-gray">
                  Enter your FPL team ID to view your dashboard
                </p>
                <TeamIdInput onTeamIdChange={setFplTeamId} />
              </div>
            </CardContent>
          </Card>
        </div>
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

  // Derived stats (quick actions removed)

  return (
    <div className="p-6">
      <div className="space-y-8">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-electric-cyan via-vibrant-magenta to-electric-cyan bg-clip-text text-transparent">
                  Dashboard
                </h1>
                <div className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-gradient-to-r from-electric-cyan/20 to-vibrant-magenta/20 border border-electric-cyan/30 shadow-electric">
                  <span className="text-sm font-medium text-deep-ink dark:text-clean-slate">Gameweek</span>
                  <span className="text-xl font-bold text-electric-cyan">{gameweekData.currentGameweek}</span>
                </div>
              </div>
              <p className="text-lg text-slate-gray font-medium">
                Your FPL overview and team management hub
              </p>
            </div>
            <div>
              <button
                onClick={() => setMinimizeStats(v => !v)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium electric-gradient text-white shadow-electric hover:shadow-electric-lg transition-all duration-300 w-44"
                aria-pressed={minimizeStats}
                title={minimizeStats ? "Show full overview" : "Focus on live match view"}
              >
                {minimizeStats ? (
                  <>
                    <span className="inline-block h-2 w-2 rounded-full bg-success" />
                    Show Overview
                  </>
                ) : (
                  <>
                    <span className="inline-block h-2 w-2 rounded-full bg-warning" />
                    Matchday Focus
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* WRAP_START_TOP */}
        {/* Top row: Overall, Gameweek Points, Next Deadline */}
        {!minimizeStats && (
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-3 items-stretch">
              <Card variant="electric" className="group hover:shadow-electric-hover transition-all duration-300">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-electric-cyan group-hover:scale-110 transition-transform" />
                      <CardTitle className="text-lg text-deep-ink dark:text-clean-slate">Overall Performance</CardTitle>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm">
                      <TrendingUp className="w-3.5 h-3.5 text-success" />
                      <span className="text-success font-medium">
                        +{(gameweekData.lastRank - gameweekData.rank).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1 p-3 rounded-lg bg-gradient-to-br from-electric-cyan/20 to-vibrant-magenta/10 border border-electric-cyan/20">
                      <div className="text-sm text-slate-gray">Total Points</div>
                      <div className="text-2xl font-bold text-electric-cyan">
                        {gameweekData.totalPoints}
                      </div>
                    </div>
                    <div className="space-y-1 p-3 rounded-lg bg-gradient-to-br from-vibrant-magenta/20 to-electric-cyan/10 border border-vibrant-magenta/20">
                      <div className="text-sm text-slate-gray">Overall Rank</div>
                      <div className="text-2xl font-bold text-vibrant-magenta tabular-nums">
                        {gameweekData.rank.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card variant="electric" className="group hover:shadow-electric-hover transition-all duration-300">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-electric-cyan group-hover:scale-110 transition-transform" />
                      <CardTitle className="text-lg text-deep-ink dark:text-clean-slate">Gameweek Points</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1 p-3 rounded-lg bg-gradient-to-br from-electric-cyan/20 to-vibrant-magenta/10 border border-electric-cyan/20">
                      <div className="text-sm text-slate-gray">Gameweek Points</div>
                      <div className="text-2xl font-bold text-electric-cyan">
                        {gameweekData.points}
                      </div>
                    </div>
                    <div className="space-y-1 p-3 rounded-lg bg-gradient-to-br from-vibrant-magenta/20 to-electric-cyan/10 border border-vibrant-magenta/20">
                      <div className="text-sm text-slate-gray">Gameweek Rank</div>
                      <div className="text-2xl font-bold text-vibrant-magenta tabular-nums">
                        {(team.stats?.event_rank || 0).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {nextDeadline && (
                <DeadlineCountdown deadline={nextDeadline} />
              )}
            </div>
          </div>
        )}
        {/* WRAP_END_TOP */}

        {/* WRAP_START_BOTTOM */}
        {/* Bottom row: Team Value, Transfers, Players to Watch */}
        {!minimizeStats && (
          <div className="grid gap-6 md:grid-cols-3 items-stretch">
            <Card variant="electric" className="group hover:shadow-electric-hover transition-all duration-300">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Coins className="w-4 h-4 text-electric-cyan group-hover:scale-110 transition-transform" />
                    <CardTitle className="text-lg text-deep-ink dark:text-clean-slate">Team Value</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1 p-3 rounded-lg bg-gradient-to-br from-electric-cyan/20 to-vibrant-magenta/10 border border-electric-cyan/20">
                    <div className="text-sm text-slate-gray">Squad Value</div>
                    <div className="text-2xl font-bold text-electric-cyan">
                      £{gameweekData.teamValue}m
                    </div>
                  </div>
                  <div className="space-y-1 p-3 rounded-lg bg-gradient-to-br from-vibrant-magenta/20 to-electric-cyan/10 border border-vibrant-magenta/20">
                    <div className="text-sm text-slate-gray">In Bank</div>
                    <div className="text-2xl font-bold text-vibrant-magenta tabular-nums">
                      £{gameweekData.bankValue}m
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card variant="electric" className="group hover:shadow-electric-hover transition-all duration-300">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-electric-cyan group-hover:scale-110 transition-transform" />
                    <CardTitle className="text-lg text-deep-ink dark:text-clean-slate">Transfers</CardTitle>
                  </div>
                  <Badge variant="secondary" className="bg-electric-cyan/10 text-electric-cyan border-electric-cyan/20">
                    Cost: {team?.transfers?.cost || 0} pts
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="p-3 rounded-lg bg-gradient-to-br from-electric-cyan/20 to-vibrant-magenta/10 border border-electric-cyan/20">
                  <div className="text-sm text-slate-gray">Free Transfers</div>
                  <div className="text-2xl font-bold text-electric-cyan">
                    {team?.transfers?.limit || 0}
                  </div>
                </div>
              </CardContent>
            </Card>

            <PlayersToWatch />
          </div>
        )}
        {/* WRAP_END_BOTTOM */}

        {/* Live Result below */}
        <div className="space-y-6">
          <Card variant="electric">
            <CardHeader>
              <CardTitle className="text-deep-ink dark:text-clean-slate">Live Result</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {allPlayers ? (
                <LivePitch 
                    players={team.picks
                      .filter((p: Pick) => p.position <= 11)
                      .map((pick: Pick) => {
                        const playerData = allPlayers?.find(p => p.id === pick.element);
                        if (!playerData) return null;
                        return {
                          ...playerData,
                          position: pick.position,
                          is_captain: pick.is_captain,
                          is_vice_captain: pick.is_vice_captain,
                          multiplier: pick.multiplier
                        } as Player & Pick;
                      })
                      .filter((p): p is (Player & Pick) => p !== null)}
                    substitutes={team.picks
                      .filter((p: Pick) => p.position > 11)
                      .map((pick: Pick) => {
                        const playerData = allPlayers?.find(p => p.id === pick.element);
                        if (!playerData) return null;
                        return {
                          ...playerData,
                          position: pick.position,
                          is_captain: pick.is_captain,
                          is_vice_captain: pick.is_vice_captain,
                          multiplier: pick.multiplier
                        } as Player & Pick;
                      })
                      .filter((p): p is (Player & Pick) => p !== null)}
                    captainId={team.picks.find((p: Pick) => p.is_captain)?.element}
                    viceCaptainId={team.picks.find((p: Pick) => p.is_vice_captain)?.element}
                    teams={bootstrapData?.teams || []}
                    fixtures={fixtures || []}
                    showLiveStats={true}
                  />
              ) : (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"/>
                </div>
              )}
            </CardContent>
          </Card>
          {/* Removed Quick Actions and duplicate Next Deadline */}
        </div>

        <Card variant="electric">
          <CardHeader>
            <CardTitle className="text-deep-ink dark:text-clean-slate">Performance History</CardTitle>
          </CardHeader>
          <CardContent>
            <PerformanceTimeline data={pointsData} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}