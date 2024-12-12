import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Player } from "../types/fpl";

interface PlayerCardProps {
  player: Player;
  isCaptain?: boolean;
  isViceCaptain?: boolean;
  onClick?: () => void;
}

export function PlayerCard({ player, isCaptain, isViceCaptain, onClick }: PlayerCardProps) {
  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-shadow"
      onClick={onClick}
    >
      <CardHeader className="p-3">
        <div className="flex justify-between items-center">
          <span className="font-semibold">{player.web_name}</span>
          <div className="flex gap-2">
            {isCaptain && <Badge variant="default">C</Badge>}
            {isViceCaptain && <Badge variant="outline">VC</Badge>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">Form: </span>
            <span>{player.form}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Points: </span>
            <span>{player.total_points}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Price: </span>
            <span>£{(player.now_cost / 10).toFixed(1)}m</span>
          </div>
          <div>
            <span className="text-muted-foreground">Selected: </span>
            <span>{player.selected_by_percent}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
