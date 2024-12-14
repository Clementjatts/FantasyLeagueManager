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
  const teamInfo = teams?.find(t => t.id === player.team);
  const teamAbbr = teamInfo?.short_name || player.team?.toString();

  // Calculate form status
  const formValue = parseFloat(player.form || "0");
  const formColor = formValue >= 6 ? "text-green-500" : formValue >= 4 ? "text-yellow-500" : "text-red-500";

  return (
    <Card 
      className={cn(
        "relative overflow-hidden cursor-pointer group",
        "w-[160px] h-[110px]",
        "p-3 hover:shadow-lg transition-all duration-200",
        "bg-gradient-to-br from-background/95 via-background/98 to-muted/20",
        "hover:bg-gradient-to-br hover:from-background/90 hover:via-background/95 hover:to-primary/5",
        "border border-border/50 hover:border-primary/20",
        isCaptain && "ring-2 ring-primary ring-offset-1",
        isViceCaptain && "ring-2 ring-primary/50 ring-offset-1",
        className
      )}
      onClick={onClick}
    >
      {/* Top Section */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20" />
      
      <div className="space-y-2">
        {/* Player Name and Captain Badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-base bg-gradient-to-br from-foreground to-foreground/80 bg-clip-text">
              {player.web_name}
            </span>
            {isCaptain && (
              <Badge variant="default" className="bg-primary/90 h-5 w-5 p-0 flex items-center justify-center rounded-full text-[11px] font-bold">
                C
              </Badge>
            )}
            {isViceCaptain && (
              <Badge variant="outline" className="border-primary/50 text-primary h-5 w-5 p-0 flex items-center justify-center rounded-full text-[11px] font-bold">
                V
              </Badge>
            )}
          </div>
          <Badge variant={formValue >= 6 ? "default" : "secondary"} className={cn("text-[10px]", formColor)}>
            {player.form || "0.0"}
          </Badge>
        </div>
        
        {/* Position and Team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs">
            <Badge variant="secondary" className="h-5 px-1.5">
              {positionMap[player.element_type]}
            </Badge>
            <span className="text-muted-foreground font-medium">
              {teamAbbr}
            </span>
          </div>
          <Badge 
            variant="outline" 
            className="text-[11px] bg-primary/5 border-primary/20"
          >
            {player.total_points || 0}p
          </Badge>
        </div>

        {/* Bottom Status Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      </div>
    </Card>
  );
}
