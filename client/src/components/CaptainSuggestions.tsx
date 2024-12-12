import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, TrendingUp, Calendar } from "lucide-react";
import { type Player } from "../types/fpl";
import { cn } from "@/lib/utils";

interface CaptainSuggestionsProps {
  players: Player[];
  onSelectCaptain: (player: Player) => void;
  currentCaptainId?: number;
  currentViceCaptainId?: number;
}

export function CaptainSuggestions({ 
  players, 
  onSelectCaptain,
  currentCaptainId,
  currentViceCaptainId
}: CaptainSuggestionsProps) {
  // Sort players by form and filter out those with low minutes
  const viableCaptains = players
    .filter(p => p.minutes > 60)
    .sort((a, b) => parseFloat(b.form) - parseFloat(a.form))
    .slice(0, 5);

  return (
    <Card className="bg-gradient-to-br from-background to-muted/5">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Crown className="w-5 h-5 text-primary" />
          <div>
            <CardTitle>Captain Picks</CardTitle>
            <p className="text-sm text-muted-foreground">Top form players for your armband</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {viableCaptains.map(player => (
            <div
              key={player.id}
              onClick={() => onSelectCaptain(player)}
              className={cn(
                "p-3 rounded-lg cursor-pointer",
                "bg-gradient-to-br from-card to-muted/10",
                "border border-border/30",
                "transition-all duration-200",
                "hover:shadow-md hover:border-primary/20",
                (player.id === currentCaptainId || player.id === currentViceCaptainId) && 
                "ring-1 ring-primary/50"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium">{player.web_name}</span>
                  {player.id === currentCaptainId && (
                    <Badge variant="default" className="bg-primary/90 h-5 min-w-[24px] flex items-center justify-center">
                      C
                    </Badge>
                  )}
                  {player.id === currentViceCaptainId && (
                    <Badge variant="outline" className="border-primary/50 text-primary h-5 min-w-[28px] flex items-center justify-center">
                      VC
                    </Badge>
                  )}
                </div>
                <Badge 
                  variant="secondary" 
                  className={cn(
                    "h-5 px-2 flex items-center",
                    parseFloat(player.form) > 5 && "bg-green-500/10 text-green-500",
                    parseFloat(player.form) < 3 && "bg-red-500/10 text-red-500"
                  )}
                >
                  Form {player.form}
                </Badge>
              </div>
              
              <div className="grid grid-cols-4 gap-x-6 text-sm">
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">Points</span>
                  <span className="tabular-nums font-medium">{player.total_points}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">Position</span>
                  <span className="font-medium">
                    {player.element_type === 1 ? "GK" : 
                     player.element_type === 2 ? "DEF" :
                     player.element_type === 3 ? "MID" : "FWD"}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">Price</span>
                  <span className="tabular-nums font-medium">£{(player.now_cost / 10).toFixed(1)}m</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">Selected</span>
                  <span className="tabular-nums font-medium">{player.selected_by_percent}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}