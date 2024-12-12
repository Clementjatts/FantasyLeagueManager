import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { type Player } from "../types/fpl";

interface PlayerStatsProps {
  player: Player;
  className?: string;
}

export function PlayerStats({ player, className }: PlayerStatsProps) {
  // Calculate form indicators
  const formScore = parseFloat(player.form);
  const isGoodForm = formScore > 5;
  const isBadForm = formScore < 3;
  
  // Calculate price trend
  const priceChange = player.cost_change_event;
  const priceDirection = priceChange > 0 ? "up" : priceChange < 0 ? "down" : "stable";

  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Form Indicator */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium">Form</span>
              <span className="text-xs">{formScore}</span>
            </div>
            <Progress 
              value={formScore * 10} 
              className={cn(
                "h-1.5",
                isGoodForm && "bg-green-500",
                isBadForm && "bg-red-500"
              )}
            />
          </div>

          {/* Key Stats */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-xs text-muted-foreground">Goals</div>
              <div className="font-semibold">{player.goals_scored}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Assists</div>
              <div className="font-semibold">{player.assists}</div>
            </div>
          </div>

          {/* Price Trend */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Price Trend</span>
            <Badge 
              variant={
                priceDirection === "up" ? "default" : 
                priceDirection === "down" ? "destructive" : 
                "secondary"
              }
              className="text-xs"
            >
              {priceDirection === "up" && (
                <TrendingUp className="w-3 h-3 mr-1" />
              )}
              {priceDirection === "down" && (
                <TrendingDown className="w-3 h-3 mr-1" />
              )}
              {priceDirection === "stable" && (
                <Minus className="w-3 h-3 mr-1" />
              )}
              £{Math.abs(priceChange / 10)}m
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
