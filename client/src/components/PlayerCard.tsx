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



export function PlayerCard({ 
  player, 
  isCaptain, 
  isViceCaptain, 
  onClick, 
  className,
  fixtures = [],
  teams = []
}: PlayerCardProps) {
  // Get team abbreviation from teams data
  const teamInfo = teams?.find(t => t.id === player.team) || { short_name: '' };
  const teamAbbr = teamInfo.short_name;

  // Calculate form status
  const formValue = parseFloat(player.form || "0");
  const formColor = formValue >= 6 ? "text-green-500" : formValue >= 4 ? "text-yellow-500" : "text-red-500";

  return (
    <Card 
      className={cn(
        "relative cursor-pointer",
        "w-[120px] h-[80px]",
        "p-2",
        "hover:shadow-md transition-all duration-200",
        isCaptain && "ring-1 ring-primary",
        isViceCaptain && "ring-1 ring-primary/50",
        className
      )}
      onClick={onClick}
    >
      <div className="h-full flex flex-col justify-between">
        {/* Player Name Row */}
        <div className="flex items-center gap-1">
          <div className="flex-1 min-w-0">
            <div className="font-medium text-xs leading-4 truncate">
              {player.web_name}
              {isCaptain && " (C)"}
              {isViceCaptain && " (V)"}
            </div>
          </div>
        </div>

        {/* Info Row */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <Badge variant="secondary" className="px-1 h-6 flex items-center justify-center">
            {positionMap[player.element_type]}
          </Badge>
          <span className="flex items-center justify-center text-muted-foreground">
            {teamAbbr}
          </span>
          <Badge variant="outline" className="px-1 h-6 flex items-center justify-center">
            {player.event_points || 0}p
          </Badge>
        </div>
      </div>
    </Card>
  );
}
