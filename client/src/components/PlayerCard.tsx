import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Player } from "../types/fpl";
import { cn } from "@/lib/utils";
import { TrendingUp } from "lucide-react";

interface PlayerCardProps {
  player: Player;
  isCaptain?: boolean;
  isViceCaptain?: boolean;
  onClick?: () => void;
  className?: string;
  fixtures?: any[];
  teams?: any[];
}

const positionMap: Record<number, string> = {
  1: "GK",
  2: "DEF",
  3: "MID",
  4: "FWD"
};

function predictPlayerPoints(player: Player, fixtures: any[] = []): number {
  // Base points from current form
  const formPoints = parseFloat(player.form) * 4;
  
  // Historical performance points
  const historyPoints = parseFloat(player.points_per_game) * 3;
  
  // Minutes prediction
  const minutesFactor = player.minutes > 450 ? 1.3 : // Over 5 full games
                       player.minutes > 270 ? 1.1 : // Over 3 full games
                       player.minutes > 90 ? 0.8 : // At least 1 full game
                       0.4; // Bench/irregular player
  
  // Fixture difficulty impact
  const fixturePoints = fixtures.reduce((acc, f, index) => {
    const difficultyFactor = 5 - (f.difficulty || 3);
    const gameweekWeight = Math.max(1 - (index * 0.15), 0.4);
    return acc + (difficultyFactor * 2 * gameweekWeight);
  }, 0) / Math.max(fixtures.length, 1);
  
  // Recent trend bonus
  const trendBonus = parseFloat(player.form) > parseFloat(player.points_per_game) ? 1.2 : 1.0;
  
  return Math.round((formPoints + historyPoints + fixturePoints) * minutesFactor * trendBonus);
}

export function PlayerCard({ 
  player, 
  isCaptain, 
  isViceCaptain, 
  onClick, 
  className,
  fixtures = [],
  teams = []
}: PlayerCardProps) {
  const psp = predictPlayerPoints(player, fixtures);
  const isHighPSP = psp >= 15;
  const isLowPSP = psp < 8;

  return (
    <Card 
      className={cn(
        "relative overflow-hidden cursor-pointer group",
        "p-3 hover:shadow-lg transition-all duration-200",
        "bg-gradient-to-br from-background via-background/95 to-muted/20",
        isCaptain && "ring-2 ring-primary ring-offset-1",
        isViceCaptain && "ring-2 ring-primary/50 ring-offset-1",
        className
      )}
      onClick={onClick}
    >
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="font-medium text-base truncate pr-2">{player.web_name}</span>
          <div className="flex items-center gap-1.5">
            {isCaptain && (
              <Badge variant="default" className="bg-primary/90 h-5 px-1.5">C</Badge>
            )}
            {isViceCaptain && (
              <Badge variant="outline" className="border-primary/50 text-primary h-5 px-1.5">VC</Badge>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {positionMap[player.element_type]}
          </span>
          <Badge 
            variant="secondary" 
            className={cn(
              "h-5 px-1.5 flex items-center gap-1 text-xs font-medium",
              isHighPSP && "bg-green-500/10 text-green-500",
              isLowPSP && "bg-red-500/10 text-red-500"
            )}
          >
            <TrendingUp className="w-3 h-3" />
            PSP {psp}
          </Badge>
        </div>
        
        <div className="flex items-center justify-end text-sm">
          <span className="text-muted-foreground opacity-60 group-hover:opacity-100 transition-opacity">
            {player.team}
          </span>
        </div>
      </div>
    </Card>
  );
}
