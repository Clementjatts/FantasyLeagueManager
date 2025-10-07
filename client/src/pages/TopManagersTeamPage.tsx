import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { fetchPlayers, fetchBootstrapStatic, fetchFixtures, fetchTopManagersTeam } from "../lib/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { TopManagersPitch } from "../components/pitch/TopManagersPitch";
import { AlertCircle, ArrowLeft, SlidersHorizontal } from "lucide-react";
import { type Player, type Pick } from "../types/fpl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TeamStats {
  teamId: number;
  teamName: string;
  playerCount: number;
  averagePrice: number;
  totalSelectionPercentage: number;
}

const TeamStatsCard = ({ stats }: { stats: TeamStats }) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-sm">{stats.teamName}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-2 text-sm">
        <p className="flex justify-between">
          <span className="text-muted-foreground">Players Selected:</span>
          <span className="font-medium">{stats.playerCount}</span>
        </p>
        <p className="flex justify-between">
          <span className="text-muted-foreground">Avg. Price:</span>
          <span className="font-medium">£{stats.averagePrice.toFixed(1)}m</span>
        </p>
        <p className="flex justify-between">
          <span className="text-muted-foreground">Avg. Elite Ownership:</span>
          <span className="font-medium">{(stats.totalSelectionPercentage / stats.playerCount).toFixed(1)}%</span>
        </p>
      </div>
    </CardContent>
  </Card>
);

export default function TopManagersTeamPage() {
  const { 
    data: players, 
    isLoading: isLoadingPlayers,
    refetch: refetchPlayers
  } = useQuery({
    queryKey: ["/api/fpl/players"],
    queryFn: fetchPlayers
  });

  const { 
    data: bootstrapData, 
    isLoading: isLoadingBootstrap,
    refetch: refetchBootstrap
  } = useQuery({
    queryKey: ["/api/fpl/bootstrap-static"],
    queryFn: fetchBootstrapStatic,
  });

  const { 
    data: fixtures, 
    isLoading: isLoadingFixtures,
    refetch: refetchFixtures
  } = useQuery({
    queryKey: ["/api/fpl/fixtures"],
    queryFn: fetchFixtures
  });

  const { 
    data: topManagersTeam, 
    isLoading: isLoadingTopTeam, 
    error: topTeamError,
    refetch: refetchTopTeam
  } = useQuery({
    queryKey: ["/api/fpl/top-managers-team"],
    queryFn: fetchTopManagersTeam
  });

  const isLoading = isLoadingPlayers || isLoadingBootstrap || isLoadingFixtures || isLoadingTopTeam;
  const loadingProgress = useMemo(() => {
    const total = 4;
    const loaded = [!isLoadingPlayers, !isLoadingBootstrap, !isLoadingFixtures, !isLoadingTopTeam]
      .filter(Boolean).length;
    return (loaded / total) * 100;
  }, [isLoadingPlayers, isLoadingBootstrap, isLoadingFixtures, isLoadingTopTeam]);

  const { startingXI, substitutes } = useMemo(() => {
    if (!players || !topManagersTeam?.picks) {
      return { startingXI: [], substitutes: [] };
    }

    const mapPicks = (picks: Pick[]) => 
      picks.map(pick => {
        const player = players.find(p => p.id === pick.element);
        if (!player) return null;
        return {
          ...player,
          position: pick.position,
          eliteOwnership: pick.eliteOwnership || 0,
          captaincyCount: pick.captaincyCount || 0,
          viceCaptaincyCount: pick.viceCaptaincyCount || 0,
          is_captain: pick.is_captain,
          is_vice_captain: pick.is_vice_captain,
        };
      })
      .filter((player): player is (Player & { 
        position: number; 
        eliteOwnership: number;
        captaincyCount: number;
        viceCaptaincyCount: number;
        is_captain: boolean;
        is_vice_captain: boolean;
      }) => player !== null);

    return {
      startingXI: mapPicks(topManagersTeam.picks.filter(pick => pick.position <= 11)),
      substitutes: mapPicks(topManagersTeam.picks.filter(pick => pick.position > 11))
    };
  }, [players, topManagersTeam]);

  const allPlayers = useMemo(() => [...startingXI, ...substitutes], [startingXI, substitutes]);

  const teamStats = useMemo(() => {
    if (!allPlayers || !bootstrapData?.teams) return [];

    const statsMap = new Map<number, TeamStats>();

    allPlayers.forEach(player => {
      const team = bootstrapData.teams.find(t => t.id === player.team);
      if (!team) return;

      const existing = statsMap.get(team.id) || {
        teamId: team.id,
        teamName: team.name,
        playerCount: 0,
        averagePrice: 0,
        totalSelectionPercentage: 0,
      };

      existing.playerCount++;
      existing.averagePrice += player.now_cost / 10;
      existing.totalSelectionPercentage += player.eliteOwnership;

      statsMap.set(team.id, existing);
    });

    return Array.from(statsMap.values())
      .map(stat => ({
        ...stat,
        averagePrice: stat.averagePrice / stat.playerCount,
      }))
      .sort((a, b) => b.playerCount - a.playerCount);
  }, [allPlayers, bootstrapData?.teams]);



  if (isLoading) {
    return (
      <div className="p-6">
        <div className="space-y-8">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => window.history.back()}
              className="mr-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-500 via-primary to-blue-500 bg-clip-text text-transparent">
              Most Selected Players in FPL
            </h1>
          </div>
          <div className="space-y-4">
            <Progress value={loadingProgress} className="w-full" />
            <p className="text-sm text-muted-foreground">Loading data...</p>
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

  if (!players || !bootstrapData || !fixtures || !topManagersTeam || !topManagersTeam.picks) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load top managers' team data. Please try again later.
            {topTeamError && ` Error: ${topTeamError}`}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (startingXI.length === 0 || substitutes.length === 0) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No team data available. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="space-y-8">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => window.history.back()}
                className="mr-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-500 via-primary to-blue-500 bg-clip-text text-transparent">
                Elite Managers' Team
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon">
                    <SlidersHorizontal className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Team Analytics</SheetTitle>
                    <SheetDescription>
                      View detailed team statistics
                    </SheetDescription>
                  </SheetHeader>
                  <ScrollArea className="h-[calc(100vh-200px)] pr-4">
                    <div className="space-y-6 py-4">
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium">Team Statistics</h3>
                        <div className="grid grid-cols-1 gap-4">
                          {teamStats.map(stat => (
                            <TeamStatsCard key={stat.teamId} stats={stat} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </ScrollArea>
                </SheetContent>
              </Sheet>
            </div>
          </div>
          <p className="text-lg text-muted-foreground">
            The most selected players by the top 1,000 FPL managers worldwide
          </p>
        </div>

        <div className="grid gap-6">
          <TopManagersPitch 
            players={startingXI}
            substitutes={substitutes}
            fixtures={fixtures}
            teams={bootstrapData?.teams}
          />
        </div>
      </div>
    </div>
  );
}
