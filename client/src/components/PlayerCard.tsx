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

  return (
    <Card 
      className={cn(
        "relative overflow-hidden cursor-pointer group",
        "w-[160px] h-[100px]",
        "p-3 hover:shadow-lg transition-all duration-200",
        "bg-gradient-to-br from-background via-background/95 to-muted/20",
        isCaptain && "ring-2 ring-primary ring-offset-1",
        isViceCaptain && "ring-2 ring-primary/50 ring-offset-1",
        className
      )}
      onClick={onClick}
    >
      <div className="space-y-2 flex flex-col items-center">
        <div className="flex items-center justify-center gap-1.5">
          {isCaptain && (
            <Badge variant="default" className="bg-primary/90 h-5 w-5 p-0 flex items-center justify-center rounded-full text-[12px] font-bold">
              C
            </Badge>
          )}
          {isViceCaptain && (
            <Badge variant="outline" className="border-primary/50 text-primary h-5 w-5 p-0 flex items-center justify-center rounded-full text-[12px] font-bold">
              V
            </Badge>
          )}
          <span className="font-medium text-base">{player.web_name}</span>
        </div>
        
        <div className="flex flex-col items-center gap-1 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">
              {positionMap[player.element_type]}
            </span>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground">
              {teamAbbr}
            </span>
          </div>
          <Badge variant="secondary" className="mt-1">
            £{((player.now_cost || 0) / 10).toFixed(1)}m
          </Badge>
        </div>
      </div>
    </Card>
  );
}
