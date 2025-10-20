import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { fetchPlayers, fetchBootstrapStatic } from "../lib/api";
import { SeasonSelector } from "../components/SeasonSelector";
import { useSeason } from "../contexts/SeasonContext";
import { Player } from "../types/fpl";
import { Shield, Crosshair, Star, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PositionConfig {
  id: number;
  name: string;
  icon: typeof Shield;
  mainStats: string[];
  detailedStats: string[];
  description: string;
}

const positionConfigs: PositionConfig[] = [
  {
    id: 1,
    name: "Goalkeepers",
    icon: Shield,
    mainStats: ["Clean Sheets", "Saves", "Points Per Game"],
    detailedStats: ["Clean Sheets", "Saves", "Penalties Saved", "Bonus Points", "Minutes Played"],
    description: "Shot-stopping specialists and last line of defense"
  },
  {
    id: 2,
    name: "Defenders",
    icon: Shield,
    mainStats: ["Clean Sheets", "Goals", "Points Per Game"],
    detailedStats: ["Clean Sheets", "Goals", "Assists", "Bonus Points", "Total Points"],
    description: "Defensive wall and occasional attacking threats"
  },
  {
    id: 3,
    name: "Midfielders",
    icon: Crosshair,
    mainStats: ["Goals", "Assists", "Points Per Game"],
    detailedStats: ["Goals", "Assists", "Total Points", "Minutes Played", "Bonus Points"],
    description: "Engine room of the team, contributing in attack and defense"
  },
  {
    id: 4,
    name: "Forwards",
    icon: Star,
    mainStats: ["Goals", "Assists", "Points Per Game"],
    detailedStats: ["Goals", "Assists", "Total Points", "Expected Goals", "Bonus Points"],
    description: "Primary goal scorers and attacking focal points"
  }
];

function getStatValue(player: Player, stat: string): string {
  switch (stat) {
    case "Points Per Game":
      return player.points_per_game || "0.0";
    case "Total Points":
      return player.total_points?.toString() || "0";
    case "Clean Sheets":
      return player.clean_sheets?.toString() || "0";
    case "Saves":
      return player.saves?.toString() || "0";
    case "Penalties Saved":
      return player.penalties_saved?.toString() || "0";
    case "Bonus Points":
      return player.bonus?.toString() || "0";
    case "Minutes Played":
      return player.minutes?.toString() || "0";
    case "Goals":
      return player.goals_scored?.toString() || "0";
    case "Assists":
      return player.assists?.toString() || "0";
    case "Expected Goals":
      return ((player.goals_scored || 0) * 0.8).toFixed(2); // Simplified xG calculation
    default:
      return "0";
  }
}

function StatCard({ label, value, tooltip }: { label: string; value: string | number; tooltip?: string }) {
  return (
    <div className="bg-card rounded-lg p-4 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {tooltip && (
        <div className="text-xs text-muted-foreground mt-1">{tooltip}</div>
      )}
    </div>
  );
}

