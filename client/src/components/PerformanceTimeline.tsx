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

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
      {sortedData.map((gw) => (
        <div 
          key={gw.gameweek} 
          className={cn(
            "flex items-center justify-between px-3 py-2 rounded-md",
            "bg-gradient-to-br from-background/80 to-muted/30",
            "border border-border/50",
            "transition-all duration-200",
            "hover:shadow-sm hover:border-primary/30",
          )}
        >
          <span className="text-sm font-medium text-muted-foreground">GW{gw.gameweek}</span>
          <span className="text-base font-semibold tabular-nums">{gw.points}</span>
        </div>
      ))}
    </div>
  );
}
