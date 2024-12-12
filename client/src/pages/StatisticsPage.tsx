import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { fetchPlayers } from "../lib/api";
import { TrendingUp, TrendingDown, Minus, Crown, Star, Trophy } from "lucide-react";

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
    switch (type) {
      case 1: return "Goalkeeper";
      case 2: return "Defender";
      case 3: return "Midfielder";
      case 4: return "Forward";
      default: return "Unknown";
    }
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

  const topPerformers = players
    .sort((a, b) => b.total_points - a.total_points)
    .slice(0, 15);

  const bestValue = players
    .sort((a, b) => (b.total_points / b.now_cost) - (a.total_points / a.now_cost))
    .slice(0, 15);

  const hotForm = players
    .sort((a, b) => parseFloat(b.form) - parseFloat(a.form))
    .slice(0, 15);

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

      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="performance">Season Performance</TabsTrigger>
          <TabsTrigger value="form">Current Form</TabsTrigger>
          <TabsTrigger value="value">Value Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {topPerformers.map(player => (
              <Card key={player.id} className="overflow-hidden">
                <CardHeader className="space-y-1">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">{player.web_name}</CardTitle>
                    <Badge variant="secondary">
                      {getPositionName(player.element_type)}
                    </Badge>
                  </div>
                  <CardDescription>
                    Total Points: {player.total_points}
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
                    <div className="grid grid-cols-2 gap-4 pt-4">
                      <div>
                        <span className="text-sm text-muted-foreground">Selected by</span>
                        <p className="text-lg font-semibold">{player.selected_by_percent}%</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Price</span>
                        <p className="text-lg font-semibold">£{(player.now_cost / 10).toFixed(1)}m</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="form" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {hotForm.map(player => (
              <Card key={player.id} className="relative overflow-hidden">
                <div className="absolute top-2 right-2">
                  {getTrendIcon(parseFloat(player.form))}
                </div>
                <CardHeader>
                  <CardTitle>{player.web_name}</CardTitle>
                  <CardDescription>Form: {player.form}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Points Trend</span>
                        <span className="text-sm font-medium">{player.points_per_game}</span>
                      </div>
                      <Progress value={parseFloat(player.points_per_game) * 10} />
                    </div>
                    <div className="pt-4">
                      <Badge variant="outline" className="bg-primary/10">
                        Last 5 Games: {parseFloat(player.form) * 5} pts
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="value" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {bestValue.map(player => {
              const value = getValueRating(player.total_points, player.now_cost / 10);
              return (
                <Card key={player.id} className="relative overflow-hidden">
                  <div className="absolute top-2 right-2">
                    {value.icon}
                  </div>
                  <CardHeader>
                    <CardTitle>{player.web_name}</CardTitle>
                    <CardDescription>{value.text}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm text-muted-foreground">Points</span>
                          <p className="text-lg font-semibold">{player.total_points}</p>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Price</span>
                          <p className="text-lg font-semibold">£{(player.now_cost / 10).toFixed(1)}m</p>
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Points per Million</span>
                        <p className="text-lg font-semibold">
                          {(player.total_points / (player.now_cost / 10)).toFixed(1)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
