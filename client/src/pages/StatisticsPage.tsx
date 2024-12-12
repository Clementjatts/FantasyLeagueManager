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
    mainStats: ["Clean Sheets", "Saves", "Bonus Points"],
    detailedStats: ["Clean Sheets", "Saves", "Penalties Saved", "Bonus Points", "Minutes Played"],
    description: "Shot-stopping specialists and last line of defense"
  },
  {
    id: 2,
    name: "Defenders",
    icon: Shield,
    mainStats: ["Clean Sheets", "Goals", "Bonus Points"],
    detailedStats: ["Clean Sheets", "Goals", "Assists", "Bonus Points", "Expected Goals"],
    description: "Defensive wall and occasional attacking threats"
  },
  {
    id: 3,
    name: "Midfielders",
    icon: Crosshair,
    mainStats: ["Goals", "Assists", "Bonus Points"],
    detailedStats: ["Goals", "Assists", "Bonus Points", "Minutes Played", "Points Per Game"],
    description: "Engine room of the team, contributing in attack and defense"
  },
  {
    id: 4,
    name: "Forwards",
    icon: Star,
    mainStats: ["Goals", "Assists", "Expected Goals"],
    detailedStats: ["Goals", "Assists", "Bonus Points", "Expected Goals", "Points Per Game"],
    description: "Primary goal scorers and attacking focal points"
  }
];

function getStatValue(player: Player, stat: string): string {
  // Default stats that exist in the API
  if (stat === "Points Per Game") return player.points_per_game || "0.0";
  if (stat === "Total Points") return player.total_points?.toString() || "0";
  
  // Position-specific mock stats (in a real app, these would come from the API)
  const mockStats = {
    1: { // GK
      "Clean Sheets": "6",
      "Saves": "42",
      "Penalties Saved": "1",
      "Bonus Points": "8",
      "Minutes Played": "900"
    },
    2: { // DEF
      "Clean Sheets": "5",
      "Goals": "2",
      "Assists": "3",
      "Bonus Points": "10",
      "Expected Goals": "1.2"
    },
    3: { // MID
      "Goals": "6",
      "Assists": "8",
      "Bonus Points": "15",
      "Minutes Played": "850",
      "Expected Goals": "4.5"
    },
    4: { // FWD
      "Goals": "10",
      "Assists": "4",
      "Bonus Points": "12",
      "Expected Goals": "8.2"
    }
  };

  return mockStats[player.element_type]?.[stat] || "0";
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
  
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between">
          <CardTitle>{player.web_name}</CardTitle>
          <Badge variant="outline">
            £{((player.now_cost || 0) / 10).toFixed(1)}m
          </Badge>
        </div>
        <CardDescription className="flex items-center gap-2">
          Form: <span className={formColor}>{player.form || "0.0"}</span>
        </CardDescription>
        <Progress value={formValue * 10} className="h-1" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-muted/50 p-2 rounded">
            <p className="text-sm text-muted-foreground">Points</p>
            <p className="text-xl font-semibold">{player.total_points || 0}</p>
          </div>
          <div className="bg-muted/50 p-2 rounded">
            <p className="text-sm text-muted-foreground">Selected</p>
            <p className="text-xl font-semibold">{player.selected_by_percent || 0}%</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          {positionConfigs.find(p => p.id === player.element_type)?.mainStats.map(stat => (
            <div key={stat}>
              <p className="text-sm text-muted-foreground">{stat}</p>
              <p className="font-semibold">{getStatValue(player, stat)}</p>
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
