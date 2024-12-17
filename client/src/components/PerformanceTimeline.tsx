
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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
  const maxPoints = Math.max(...data.map(d => d.points));
  const latestGameweek = sortedData[sortedData.length - 1];

  return (
    <div className="space-y-4">
      {sortedData.map((gw, index) => {
        const performance = (gw.points / maxPoints) * 100;
        const isLatest = gw.gameweek === latestGameweek.gameweek;
        
        return (
          <div key={gw.gameweek} className="group flex items-center gap-3">
            <div className={cn(
              "flex-shrink-0 w-12 h-12 rounded-full",
              "bg-gradient-to-br from-primary/80 to-primary",
              "flex items-center justify-center",
              "transition-all duration-300 group-hover:scale-110",
              "shadow-[0_0_15px_rgba(var(--primary),0.3)]",
              isLatest && "ring-2 ring-primary"
            )}>
              <span className="text-lg font-bold text-primary-foreground">
                {gw.gameweek}
              </span>
            </div>

            <Card className={cn(
              "flex-grow transition-all duration-300",
              "hover:shadow-lg group-hover:translate-x-1",
              isLatest && "ring-1 ring-primary"
            )}>
              <CardContent className="py-3 px-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-2xl font-bold tracking-tight">
                      {gw.points}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      points
                    </p>
                  </div>
                  <div className="text-right">
                    <Progress 
                      value={performance}
                      className={cn(
                        "h-2 w-24",
                        "bg-primary/20",
                        performance >= 80 ? "bg-green-500" : 
                        performance >= 50 ? "bg-primary" : 
                        "bg-red-500"
                      )}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {Math.round(performance)}% of best
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
}
