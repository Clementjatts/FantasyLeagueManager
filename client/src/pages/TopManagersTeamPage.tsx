import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { fetchPlayers, fetchBootstrapStatic, fetchFixtures, fetchTopManagersTeam } from "../lib/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { TopManagersPitch } from "../components/pitch/TopManagersPitch";
import { AlertCircle, ArrowLeft, RefreshCcw, SlidersHorizontal } from "lucide-react";
import { type Player, type Pick } from "../types/fpl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { Badge } from "@/components/ui/badge";

interface PlayerCardProps {
  player: Player & { position: number; selection_percentage: number };
  team: { short_name: string; name: string };
}

interface TeamStats {
  teamId: number;
  teamName: string;
  playerCount: number;
  averagePrice: number;
  totalSelectionPercentage: number;
}

const PlayerCard = ({ player, team }: PlayerCardProps) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <li className="flex justify-between items-center text-sm p-2 rounded-lg bg-gradient-to-r from-background to-muted hover:from-muted/50 hover:to-muted transition-colors duration-200">
          <span className="flex items-center gap-3">
            <span className="w-8 h-8 flex items-center justify-center text-xs font-semibold bg-primary/10 text-primary rounded-md">
              {team?.short_name}
            </span>
            <span className="font-medium">{player.web_name}</span>
            <span className="text-xs px-2 py-1 bg-muted rounded-full text-muted-foreground">
              {player.selection_percentage?.toFixed(1)}%
            </span>
          </span>
          <span className="font-medium text-primary">
            £{(player.now_cost / 10).toFixed(1)}m
          </span>
        </li>
      </TooltipTrigger>
      <TooltipContent>
        <div className="space-y-1">
          <p className="font-medium">{player.web_name}</p>
          <p className="text-sm text-muted-foreground">Form: {player.form}</p>
          <p className="text-sm text-muted-foreground">Points: {player.total_points}</p>
          <p className="text-sm text-muted-foreground">Team: {team.name}</p>
          <div className="flex gap-2 mt-1">
            <Badge variant="outline">ICT: {player.ict_index}</Badge>
            <Badge variant="outline">PPG: {player.points_per_game}</Badge>
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

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
          <span className="text-muted-foreground">Avg. Selection:</span>
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
          selection_percentage: pick.selection_percentage,
        };
      })
      .filter((player): player is (Player & { position: number; selection_percentage: number }) => player !== null);

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
      existing.totalSelectionPercentage += player.selection_percentage;

      statsMap.set(team.id, existing);
    });

    return Array.from(statsMap.values())
      .map(stat => ({
        ...stat,
        averagePrice: stat.averagePrice / stat.playerCount,
      }))
      .sort((a, b) => b.playerCount - a.playerCount);
  }, [allPlayers, bootstrapData?.teams]);

  const playersByPosition = useMemo(() => ({
    Goalkeepers: allPlayers.filter(p => p.element_type === 1),
    Defenders: allPlayers.filter(p => p.element_type === 2),
    Midfielders: allPlayers.filter(p => p.element_type === 3),
    Forwards: allPlayers.filter(p => p.element_type === 4)
  }), [allPlayers]);

  const handleRefresh = () => {
    refetchPlayers();
    refetchBootstrap();
    refetchFixtures();
    refetchTopTeam();
  };

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
                Most Selected Players in FPL
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
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                className="ml-2"
              >
                <RefreshCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <p className="text-lg text-muted-foreground">
            Most selected players by all FPL managers
          </p>
        </div>

        <div className="grid gap-6">
          <TopManagersPitch 
            players={startingXI}
            substitutes={substitutes}
            fixtures={fixtures}
            teams={bootstrapData?.teams}
          />

          <div className="mt-6">
            <h2 className="text-2xl font-semibold mb-4">Selection Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(playersByPosition).map(([position, positionPlayers]) => (
                <Card key={position}>
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">{position}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[300px] pr-4">
                      <ul className="space-y-3">
                        {positionPlayers
                          .sort((a, b) => b.selection_percentage - a.selection_percentage)
                          .map(player => (
                            <PlayerCard
                              key={player.id}
                              player={player}
                              team={bootstrapData.teams.find(t => t.id === player.team)!}
                            />
                          ))}
                      </ul>
                    </ScrollArea>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
