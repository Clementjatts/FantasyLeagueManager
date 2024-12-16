import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Player } from "../types/fpl";
import { cn } from "@/lib/utils";
import { TrendingUp } from "lucide-react";

interface DreamTeamPlayerCardProps {
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

export function DreamTeamPlayerCard({ 
  player, 
  isCaptain, 
  isViceCaptain, 
  onClick, 
  className,
  fixtures = [],
  teams = []
}: DreamTeamPlayerCardProps) {
  const teamInfo = teams?.find(t => t.id === player.team) || { short_name: '' };
  const teamAbbr = teamInfo.short_name;
  const formValue = parseFloat(player.form || "0");
  const formColor = formValue >= 6 ? "text-green-500" : formValue >= 4 ? "text-yellow-500" : "text-red-500";

  return (
    <Card 
      className={cn(
        "relative cursor-pointer group",
        "w-[120px] h-[90px]", // Slightly taller for dream team
        "p-3", // Increased padding
        "backdrop-blur-sm bg-gradient-to-br from-background/90 via-background/70 to-background/50",
        "transition-all duration-300 ease-out",
        "hover:shadow-lg hover:shadow-primary/10",
        "hover:scale-[1.02] hover:-translate-y-0.5",
        "border border-border/30",
        "after:absolute after:inset-0 after:rounded-lg after:bg-gradient-to-br after:from-primary/5 after:to-transparent after:opacity-0 after:transition-opacity after:duration-300",
        "group-hover:after:opacity-100",
        isCaptain && "ring-2 ring-primary/80 shadow-md shadow-primary/20",
        isViceCaptain && "ring-2 ring-primary/40 shadow-sm shadow-primary/10",
        className
      )}
      onClick={onClick}
    >
      {/* Captain Indicator */}
      {(isCaptain || isViceCaptain) && (
        <div className="absolute -top-2 -right-2 z-10">
          <div className={cn(
            "w-6 h-6 rounded-full flex items-center justify-center",
            "text-[10px] font-bold",
            "backdrop-blur-sm bg-background/90 border-2",
            "shadow-lg transition-all duration-300",
            isCaptain 
              ? "border-primary text-primary shadow-primary/20" 
              : "border-primary/40 text-primary/40 shadow-primary/10"
          )}>
            {isCaptain ? 'C' : 'VC'}
          </div>
        </div>
      )}

      <div className="h-full flex flex-col justify-between relative z-0">
        {/* Player Name Row */}
        <div className="flex items-center gap-1">
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-xs leading-4 truncate group-hover:text-primary transition-all duration-300">
              {player.web_name}
            </div>
          </div>
        </div>

        {/* Expected Points */}
        {player.optimal_reason && (
          <div className="text-[10px] text-primary/80 font-medium">
            {player.optimal_reason.split('(')[0]}
          </div>
        )}

        {/* Form Indicator */}
        <div className="flex items-center gap-1 text-[10px]">
          <TrendingUp size={12} className={cn(formColor, "transition-colors duration-300")} />
          <span className={cn(formColor, "font-medium transition-colors duration-300")}>{formValue}</span>
        </div>

        {/* Info Row */}
        <div className="grid grid-cols-2 gap-1 text-[10px]">
          <Badge 
            variant="secondary" 
            className={cn(
              "px-1 py-0 h-5",
              "bg-muted/50 text-muted-foreground",
              "group-hover:bg-primary/10 group-hover:text-primary",
              "transition-colors duration-300"
            )}
          >
            {teamAbbr}
          </Badge>
          <Badge 
            variant="secondary" 
            className={cn(
              "px-1 py-0 h-5",
              "bg-muted/50 text-muted-foreground",
              "group-hover:bg-primary/10 group-hover:text-primary",
              "transition-colors duration-300"
            )}
          >
            {positionMap[player.element_type]}
          </Badge>
        </div>
      </div>
    </Card>
  );
}
