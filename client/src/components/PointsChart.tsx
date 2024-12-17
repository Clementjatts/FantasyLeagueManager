import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PointsData {
  gameweek: number;
  points: number;
}

interface PointsChartProps {
  data: PointsData[];
}

export function PointsChart({ data }: PointsChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <XAxis 
                dataKey="gameweek" 
                tickFormatter={(value) => `GW${value}`}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(value) => `Gameweek ${value}`}
                formatter={(value: number) => [`${value} points`, 'Score']}
              />
              <CartesianGrid strokeDasharray="3 3" />
              <Line 
                type="monotone" 
                dataKey="points" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                name="Score"
                dot={{
                  stroke: 'hsl(var(--primary))',
                  strokeWidth: 2,
                  r: 4,
                  fill: 'white'
                }}
                activeDot={{
                  stroke: 'hsl(var(--primary))',
                  strokeWidth: 2,
                  r: 6,
                  fill: 'hsl(var(--primary))'
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
