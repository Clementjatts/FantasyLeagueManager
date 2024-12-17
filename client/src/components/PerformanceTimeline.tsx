import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface GameweekData {
  gameweek: number;
  points: number;
  average: number;
}

interface PerformanceTimelineProps {
  data: GameweekData[];
}

export function PerformanceTimeline({ data }: PerformanceTimelineProps) {
  // Sort data by gameweek in ascending order
  const sortedData = [...data].sort((a, b) => a.gameweek - b.gameweek);
  const maxPoints = Math.max(...data.map(d => d.points));

  return (
    <div className="space-y-4">
      {sortedData.map((gw, index) => {
        const pointsDiff = gw.points - gw.average;
        const isPositive = pointsDiff >= 0;
        const performance = (gw.points / maxPoints) * 100;
        
        return (
          <div key={gw.gameweek} className="group flex items-center gap-3 transition-all duration-300">
            {/* Gameweek Circle - More compact */}
            <div className={cn(
              "flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br",
              "from-purple-500 via-primary to-blue-500",
              "flex items-center justify-center shadow-md",
              "transition-all duration-300 group-hover:scale-110",
              "ring-2 ring-background"
            )}>
              <span className="text-lg font-bold text-white">{gw.gameweek}</span>
            </div>

            {/* Performance Card - Modernized */}
            <Card className={cn(
              "flex-grow transition-all duration-300",
              "hover:shadow-lg hover:bg-accent/5",
              "group-hover:translate-x-1",
              index === sortedData.length - 1 && "ring-1 ring-primary"
            )}>
              <CardContent className="py-3 px-4">
                <div className="grid grid-cols-3 gap-6">
                  {/* Points with Animation */}
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Points</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-xl font-bold tracking-tight">{gw.points}</p>
                      {pointsDiff !== 0 && (
                        <div className={cn(
                          "flex items-center gap-1 text-xs font-medium",
                          isPositive ? "text-green-500" : "text-red-500"
                        )}>
                          {isPositive ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
                          )}
                          {Math.abs(pointsDiff)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Performance Indicator with Gradient */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-muted-foreground">Performance</p>
                      <p className="text-xs font-medium">{Math.round(performance)}%</p>
                    </div>
                    <div className="space-y-2">
                      <Progress 
                        value={performance}
                        className={cn(
                          "h-1.5 transition-all duration-300",
                          performance >= 80 ? "bg-green-500" : 
                          performance >= 50 ? "bg-blue-500" : 
                          "bg-red-500"
                        )}
                      />
                      {pointsDiff >= 10 && (
                        <Badge 
                          variant="default" 
                          className="bg-gradient-to-r from-green-500 to-emerald-500 text-[10px] py-0"
                        >
                          High Score
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Average with Modern Typography */}
                  <div className="text-right space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Average</p>
                    <div>
                      <p className="text-xl font-bold tracking-tight">{gw.average}</p>
                      <p className={cn(
                        "text-xs font-medium",
                        isPositive ? "text-green-500" : "text-red-500"
                      )}>
                        {isPositive ? "Above" : "Below"} average
                      </p>
                    </div>
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
