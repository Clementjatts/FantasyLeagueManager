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

function predictNextMatchPoints(player: Player, fixtures: any[] = [], teams: any[] = []): number {
  if (!fixtures.length || !teams.length) return 0;
  
  // Find next fixture for player's team
  const nextFixture = fixtures.find(f => 
    f.team_h === player.team || f.team_a === player.team
  );
  
  if (!nextFixture) return 0;

  // Base prediction from form and points per game
  const formPoints = parseFloat(player.form || "0") * 0.8;
  const historyPoints = parseFloat(player.points_per_game || "0") * 0.7;
  
  // Position-specific base points
  const positionBase = {
    1: 2.5, // GK: Clean sheet potential
    2: 2.0, // DEF: Clean sheet potential
    3: 2.0, // MID: Mix of attack and defense
    4: 2.0  // FWD: Goal potential
  }[player.element_type] || 2.0;
  
  // Fixture difficulty has more impact
  const difficulty = nextFixture.difficulty || 3;
  const difficultyFactor = Math.max(0, 3 - difficulty) * 0.5; // Easier fixtures give smaller bonus
  
  // Minutes factor (slightly reduced impact)
  const minutesFactor = player.minutes > 450 ? 1.1 : // Regular starter
                       player.minutes > 270 ? 1.0 : // Often plays
                       player.minutes > 90 ? 0.7 : // Sometimes plays
                       0.4; // Rarely plays
  
  // Calculate base prediction
  const prediction = (
    (formPoints + historyPoints + positionBase) * 
    minutesFactor + 
    difficultyFactor
  );
  
  // Round and cap between 1-12 points
  return Math.max(1, Math.min(12, Math.round(prediction)));
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
  const nextPoints = predictNextMatchPoints(player, fixtures, teams);
  const isHighPoints = nextPoints >= 6;
  const isLowPoints = nextPoints <= 2;
  
  // Get team abbreviation from teams data
  const teamInfo = teams?.find(t => t.id === player.team);
  const teamAbbr = teamInfo?.short_name || player.team?.toString();

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
              isHighPoints && "bg-green-500/10 text-green-500",
              isLowPoints && "bg-red-500/10 text-red-500"
            )}
          >
            <TrendingUp className="w-3 h-3" />
            Pred: {nextPoints}
          </Badge>
        </div>
        
        <div className="flex items-center justify-end text-sm">
          <span className="text-muted-foreground opacity-60 group-hover:opacity-100 transition-opacity">
            {teamAbbr}
          </span>
        </div>
      </div>
    </Card>
  );
}
