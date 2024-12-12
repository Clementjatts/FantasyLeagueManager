import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Minus, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface GameweekData {
  event: number;
  points: number;
  average: number;
}

interface PerformanceTimelineProps {
  data: GameweekData[];
}

export function PerformanceTimeline({ data }: PerformanceTimelineProps) {
  // Sort data by gameweek in descending order (most recent first)
  const sortedData = [...data].sort((a, b) => b.event - a.event);

  return (
    <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:h-full before:w-0.5 before:-translate-x-px before:bg-gradient-to-b before:from-primary before:to-primary/20 before:content-['']">
      {sortedData.map((gw, index) => {
        const pointsDiff = gw.points - gw.average;
        const performanceColor = pointsDiff >= 0 ? "text-green-500" : "text-red-500";
        const progressValue = (gw.points / Math.max(...data.map(d => d.points))) * 100;

        return (
          <div key={gw.event} className="relative flex items-center">
            <div className="absolute left-0 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 via-primary to-blue-500 shadow-lg ring-2 ring-background">
              <span className="text-2xl font-black text-white">{gw.event}</span>
            </div>

            <Card className={cn(
              "ml-20 w-full transition-all duration-200",
              "hover:shadow-lg hover:scale-[1.02]",
              index === 0 && "ring-2 ring-primary ring-offset-2"
            )}>
              <CardContent className="p-4">
                <div className="grid gap-4 md:grid-cols-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Points</p>
                    <p className="text-2xl font-bold">{gw.points}</p>
                    {pointsDiff !== 0 && (
                      <div className={cn("flex items-center gap-1 text-sm", performanceColor)}>
                        {pointsDiff > 0 ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                        {Math.abs(pointsDiff)} vs avg
                      </div>
                    )}
                  </div>

                  <div className="col-span-2">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Performance</span>
                        <span className="font-medium">{progressValue.toFixed(0)}%</span>
                      </div>
                      <Progress value={progressValue} className="h-2" />
                      <div className="flex gap-2">
                        {pointsDiff >= 10 && (
                          <Badge variant="default" className="bg-green-500">
                            <Trophy className="w-3 h-3 mr-1" />
                            Great Week
                          </Badge>
                        )}
                        {gw.points > gw.average && (
                          <Badge variant="outline" className="border-green-500 text-green-500">
                            Above Average
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Average</p>
                    <p className="text-2xl font-bold">{gw.average}</p>
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
