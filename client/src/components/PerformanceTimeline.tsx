import { cn } from "@/lib/utils";

interface GameweekData {
  gameweek: number;
  points: number;
}

interface PerformanceTimelineProps {
  data: GameweekData[];
}

export function PerformanceTimeline({ data }: PerformanceTimelineProps) {
  console.log('PerformanceTimeline received data:', data);
  
  if (!data?.length) {
    console.log('No performance data available');
    return null;
  }
  
  const maxPoints = Math.max(...data.map(gw => gw.points), 1);
  
  return (
    <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-1.5">
      {data.map((gw) => {
        const heightPercentage = (gw.points / maxPoints) * 100;
        
        return (
          <div 
            key={gw.gameweek} 
            className="group relative flex flex-col items-center"
          >
            <div className="relative w-full aspect-[1/4]">
              <div 
                className={cn(
                  "absolute inset-x-0 bottom-0 rounded-sm",
                  "bg-gradient-to-t from-primary/5 to-primary/10",
                  "group-hover:from-primary/10 group-hover:to-primary/20",
                  "transition-colors duration-200"
                )}
                style={{ height: "100%" }}
              >
                <div 
                  className={cn(
                    "absolute bottom-0 w-full",
                    "bg-primary/20",
                    "transition-all duration-300 ease-out",
                    "group-hover:bg-primary/30"
                  )}
                  style={{ height: `${heightPercentage}%` }}
                />
              </div>
            </div>
            <div className="mt-1 text-center opacity-60 group-hover:opacity-100 transition-opacity">
              <div className="text-xs text-muted-foreground">
                {gw.gameweek}
              </div>
              <div className="text-sm font-semibold tabular-nums">
                {gw.points}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
