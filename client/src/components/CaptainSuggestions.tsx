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
    .filter(p => p.minutes > 60) // Only consider players with significant playing time
    .sort((a, b) => parseFloat(b.form) - parseFloat(a.form))
    .slice(0, 5); // Top 5 in-form players

  return (
    <Card className="bg-gradient-to-br from-background via-background/95 to-muted/20">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <Crown className="w-5 h-5 text-primary" />
          <div>
            <CardTitle className="text-xl font-bold">Captain Picks</CardTitle>
            <p className="text-sm text-muted-foreground">
              Top performers for your armband
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {viableCaptains.map(player => (
            <div
              key={player.id}
              className={cn(
                "p-4 rounded-lg cursor-pointer",
                "bg-gradient-to-br from-background/80 to-muted/30",
                "border border-border/40",
                "transition-all duration-200",
                "hover:shadow-md hover:border-primary/30 hover:from-background/90 hover:to-muted/40",
                (player.id === currentCaptainId || player.id === currentViceCaptainId) && 
                "ring-1 ring-primary ring-offset-1"
              )}
              onClick={() => onSelectCaptain(player)}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-medium">{player.web_name}</span>
                    {player.id === currentCaptainId && (
                      <Badge variant="default" className="bg-primary/90 text-primary-foreground px-2">C</Badge>
                    )}
                    {player.id === currentViceCaptainId && (
                      <Badge variant="outline" className="border-primary/70 text-primary px-2">VC</Badge>
                    )}
                  </div>
                  <Badge 
                    variant="secondary" 
                    className={cn(
                      "text-sm",
                      parseFloat(player.form) > 5 && "bg-green-500/10 text-green-500",
                      parseFloat(player.form) < 3 && "bg-red-500/10 text-red-500"
                    )}
                  >
                    Form: {player.form}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Points</span>
                    <p className="font-medium">{player.total_points}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Position</span>
                    <p className="font-medium">
                      {player.element_type === 1 ? "GK" : 
                       player.element_type === 2 ? "DEF" :
                       player.element_type === 3 ? "MID" : "FWD"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Price</span>
                    <p className="font-medium">£{(player.now_cost / 10).toFixed(1)}m</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Selected</span>
                    <p className="font-medium">{player.selected_by_percent}%</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}