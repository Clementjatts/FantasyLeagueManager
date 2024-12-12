import { Card, CardContent, CardHeader } from "@/components/ui/card";
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

export function PlayerCard({ player, isCaptain, isViceCaptain, onClick, className }: PlayerCardProps) {
  return (
    <Card 
      className={cn(
        "cursor-pointer hover:shadow-lg transition-shadow",
        className
      )}
      onClick={onClick}
    >
      <CardHeader className="p-3">
        <div className="flex justify-between items-center">
          <span className="font-semibold">{player.web_name}</span>
          <div className="flex gap-2">
            {isCaptain && (
              <Badge variant="default" className="bg-primary">C</Badge>
            )}
            {isViceCaptain && (
              <Badge variant="outline" className="border-primary text-primary">
                VC
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">Form: </span>
            <span className="font-medium">{player.form}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Points: </span>
            <span className="font-medium">{player.total_points}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Price: </span>
            <span className="font-medium">£{(player.now_cost / 10).toFixed(1)}m</span>
          </div>
          <div>
            <span className="text-muted-foreground">Position: </span>
            <span className="font-medium">
              {player.element_type === 1 ? "GK" : 
               player.element_type === 2 ? "DEF" :
               player.element_type === 3 ? "MID" : "FWD"}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Selected: </span>
            <span className="font-medium">{player.selected_by_percent}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
