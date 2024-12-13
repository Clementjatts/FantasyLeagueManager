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
import { fetchPlayers } from "../lib/api";
import { Player } from "../types/fpl";
import { Shield, Crosshair, Star } from "lucide-react";

interface PositionStat {
  label: string;
  value: string | number;
  icon?: typeof Shield;
}

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

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-card rounded-lg p-4 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
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
  const { data: players, isLoading } = useQuery({
    queryKey: ["/api/fpl/players"],
    queryFn: fetchPlayers,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-48" />
        <div className="grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-[200px]" />
          ))}
        </div>
      </div>
    );
  }

  if (!players?.length) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <CardTitle className="mb-2">No Data Available</CardTitle>
          <CardDescription>
            Unable to load player statistics. Please try again later.
          </CardDescription>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Statistics & Analysis</h1>
        <Badge variant="outline" className="text-lg">
          Position Analysis
        </Badge>
      </div>

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
          const positionPlayers = players.filter(p => p.element_type === config.id)
            .sort((a, b) => (b.total_points || 0) - (a.total_points || 0));

          const topScorer = positionPlayers[0];
          const avgPoints = Math.round(
            positionPlayers.reduce((acc, p) => acc + (p.total_points || 0), 0) / 
            positionPlayers.length
          );

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
                    />
                    <StatCard 
                      label="Top Performer" 
                      value={`${topScorer?.web_name || 'N/A'} (${topScorer?.total_points || 0}pts)`} 
                    />
                    <StatCard 
                      label="Players" 
                      value={positionPlayers.length} 
                    />
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
  );
}
