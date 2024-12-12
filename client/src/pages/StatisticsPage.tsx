import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchPlayers } from "../lib/api";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

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

  // Calculate top performers by points
  const topPerformers = players
    ?.sort((a, b) => b.total_points - a.total_points)
    .slice(0, 10)
    .map(player => ({
      name: player.web_name,
      points: player.total_points,
      form: parseFloat(player.form),
      price: player.now_cost / 10,
    }));

  // Calculate ownership statistics
  const ownershipData = players
    ?.sort((a, b) => parseFloat(b.selected_by_percent) - parseFloat(a.selected_by_percent))
    .slice(0, 10)
    .map(player => ({
      name: player.web_name,
      ownership: parseFloat(player.selected_by_percent),
    }));

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Statistics & Analysis</h1>

      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="ownership">Ownership</TabsTrigger>
          <TabsTrigger value="value">Value</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Performers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topPerformers}>
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <CartesianGrid strokeDasharray="3 3" />
                    <Bar dataKey="points" fill="hsl(var(--primary))" name="Total Points" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            {topPerformers?.map(player => (
              <Card key={player.name}>
                <CardHeader>
                  <CardTitle>{player.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-2 gap-4">
                    <div>
                      <dt className="text-sm text-muted-foreground">Points</dt>
                      <dd className="text-2xl font-bold">{player.points}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">Form</dt>
                      <dd className="text-2xl font-bold">{player.form}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">Price</dt>
                      <dd className="text-2xl font-bold">£{player.price}m</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="ownership" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Most Selected Players</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ownershipData}>
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <CartesianGrid strokeDasharray="3 3" />
                    <Bar dataKey="ownership" fill="hsl(var(--primary))" name="Ownership %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="value" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Points per Million</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={topPerformers?.map(p => ({
                      name: p.name,
                      ppm: (p.points / p.price).toFixed(1)
                    }))}
                  >
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <CartesianGrid strokeDasharray="3 3" />
                    <Bar dataKey="ppm" fill="hsl(var(--primary))" name="Points per Million" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
