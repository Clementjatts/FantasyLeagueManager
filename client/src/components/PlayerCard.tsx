import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Player } from "../types/fpl";
import { cn } from "@/lib/utils";
import { TrendingUp, Star, ChevronUp } from "lucide-react";

interface PlayerCardProps {
  player: Player;
  isCaptain?: boolean;
  isViceCaptain?: boolean;
  onClick?: () => void;
  className?: string;
  fixtures?: any[];
  teams?: any[];
  displayContext?: 'live' | 'transfer' | 'dream';
  showTransferInfo?: boolean;
  showLiveStats?: boolean;
  showOptimalStats?: boolean;
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
  teams = [],
  displayContext = 'live',
  showLiveStats = false,
  showTransferInfo = false,
  showOptimalStats = false
}: PlayerCardProps) {
  const teamInfo = teams?.find(t => t.id === player.team) || { short_name: '' };
  const teamAbbr = teamInfo.short_name;
  const formValue = parseFloat(player.form || "0");
  const formColor = formValue >= 6 ? "text-green-500" : formValue >= 4 ? "text-yellow-500" : "text-red-500";

  const renderInfo = () => {
    switch (displayContext) {
      case 'live':
        return (
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/10 rounded-lg blur-sm group-hover:blur-md transition-all" />
            <Badge variant="outline" className="relative bg-background/40 backdrop-blur-md border-none px-3 py-1.5 font-medium">
              <span className="text-primary">
                {((player.event_points || 0) * (player.multiplier || 1))}
              </span>
              <span className="text-xs ml-0.5">pts</span>
              {showLiveStats && (
                <span className="ml-1.5 text-xs text-muted-foreground">({player.minutes}′)</span>
              )}
            </Badge>
          </div>
        );
      case 'transfer':
        return (
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/10 rounded-lg blur-sm group-hover:blur-md transition-all" />
            <Badge variant="outline" className="relative bg-background/40 backdrop-blur-md border-none px-3 py-1.5 font-medium">
              <span className="text-primary">£{(player.now_cost / 10).toFixed(1)}</span>
              <span className="text-xs ml-0.5">m</span>
              {showTransferInfo && player.cost_change_event !== 0 && (
                <span className={`ml-1.5 text-xs ${player.cost_change_event > 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {player.cost_change_event > 0 ? '↑' : '↓'}£{Math.abs(player.cost_change_event / 10).toFixed(1)}m
                </span>
              )}
            </Badge>
          </div>
        );
      case 'dream':
        return (
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/10 rounded-lg blur-sm group-hover:blur-md transition-all" />
            <div className="relative flex items-center gap-2 bg-background/40 backdrop-blur-md px-3 py-1.5 rounded-lg">
              <ChevronUp className={`h-4 w-4 ${formColor}`} />
              <span className={`text-xs font-semibold ${formColor}`}>{formValue}</span>
              {showOptimalStats && player.is_optimal && (
                <span className="ml-1.5 text-xs text-green-500">★</span>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Card 
      className={cn(
        "relative cursor-pointer group/card",
        "w-[160px] h-[120px]",
        "p-4",
        "bg-gradient-to-br from-background/95 via-background/98 to-muted/80",
        "hover:shadow-xl hover:shadow-primary/20 hover:scale-[1.03] transition-all duration-300",
        "border border-border/20",
        "overflow-hidden rounded-xl",
        isCaptain && "ring-2 ring-primary/80 ring-offset-2 ring-offset-background",
        isViceCaptain && "ring-2 ring-primary/40 ring-offset-2 ring-offset-background",
        className
      )}
      onClick={onClick}
    >
      {/* Futuristic accent elements */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/60 to-transparent opacity-80" />
      <div className="absolute top-0 left-0 w-[1px] h-12 bg-gradient-to-b from-primary/60 to-transparent opacity-80" />
      <div className="absolute top-0 right-0 w-[1px] h-8 bg-gradient-to-b from-primary/40 to-transparent opacity-60" />
      
      {/* Glowing corner accent */}
      <div className="absolute top-0 left-0 w-8 h-8 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent rounded-br-3xl opacity-60" />
      
      {/* Hover effect background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/0 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300" />
      
      <div className="relative h-full flex flex-col justify-between">
        <div className="space-y-3">
          {/* Player Name and Role */}
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0 space-y-1">
              <div className="font-medium text-sm leading-tight truncate tracking-wide text-foreground/90">
                {player.web_name}
                {isCaptain && (
                  <span className="ml-1.5 text-primary inline-flex items-center">
                    <Star className="w-4 h-4 fill-primary" />
                  </span>
                )}
                {isViceCaptain && (
                  <span className="ml-1.5 text-primary/70 inline-flex items-center">
                    <Star className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Team and Position with modern styling */}
          <div className="flex items-center gap-2">
            <Badge 
              variant="secondary" 
              className="h-5 px-2 font-medium text-xs bg-primary/10 hover:bg-primary/15 transition-colors border-none rounded-md"
            >
              {positionMap[player.element_type]}
            </Badge>
            <span className="text-xs font-medium text-muted-foreground/80 tracking-wide">
              {teamAbbr}
            </span>
          </div>
        </div>

        {/* Info Badge with enhanced styling */}
        <div className="flex justify-end -mb-1">
          {renderInfo()}
        </div>
      </div>
    </Card>
  );
}
