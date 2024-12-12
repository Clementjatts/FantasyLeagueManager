import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { fetchPlayers } from "../lib/api";
import { TrendingUp, TrendingDown, Minus, Crown, Star, Trophy, Shield, Crosshair, BarChart2 } from "lucide-react";

type PositionStats = {
  position: number;
  name: string;
  icon: typeof Shield;
  stats: string[];
};

const positionConfigs: PositionStats[] = [
  {
    position: 1,
    name: "Goalkeeper",
    icon: Shield,
    stats: ["Clean Sheets", "Saves", "Penalties Saved"]
  },
  {
    position: 2,
    name: "Defender",
    icon: Shield,
    stats: ["Clean Sheets", "Goals", "Assists", "Bonus"]
  },
  {
    position: 3,
    name: "Midfielder",
    icon: Crosshair,
    stats: ["Goals", "Assists", "Key Passes", "Bonus"]
  },
  {
    position: 4,
    name: "Forward",
    icon: BarChart2,
    stats: ["Goals", "Expected Goals", "Shots on Target", "Bonus"]
  }
];

export default function StatisticsPage() {
  const { data: players, isLoading } = useQuery({
    queryKey: ["/api/fpl/players"],
    queryFn: fetchPlayers,
  });

  if (isLoading) {
    return <Skeleton className="h-[600px] w-full" />;
  }

  if (!players) {
    return <div>Failed to load player statistics</div>;
  }

  const getPositionName = (type: number) => {
    const position = positionConfigs.find(p => p.position === type);
    return position?.name || "Unknown";
  };

  const getTrendIcon = (form: number) => {
    if (form >= 6) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (form <= 4) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-yellow-500" />;
  };

  const getValueRating = (points: number, price: number) => {
    const ppm = points / price;
    if (ppm >= 20) return { icon: <Trophy className="w-4 h-4" />, text: "Excellent Value" };
    if (ppm >= 15) return { icon: <Star className="w-4 h-4" />, text: "Good Value" };
    return { icon: <Crown className="w-4 h-4" />, text: "Premium Asset" };
  };

  // Enhanced statistics by position
  const playersByPosition = positionConfigs.map(config => {
    const positionPlayers = players.filter(p => p.element_type === config.position);
    const Icon = config.icon;
    
    return {
      ...config,
      Icon,
      players: positionPlayers.sort((a, b) => b.total_points - a.total_points),
      averagePoints: Math.round(positionPlayers.reduce((acc, p) => acc + p.total_points, 0) / positionPlayers.length),
      topScorer: positionPlayers.reduce((max, p) => p.total_points > max.total_points ? p : max, positionPlayers[0]),
      mostSelected: positionPlayers.reduce((max, p) => 
        parseFloat(p.selected_by_percent) > parseFloat(max.selected_by_percent) ? p : max, 
        positionPlayers[0]
      ),
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Statistics & Analysis</h1>
        <div className="flex gap-2">
          <Badge variant="outline" className="text-sm">
            Gameweek 17
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="positions" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          {positionConfigs.map((config) => (
            <TabsTrigger key={config.position} value={`position-${config.position}`}>
              {config.name}s
            </TabsTrigger>
          ))}
        </TabsList>

        {playersByPosition.map((posData) => (
          <TabsContent key={posData.position} value={`position-${posData.position}`} className="space-y-6">
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {/* Position Overview Card */}
              <Card className="col-span-full bg-primary/5">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <posData.Icon className="w-6 h-6" />
                    <CardTitle>{posData.name} Overview</CardTitle>
                  </div>
                  <CardDescription>Overall performance metrics for {posData.name}s</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <span className="text-sm text-muted-foreground">Average Points</span>
                      <p className="text-2xl font-bold">{posData.averagePoints}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Top Scorer</span>
                      <p className="text-lg font-semibold">{posData.topScorer.web_name}</p>
                      <p className="text-sm text-muted-foreground">{posData.topScorer.total_points} pts</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Most Selected</span>
                      <p className="text-lg font-semibold">{posData.mostSelected.web_name}</p>
                      <p className="text-sm text-muted-foreground">{posData.mostSelected.selected_by_percent}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Top Performers */}
              {posData.players.slice(0, 6).map(player => (
                <Card key={player.id} className="overflow-hidden">
                  <CardHeader className="space-y-1">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl">{player.web_name}</CardTitle>
                      <div className="flex items-center gap-2">
                        {getTrendIcon(parseFloat(player.form))}
                        <Badge variant="secondary">
                          £{(player.now_cost / 10).toFixed(1)}m
                        </Badge>
                      </div>
                    </div>
                    <CardDescription>
                      {getValueRating(player.total_points, player.now_cost / 10).text}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">Form</span>
                          <span className="text-sm font-medium">{player.form}</span>
                        </div>
                        <Progress value={parseFloat(player.form) * 10} />
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-2">
                        {posData.stats.map((stat, index) => (
                          <div key={index}>
                            <span className="text-sm text-muted-foreground">{stat}</span>
                            <p className="text-lg font-semibold">
                              {index === 0 ? player.total_points : 
                               index === 1 ? player.points_per_game :
                               player.form}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
