import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface GameweekData {
  gameweek: number;
  points: number;
}

interface PerformanceTimelineProps {
  data: GameweekData[];
}

export function PerformanceTimeline({ data }: PerformanceTimelineProps) {
  const sortedData = [...data].sort((a, b) => a.gameweek - b.gameweek);
  const maxPoints = Math.max(...sortedData.map(d => d.points));
  const minPoints = Math.min(...sortedData.map(d => d.points));
  const latestGameweek = sortedData[sortedData.length - 1];

  // Calculate points trend
  const pointsTrend = sortedData.length > 1 
    ? sortedData[sortedData.length - 1].points - sortedData[sortedData.length - 2].points 
    : 0;

  // Generate SVG path for the sparkline
  const width = 100;
  const height = 40;
  const points = sortedData.map((d, i) => {
    const x = (i / (sortedData.length - 1)) * width;
    const y = height - ((d.points - minPoints) / (maxPoints - minPoints)) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="flex flex-col space-y-4">
      {/* Latest points card with trend */}
      <div className="flex items-center justify-between p-3 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg">
        <div>
          <div className="text-sm font-medium text-muted-foreground">Latest (GW {latestGameweek.gameweek})</div>
          <div className="text-2xl font-bold">{latestGameweek.points}</div>
        </div>
        <div className={cn(
          "px-2 py-1 rounded-full text-sm font-medium",
          pointsTrend > 0 ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
        )}>
          {pointsTrend > 0 ? "+" : ""}{pointsTrend}
        </div>
      </div>

      {/* Sparkline visualization */}
      <div className="relative h-[60px] w-full bg-background/50 rounded-lg overflow-hidden">
        <svg width="100%" height="100%" preserveAspectRatio="none" viewBox={`0 0 ${width} ${height}`}>
          {/* Gradient definition */}
          <defs>
            <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
            </linearGradient>
          </defs>
          
          {/* Area fill */}
          <path
            d={`M0,${height} ${points} ${width},${height}`}
            fill="url(#gradient)"
          />
          
          {/* Line */}
          <polyline
            points={points}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Latest point highlight */}
          <circle
            cx={width}
            cy={height - ((latestGameweek.points - minPoints) / (maxPoints - minPoints)) * height}
            r="3"
            fill="hsl(var(--primary))"
          />
        </svg>
        
        {/* Point markers */}
        <div className="absolute inset-0 flex justify-between px-2">
          {sortedData.map((gw, i) => (
            <div
              key={gw.gameweek}
              className="group relative flex items-center justify-center"
              style={{ height: '100%' }}
            >
              <div className="absolute bottom-0 transform -translate-y-6 opacity-0 group-hover:opacity-100 transition-opacity bg-background border rounded px-2 py-1 text-xs">
                GW{gw.gameweek}: {gw.points}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-3 gap-2 text-sm">
        <div className="p-2 rounded-lg bg-primary/5">
          <div className="text-muted-foreground">Highest</div>
          <div className="font-bold">{maxPoints}</div>
        </div>
        <div className="p-2 rounded-lg bg-primary/5">
          <div className="text-muted-foreground">Average</div>
          <div className="font-bold">
            {Math.round(sortedData.reduce((acc, curr) => acc + curr.points, 0) / sortedData.length)}
          </div>
        </div>
        <div className="p-2 rounded-lg bg-primary/5">
          <div className="text-muted-foreground">Lowest</div>
          <div className="font-bold">{minPoints}</div>
        </div>
      </div>
    </div>
  );
}
