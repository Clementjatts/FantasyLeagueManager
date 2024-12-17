
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
  const latestGameweek = sortedData[sortedData.length - 1];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {sortedData.map((gw) => {
        const isLatest = gw.gameweek === latestGameweek.gameweek;
        
        return (
          <Card key={gw.gameweek} className={cn(
            "transition-all duration-300 hover:shadow-md",
            isLatest && "ring-1 ring-primary"
          )}>
            <CardContent className="p-3">
              <div className="text-xs text-muted-foreground">GW {gw.gameweek}</div>
              <div className="text-xl font-bold">{gw.points}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
