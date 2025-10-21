import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Player } from "../types/fpl";
import { cn } from "@/lib/utils";
import { TrendingUp, ChevronUp, Sparkles } from "lucide-react";
import { predictPlayerPoints } from "@/lib/fpl-utils";

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
  children?: React.ReactNode;
}

const positionMap: Record<number, string> = {
  1: "GK",
  2: "DEF",
  3: "MID",
  4: "FWD"
};

const positionColors: Record<number, string> = {
  1: "from-teal/20 to-teal/20",
  2: "from-blue-500/20 to-blue-600/20",
  3: "from-green-500/20 to-green-600/20",
  4: "from-red-500/20 to-red-600/20"
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
  showOptimalStats = false,
  children
}: PlayerCardProps) {
  const teamInfo = teams?.find(t => t.id === player.team) || { short_name: '' };
  const teamAbbr = teamInfo.short_name;
  const formValue = parseFloat(player.form || "0");
  const formColor = formValue >= 6 ? "text-green-500" : formValue >= 4 ? "text-teal" : "text-red-500";

  // Filter fixtures and calculate predicted points
  const playerFixtures = fixtures?.filter(f => 
    f.team_h === player.team || f.team_a === player.team
  ) || [];
  const predictedPts = playerFixtures.length > 0 ? predictPlayerPoints(player, playerFixtures) : null;

  const renderInfo = () => {
    switch (displayContext) {
      case 'live':
        return (
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/10 rounded-lg blur-sm group-hover:blur-md transition-all" />
            <Badge variant="outline" className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-white/50 dark:border-gray-600/50 px-3 py-1.5 font-medium shadow-sm">
              <span className="text-primary">{player.event_points || 0}</span>
              <span className="text-xs ml-0.5">pts</span>
              {showLiveStats && player.minutes > 0 && (
                <span className="ml-1.5 text-xs text-slate-500 dark:text-slate-400">({player.minutes}′)</span>
              )}
            </Badge>
          </div>
        );
      case 'transfer':
        return (
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/10 rounded-lg blur-sm group-hover:blur-md transition-all" />
            <Badge variant="outline" className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-white/50 dark:border-gray-600/50 px-3 py-1.5 font-medium shadow-sm">
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
    <div className="relative">
      <Card
        onClick={onClick}
        className={cn(
          "relative overflow-hidden border-0",
          "bg-gradient-to-br from-background/95 to-background/50",
          "hover:from-background/90 hover:to-background/40",
          "backdrop-blur-sm shadow-xl",
          "transition-all duration-200",
          className
        )}
      >
        {/* Position indicator */}
        <div className={cn(
          "absolute top-0 left-0 right-0 h-1.5",
          "bg-gradient-to-r",
          positionColors[player.element_type]
        )} />

        <div className="pt-4 pb-2 px-3 space-y-2">
          {/* Player name and team */}
          <div className="text-center space-y-1.5">
            <div className="font-semibold leading-tight flex items-center justify-center gap-1.5 min-h-[1.5rem]">
              {player.web_name}
              {isCaptain && (
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-500/20 to-amber-600/20 blur-md" />
                  <div className="relative inline-flex items-center justify-center w-4 h-4 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg ring-1 ring-amber-500/50">
                    <span className="text-[9px] font-bold text-white tracking-tight">C</span>
                  </div>
                </div>
              )}
              {isViceCaptain && (
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/20 to-blue-600/20 blur-md" />
                  <div className="relative inline-flex items-center justify-center w-4 h-4 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg ring-1 ring-blue-500/50">
                    <span className="text-[8px] font-bold text-white tracking-tight">VC</span>
                  </div>
                </div>
              )}
            </div>
            <div className="text-xs text-muted-foreground">{teamAbbr} · {positionMap[player.element_type]}</div>
          </div>

          {/* Stats */}
          <div className="flex justify-center">
            {renderInfo()}
          </div>
        </div>
      </Card>

      {/* Predicted points below card */}
      {predictedPts && (
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 z-10">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/30 to-primary/20 rounded-full blur-sm" />
            <div className="relative px-2 py-0.5 bg-background/95 backdrop-blur-sm rounded-full border border-primary/20 shadow-lg">
              <span className="text-sm font-semibold text-primary">{predictedPts}</span>
              <span className="text-xs font-medium text-primary ml-0.5">PTS</span>
            </div>
          </div>
        </div>
      )}
      {children}
    </div>
  );
}
