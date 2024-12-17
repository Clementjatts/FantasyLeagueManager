import { cn } from "@/lib/utils";

interface GameweekData {
  gameweek: number;
  points: number;
}

interface PerformanceTimelineProps {
  data: GameweekData[];
}

export function PerformanceTimeline({ data }: PerformanceTimelineProps) {
  const maxPoints = Math.max(...data.map(gw => gw.points), 1);
  
  return (
    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-1">
      {data.map((gw) => {
        const heightPercentage = (gw.points / maxPoints) * 100;
        
        return (
          <div 
            key={gw.gameweek} 
            className="group relative flex flex-col items-center gap-1"
          >
            <div 
              className={cn(
                "w-full h-20 rounded-md relative overflow-hidden",
                "bg-primary/5 border border-border/50",
                "transition-all duration-200",
                "hover:border-primary/30 hover:shadow-md",
                "group-hover:scale-105"
              )}
            >
              <div 
                className="absolute bottom-0 w-full bg-primary/20 transition-all duration-300"
                style={{ height: `${heightPercentage}%` }}
              />
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-medium text-muted-foreground group-hover:text-primary transition-colors">
                GW{gw.gameweek}
              </span>
              <span className="text-sm font-bold tabular-nums text-foreground">
                {gw.points}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
