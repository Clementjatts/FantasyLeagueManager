import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp, Trophy, Target, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface DreamTeamLegendProps {
  formation: string;
  totalPoints: number;
  className?: string;
}

export function DreamTeamLegend({ formation, totalPoints, className }: DreamTeamLegendProps) {
  const metrics = [
    {
      icon: Trophy,
      label: "Formation",
      value: formation,
      description: "Optimal formation based on player performance"
    },
    {
      icon: Target,
      label: "Expected Points",
      value: Math.round(totalPoints).toLocaleString(),
      description: "Predicted points for upcoming gameweek"
    },
    {
      icon: Sparkles,
      label: "Selection Criteria",
      value: "Multi-Factor",
      description: "Form (35%), History (25%), Fixtures (20%), Playing Time (20%)"
    },
    {
      icon: Calendar,
      label: "Prediction Window",
      value: "1 GW",
      description: "Focusing on upcoming gameweek"
    },
    {
      icon: TrendingUp,
      label: "Confidence Level",
      value: "Dynamic",
      description: "Based on minutes played and fixture difficulty"
    }
  ];

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-5 gap-4", className)}>
      {metrics.map((metric, index) => (
        <Card key={index} className="relative overflow-hidden group">
          {/* Ambient background effects */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
          
          <div className="relative p-4 space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <metric.icon className="w-4 h-4" />
              <span className="text-sm font-medium">{metric.label}</span>
            </div>
            
            <div className="flex items-baseline gap-2">
              <div className="text-xl font-bold text-foreground">
                {metric.value}
              </div>
            </div>
            
            <div className="text-xs text-muted-foreground/80">
              {metric.description}
            </div>
          </div>
          
          {/* Hover effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </Card>
      ))}
    </div>
  );
}
