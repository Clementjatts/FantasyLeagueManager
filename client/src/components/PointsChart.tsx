import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PointsData {
  gameweek: number;
  points: number;
  average: number;
}

interface PointsChartProps {
  data: PointsData[];
}

export function PointsChart({ data }: PointsChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Points History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <XAxis dataKey="gameweek" />
              <YAxis />
              <Tooltip />
              <CartesianGrid strokeDasharray="3 3" />
              <Line 
                type="monotone" 
                dataKey="points" 
                stroke="hsl(var(--primary))" 
                name="Your Points"
              />
              <Line 
                type="monotone" 
                dataKey="average" 
                stroke="hsl(var(--muted-foreground))" 
                strokeDasharray="5 5" 
                name="Average"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
