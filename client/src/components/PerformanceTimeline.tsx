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

  return (
    <div className="space-y-6">
      {sortedData.map((gw, index) => {
        const pointsDiff = gw.points - gw.average;
        const isPositive = pointsDiff >= 0;
        
        return (
          <div key={gw.gameweek} className="flex items-start gap-4">
            {/* Gameweek Circle */}
            <div className="flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 via-primary to-blue-500 flex items-center justify-center shadow-lg">
              <span className="text-2xl font-bold text-white">{gw.gameweek}</span>
            </div>

            {/* Performance Card */}
            <Card className={cn(
              "flex-grow transition-all duration-200",
              "hover:shadow-lg",
              index === sortedData.length - 1 && "ring-2 ring-primary"
            )}>
              <CardContent className="p-4">
                <div className="grid grid-cols-3 gap-4">
                  {/* Points */}
                  <div>
                    <p className="text-sm text-muted-foreground">Points</p>
                    <p className="text-2xl font-bold">{gw.points}</p>
                    {pointsDiff !== 0 && (
                      <div className={cn(
                        "flex items-center gap-1 text-sm",
                        isPositive ? "text-green-500" : "text-red-500"
                      )}>
                        {isPositive ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                        {Math.abs(pointsDiff)}
                      </div>
                    )}
                  </div>

                  {/* Performance Indicator */}
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Performance</p>
                    <Progress 
                      value={(gw.points / Math.max(...data.map(d => d.points))) * 100} 
                      className="h-2 mb-2"
                    />
                    {pointsDiff >= 10 && (
                      <Badge variant="default" className="bg-green-500">
                        High Score
                      </Badge>
                    )}
                  </div>

                  {/* Average */}
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Average</p>
                    <p className="text-2xl font-bold">{gw.average}</p>
                    <p className={cn(
                      "text-sm",
                      isPositive ? "text-green-500" : "text-red-500"
                    )}>
                      {isPositive ? "Above" : "Below"} average
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