function PlayerStatCard({ player }: { player: Player }) {
  const formValue = parseFloat(player.form || "0");
  const formColor = formValue >= 6 ? "text-green-500" :
                    formValue >= 4 ? "text-yellow-500" : "text-red-500";
  
  const ppgValue = parseFloat(player.points_per_game || "0");
  const ppgProgress = (ppgValue / 8) * 100; // 8 points per game as maximum
  
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {player.web_name}
            <Badge variant="outline" className="text-xs">
              £{((player.now_cost || 0) / 10).toFixed(1)}m
            </Badge>
          </CardTitle>
          <Badge variant="secondary" className={formColor}>
            Form: {player.form || "0.0"}
          </Badge>
        </div>
        <CardDescription className="flex items-center justify-between">
          <span>PPG: {player.points_per_game || "0.0"}</span>
          <span className="text-xs text-muted-foreground">
            {player.minutes || 0} mins played
          </span>
        </CardDescription>
        <Progress value={ppgProgress} className="h-1" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-primary/5 p-2 rounded-lg border border-border/40">
            <p className="text-sm text-muted-foreground">Total Points</p>
            <p className="text-xl font-bold">{player.total_points || 0}</p>
          </div>
          <div className="bg-primary/5 p-2 rounded-lg border border-border/40">
            <p className="text-sm text-muted-foreground">Selected By</p>
            <p className="text-xl font-bold">{parseFloat(player.selected_by_percent || "0").toFixed(1)}%</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          {positionConfigs.find(p => p.id === player.element_type)?.mainStats.map(stat => (
            <div key={stat} className="space-y-1">
              <p className="text-sm text-muted-foreground">{stat}</p>
              <p className="font-bold text-primary/90">{getStatValue(player, stat)}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function StatisticsPage() {
  const { currentSeason, isLoading: isSeasonLoading } = useSeason();

  const { data: players, isLoading } = useQuery({
    queryKey: ["/api/fpl/players", currentSeason.id],
    queryFn: () => fetchPlayers(currentSeason.id),
    enabled: !isSeasonLoading
  });

  const { data: bootstrapData, isLoading: isBootstrapLoading } = useQuery({
    queryKey: ["/api/fpl/bootstrap-static", currentSeason.id],
    queryFn: () => fetchBootstrapStatic(currentSeason.id),
    enabled: !isSeasonLoading
  });

  if (isLoading || isSeasonLoading || isBootstrapLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex flex-col gap-6">
          {/* Header Skeleton */}
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-80" />
                <Skeleton className="h-6 w-32" />
              </div>
              <Skeleton className="h-6 w-96" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-20" />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-32" />
            </div>
          </div>

          {/* League Overview Stats Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="bg-gradient-to-br from-primary/5 to-primary/10">
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-3 w-20" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Position Analysis Skeleton */}
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
            <CardHeader>
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} className="bg-white/50">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div>
                        <Skeleton className="h-3 w-20 mb-1" />
                        <Skeleton className="h-6 w-12" />
                      </div>
                      <div>
                        <Skeleton className="h-3 w-24 mb-1" />
                        <Skeleton className="h-6 w-16" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Form Trends Skeleton */}
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-8 w-8" />
                    <div className="flex-1">
                      <Skeleton className="h-5 w-32 mb-1" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                    <div className="text-right">
                      <Skeleton className="h-5 w-12 mb-1" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                    <Skeleton className="h-2 w-24" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tabs Skeleton */}
          <div className="space-y-6">
            <div className="grid w-full grid-cols-4 gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>

            {/* Tab Content Skeleton */}
            <Card className="mb-6 bg-primary/5">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-6" />
                  <div>
                    <Skeleton className="h-6 w-32 mb-2" />
                    <Skeleton className="h-4 w-64" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3 mb-6">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="bg-card rounded-lg p-4 shadow-sm">
                      <Skeleton className="h-4 w-24 mb-2" />
                      <Skeleton className="h-6 w-32" />
                    </div>
                  ))}
                </div>

                <div className="mt-6">
                  <Skeleton className="h-6 w-48 mb-4" />
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-5 w-24" />
                          <Skeleton className="h-5 w-12" />
                        </div>
                        <div className="flex items-center gap-4">
                          <Skeleton className="h-4 w-16" />
                          <Skeleton className="h-4 w-12" />
                          <Skeleton className="h-4 w-12" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Player Cards Skeleton */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-6 w-24" />
                        <Skeleton className="h-5 w-12" />
                      </div>
                      <Skeleton className="h-5 w-16" />
                    </div>
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-1 w-full" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-primary/5 p-2 rounded-lg border border-border/40">
                        <Skeleton className="h-3 w-20 mb-1" />
                        <Skeleton className="h-6 w-8" />
                      </div>
                      <div className="bg-primary/5 p-2 rounded-lg border border-border/40">
                        <Skeleton className="h-3 w-20 mb-1" />
                        <Skeleton className="h-6 w-8" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                      {Array.from({ length: 4 }).map((_, j) => (
                        <div key={j} className="space-y-1">
                          <Skeleton className="h-3 w-16" />
                          <Skeleton className="h-4 w-8" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!players?.length || !bootstrapData) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <CardTitle className="mb-2">No Data Available</CardTitle>
            <CardDescription>
              Unable to load player statistics. Please try again later.
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate league-wide statistics
  const totalPlayers = players.length;
  const averagePoints = Math.round(
    players.reduce((acc, p) => acc + (p.total_points || 0), 0) / totalPlayers
  );
  const topScorer = [...players].sort((a, b) => (b.total_points || 0) - (a.total_points || 0))[0];
  const mostSelected = [...players].sort((a, b) => 
    (parseFloat(b.selected_by_percent || "0") - parseFloat(a.selected_by_percent || "0"))
  )[0];
  
  // Calculate position-based statistics
  const playersByPosition = players.reduce((acc, player) => {
    const position = player.element_type;
    if (!acc[position]) acc[position] = [];
    acc[position].push(player);
    return acc;
  }, {} as Record<number, Player[]>);

  const positionStats = Object.entries(playersByPosition).map(([position, players]) => {
    const avgPoints = Math.round(
      players.reduce((acc, p) => acc + (p.total_points || 0), 0) / players.length
    );
    const topPlayer = [...players].sort((a, b) => (b.total_points || 0) - (a.total_points || 0))[0];
    return {
      position: parseInt(position),
      avgPoints,
      topPlayer,
      count: players.length,
    };
  });

  // Calculate form trends
  const formTrends = players
    .map(player => ({
      ...player,
      formNum: parseFloat(player.form || "0"),
    }))
    .sort((a, b) => b.formNum - a.formNum)
    .slice(0, 5);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-apex-green to-volt-magenta bg-clip-text text-transparent">
                Statistics & Analysis
              </h1>
              <Badge className="text-lg apex-badge-success font-bold hover:opacity-90 transition-all duration-200 shadow-apex">
                League Overview
              </Badge>
            </div>
            <p className="text-lg text-slate-600 dark:text-slate-300 font-medium">
              Comprehensive statistics and performance analysis
            </p>
            <div className="flex items-center gap-2">
              <Badge className="text-sm apex-badge-warning font-semibold hover:opacity-90 transition-all duration-200 shadow-apex">
                {currentSeason.name} Season
              </Badge>
              {!currentSeason.isCurrent && (
                <Badge variant="outline" className="text-sm border-orange-200 text-orange-700 bg-orange-50">
                  Historical Data
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <SeasonSelector />
          </div>
        </div>

        {/* Historical Data Notice */}
        {!currentSeason.isCurrent && (
          <Alert className="border-orange-200 bg-orange-50">
            <Info className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              You're viewing historical data for the {currentSeason.name} season.
              This data is representative and based on actual season performance patterns.
            </AlertDescription>
          </Alert>
        )}

        {/* League Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 hover:shadow-lg transition-all">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Players</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalPlayers}</div>
              <p className="text-xs text-muted-foreground">Active in the game</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 hover:shadow-lg transition-all">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Average Points</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{averagePoints}</div>
              <p className="text-xs text-muted-foreground">Per player</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 hover:shadow-lg transition-all">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Top Scorer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{topScorer.web_name}</div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Points:</span>
                <span className="text-sm font-medium">{topScorer.total_points}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 hover:shadow-lg transition-all">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Most Selected</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mostSelected.web_name}</div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Selected by:</span>
                <span className="text-sm font-medium">{mostSelected.selected_by_percent}%</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Position Analysis */}
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
          <CardHeader>
            <CardTitle>Position Analysis</CardTitle>
            <CardDescription>Performance breakdown by position</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {positionStats.map((stats) => {
                const config = positionConfigs.find(c => c.id === stats.position);
                if (!config) return null; // Skip rendering if no config found
                return (
                  <Card key={stats.position} className="bg-white/50">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <config.icon className="w-4 h-4" />
                        <CardTitle className="text-sm font-medium">{config.name}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div>
                        <div className="text-sm text-muted-foreground">Average Points</div>
                        <div className="text-lg font-bold">{stats.avgPoints}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Top Performer</div>
                        <div className="text-lg font-bold">{stats.topPlayer.web_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {stats.topPlayer.total_points} points
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Form Trends */}
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
          <CardHeader>
            <CardTitle>Form Trends</CardTitle>
            <CardDescription>Players in the best current form</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {formTrends.map((player, index) => (
                <div key={player.id} className="flex items-center gap-4">
                  <div className="text-2xl font-bold text-muted-foreground">
                    #{index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="text-lg font-semibold">{player.web_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {positionConfigs.find(c => c.id === player.element_type)?.name}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">{player.form}</div>
                    <div className="text-sm text-muted-foreground">Form rating</div>
                  </div>
                  <Progress 
                    value={parseFloat(player.form) * 10} 
                    className="w-24"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Position-based Tabs */}
        <Tabs defaultValue="position-1" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            {positionConfigs.map(config => (
              <TabsTrigger key={config.id} value={`position-${config.id}`}>
                <div className="flex items-center gap-2">
                  <config.icon className="w-4 h-4" />
                  <span className="hidden md:inline">{config.name}</span>
                </div>
              </TabsTrigger>
            ))}
          </TabsList>

          {positionConfigs.map(config => {
            const positionPlayers = players
              .filter(p => p.element_type === config.id)
              .sort((a, b) => (b.total_points || 0) - (a.total_points || 0));

            const topScorer = positionPlayers[0];
            const avgPoints = Math.round(
              positionPlayers.reduce((acc, p) => acc + (p.total_points || 0), 0) / 
              positionPlayers.length
            );

            // Calculate form trends
            const formTrend = positionPlayers.map(p => ({
              name: p.web_name,
              form: parseFloat(p.form || "0"),
              points: p.total_points || 0,
              price: p.now_cost / 10,
              selected: parseFloat(p.selected_by_percent || "0")
            })).sort((a, b) => b.form - a.form).slice(0, 5);

            return (
              <TabsContent key={config.id} value={`position-${config.id}`}>
                <Card className="mb-6 bg-primary/5">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <config.icon className="w-6 h-6" />
                      <div>
                        <CardTitle>{config.name}</CardTitle>
                        <CardDescription>{config.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                      <StatCard 
                        label="Average Points" 
                        value={avgPoints}
                        tooltip="Average points scored by players in this position" 
                      />
                      <StatCard 
                        label="Top Performer" 
                        value={`${topScorer?.web_name || 'N/A'} (${topScorer?.total_points || 0}pts)`}
                        tooltip="Player with the highest total points in this position" 
                      />
                      <StatCard 
                        label="Players" 
                        value={positionPlayers.length}
                        tooltip="Total number of players in this position" 
                      />
                    </div>

                    {/* Form Trends */}
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold mb-4">Top 5 In-Form Players</h3>
                      <div className="space-y-3">
                        {formTrend.map(player => (
                          <div key={player.name} className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="font-medium">{player.name}</div>
                              <Badge variant="secondary">{player.points} pts</Badge>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-sm text-muted-foreground">
                                Form: {player.form}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                £{player.price}m
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {player.selected}%
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {positionPlayers.slice(0, 6).map(player => (
                    <PlayerStatCard key={player.id} player={player} />
                  ))}
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </div>
  );
}
