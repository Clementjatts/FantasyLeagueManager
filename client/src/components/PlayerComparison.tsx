import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { type Player } from "../types/fpl";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus, Star, Shield, Target, Zap } from "lucide-react";

interface PlayerComparisonProps {
  player: Player;
  comparedPlayer?: Player;
}

interface StatComparisonProps {
  label: string;
  value1: number | string;
  value2?: number | string;
  reverse?: boolean;
  showTrend?: boolean;
  suffix?: string;
}

interface StatCategory {
  title: string;
  description: string;
  icon: React.ReactNode;
  stats: {
    label: string;
    value: string;
    divideBy?: number;
    reverse?: boolean;
    showTrend?: boolean;
    suffix?: string;
  }[];
}

function StatComparison({ 
  label, 
  value1, 
  value2, 
  reverse = false, 
  showTrend = false,
  suffix = ""
}: StatComparisonProps) {
  const val1 = typeof value1 === 'string' ? parseFloat(value1) : value1;
  const val2 = value2 ? (typeof value2 === 'string' ? parseFloat(value2) : value2) : 0;
  
  const max = Math.max(val1, val2, 1);
  const progress1 = (val1 / max) * 100;
  const progress2 = value2 ? (val2 / max) * 100 : 0;
  
  const better = reverse ? val1 < val2 : val1 > val2;
  const difference = Math.abs(val1 - (val2 || 0));
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground flex items-center gap-2">
          {label}
          {showTrend && (
            <span className={cn(
              "text-xs",
              better ? "text-green-500" : "text-red-500"
            )}>
              {better ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            </span>
          )}
        </span>
        <div className="flex items-center gap-2">
          <span className={cn(
            "font-medium",
            better ? "text-green-500" : value2 ? "text-red-500" : ""
          )}>{val1}{suffix}</span>
          {value2 && (
            <>
              <span className="text-muted-foreground">vs</span>
              <span className={cn(
                "font-medium",
                !better ? "text-green-500" : "text-red-500"
              )}>{val2}{suffix}</span>
              <Badge variant={better ? "default" : "destructive"} className="text-xs">
                {difference.toFixed(1)}{suffix} {better ? "better" : "worse"}
              </Badge>
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
  const getPositionSpecificStats = (player: Player) => {
    switch (player.element_type) {
      case 1: // GK
        return [
          { label: "Clean Sheets", value: "clean_sheets" },
          { label: "Saves", value: "saves" },
          { label: "Penalties Saved", value: "penalties_saved" },
        ];
      case 2: // DEF
        return [
          { label: "Clean Sheets", value: "clean_sheets" },
          { label: "Goals Conceded", value: "goals_conceded", reverse: true },
          { label: "Tackles", value: "tackles" },
        ];
      case 3: // MID
        return [
          { label: "Goals", value: "goals_scored" },
          { label: "Assists", value: "assists" },
          { label: "Expected Goal Involvements", value: "expected_goal_involvements" },
        ];
      case 4: // FWD
        return [
          { label: "Goals", value: "goals_scored" },
          { label: "Expected Goals", value: "expected_goals" },
          { label: "Big Chances", value: "big_chances_total" },
        ];
      default:
        return [];
    }
  };

  const categories: StatCategory[] = [
    {
      title: "Overall Performance",
      description: "Key performance indicators and match statistics",
      icon: <Star className="w-5 h-5 text-yellow-500" />,
      stats: [
        { label: "Total Points", value: "total_points", showTrend: true },
        { label: "Points Per Game", value: "points_per_game" },
        { label: "Minutes Played", value: "minutes" },
        { label: "Bonus Points", value: "bonus" },
      ]
    },
    {
      title: "Attack",
      description: "Offensive statistics and goal contributions",
      icon: <Target className="w-5 h-5 text-red-500" />,
      stats: [
        { label: "Goals", value: "goals_scored" },
        { label: "Assists", value: "assists" },
        { label: "Expected Goals", value: "expected_goals" }
      ]
    },
    {
      title: "Form & Value",
      description: "Recent performance and market statistics",
      icon: <Zap className="w-5 h-5 text-blue-500" />,
      stats: [
        { label: "Form", value: "form", showTrend: true },
        { label: "Price", value: "now_cost", divideBy: 10, reverse: true, suffix: "m" },
        { label: "Selected By", value: "selected_by_percent", suffix: "%" },
        { label: "Value (Form)", value: "value_form" },
      ]
    },
    {
      title: "Position Stats",
      description: "Position-specific performance metrics",
      icon: <Shield className="w-5 h-5 text-green-500" />,
      stats: [
        { label: "Clean Sheets", value: "clean_sheets", showIf: (p) => p.element_type <= 2 },
        { label: "Goals Conceded", value: "goals_conceded", reverse: true, showIf: (p) => p.element_type <= 2 },
        { label: "Saves", value: "saves", showIf: (p) => p.element_type === 1 },
        { label: "Penalties Saved", value: "penalties_saved", showIf: (p) => p.element_type === 1 },
        { label: "Expected Goal Involvements", value: "expected_goal_involvements", showIf: (p) => p.element_type >= 3 },
        { label: "Big Chances", value: "big_chances_total", showIf: (p) => p.element_type >= 3 }
      ].filter(stat => stat.showIf?.(player) || stat.showIf?.(comparedPlayer))
    }
  ];

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div>
          <CardTitle className="text-2xl">Performance Analysis</CardTitle>
          <CardDescription>
            Comprehensive comparison of key performance metrics
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="relative">
        <ScrollArea className="h-[calc(100vh-300px)] w-full rounded-md border p-4">
          <div className="space-y-6 pr-4 pb-6">
        {categories.map((category, index) => (
          <div key={category.title} className="space-y-4">
            {index > 0 && <Separator className="my-6" />}
            <div className="flex items-center gap-2 mb-4">
              {category.icon}
              <div>
                <h3 className="font-semibold text-lg">{category.title}</h3>
                <p className="text-sm text-muted-foreground">{category.description}</p>
              </div>
            </div>
            <div className="space-y-4">
              {category.stats.map(stat => (
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
                  reverse={stat.reverse}
                  showTrend={stat.showTrend}
                  suffix={stat.suffix}
                />
              ))}
            </div>
          </div>
        ))}
          </div>
          <ScrollBar orientation="vertical" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
