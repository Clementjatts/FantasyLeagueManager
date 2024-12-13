import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { type Player } from "../types/fpl";
import { cn } from "@/lib/utils";

interface PlayerComparisonProps {
  player: Player;
  comparedPlayer?: Player;
}

interface StatComparisonProps {
  label: string;
  value1: number | string;
  value2?: number | string;
  reverse?: boolean;
}

function StatComparison({ label, value1, value2, reverse = false }: StatComparisonProps) {
  const val1 = typeof value1 === 'string' ? parseFloat(value1) : value1;
  const val2 = value2 ? (typeof value2 === 'string' ? parseFloat(value2) : value2) : 0;
  
  const max = Math.max(val1, val2, 1); // Ensure we don't divide by zero
  const progress1 = (val1 / max) * 100;
  const progress2 = value2 ? (val2 / max) * 100 : 0;
  
  const better = reverse ? val1 < val2 : val1 > val2;
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <div className="flex items-center gap-2">
          <span className={cn(
            "font-medium",
            better ? "text-green-500" : value2 ? "text-red-500" : ""
          )}>{val1}</span>
          {value2 && (
            <>
              <span className="text-muted-foreground">vs</span>
              <span className={cn(
                "font-medium",
                !better ? "text-green-500" : "text-red-500"
              )}>{val2}</span>
            </>
          )}
        </div>
      </div>
      <div className="flex gap-1">
        <Progress 
          value={progress1} 
          className={cn(
            "h-2",
            better ? "bg-green-500/20" : value2 ? "bg-red-500/20" : ""
          )}
        />
        {value2 && (
          <Progress 
            value={progress2} 
            className={cn(
              "h-2",
              !better ? "bg-green-500/20" : "bg-red-500/20"
            )}
          />
        )}
      </div>
    </div>
  );
}

export function PlayerComparison({ player, comparedPlayer }: PlayerComparisonProps) {
  const stats = [
    { label: "Total Points", value: "total_points" },
    { label: "Points Per Game", value: "points_per_game" },
    { label: "Minutes", value: "minutes" },
    { label: "Goals", value: "goals_scored" },
    { label: "Assists", value: "assists" },
    { label: "Clean Sheets", value: "clean_sheets" },
    { label: "Bonus Points", value: "bonus" },
    { label: "Price", value: "now_cost", divideBy: 10 },
    { label: "Form", value: "form" },
    { label: "Selected By", value: "selected_by_percent", suffix: "%" }
  ];

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Performance Comparison</CardTitle>
          {comparedPlayer && (
            <Badge variant="outline">
              vs {comparedPlayer.web_name}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {stats.map(stat => (
          <StatComparison
            key={stat.label}
            label={stat.label}
            value1={stat.divideBy 
              ? (player[stat.value] / stat.divideBy) 
              : player[stat.value] || 0}
            value2={comparedPlayer 
              ? (stat.divideBy 
                ? (comparedPlayer[stat.value] / stat.divideBy)
                : comparedPlayer[stat.value] || 0)
              : undefined}
            reverse={stat.label === "Price"} // Lower is better for price
          />
        ))}
      </CardContent>
    </Card>
  );
}
