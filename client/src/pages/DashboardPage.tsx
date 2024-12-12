import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PointsChart } from "../components/PointsChart";
import { fetchMyTeam } from "../lib/api";

export default function DashboardPage() {
  const { data: team } = useQuery({
    queryKey: ["/api/fpl/my-team/1"],
  });

  const mockPointsData = [
    { gameweek: 1, points: 75, average: 65 },
    { gameweek: 2, points: 55, average: 50 },
    { gameweek: 3, points: 82, average: 60 },
    // Add more gameweeks...
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Overall Points</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{team?.totalPoints || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Team Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              £{((team?.transfers?.value || 0) / 10).toFixed(1)}m
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Transfers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {team?.transfers?.limit || 0} Free
            </div>
          </CardContent>
        </Card>
      </div>

      <PointsChart data={mockPointsData} />
    </div>
  );
}
