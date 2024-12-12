import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Player } from "../types/fpl";
import { cn } from "@/lib/utils";

interface PlayerCardProps {
  player: Player;
  isCaptain?: boolean;
  isViceCaptain?: boolean;
  onClick?: () => void;
  className?: string;
}

const positionMap: Record<number, string> = {
  1: "GK",
  2: "DEF",
  3: "MID",
  4: "FWD"
};

export function PlayerCard({ player, isCaptain, isViceCaptain, onClick, className }: PlayerCardProps) {
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
          <span className="text-muted-foreground opacity-60 group-hover:opacity-100 transition-opacity">
            {player.team}
          </span>
        </div>
      </div>
    </Card>
  );
}