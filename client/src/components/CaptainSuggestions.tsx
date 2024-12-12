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
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-sm">{player.web_name}</span>
                    {player.id === currentCaptainId && (
                      <Badge variant="default" className="bg-primary/90 h-[18px] min-w-[18px] flex items-center justify-center text-[11px] font-bold px-0">
                        C
                      </Badge>
                    )}
                    {player.id === currentViceCaptainId && (
                      <Badge variant="outline" className="border-primary/50 text-primary h-[18px] min-w-[22px] flex items-center justify-center text-[11px] font-bold px-0">
                        VC
                      </Badge>
                    )}
                  </div>
                </div>
                <Badge 
                  variant="secondary" 
                  className={cn(
                    "h-[18px] px-1.5 flex items-center text-[11px] font-semibold",
                    parseFloat(player.form) > 5 && "bg-green-500/10 text-green-500",
                    parseFloat(player.form) < 3 && "bg-red-500/10 text-red-500"
                  )}
                >
                  Form {player.form}
                </Badge>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col items-center px-2 py-1 rounded-md bg-muted/40">
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Points</span>
                  <span className="text-sm tabular-nums font-semibold">{player.total_points}</span>
                </div>
                <div className="flex flex-col items-center px-2 py-1 rounded-md bg-muted/40">
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Position</span>
                  <span className="text-sm font-semibold">
                    {player.element_type === 1 ? "GK" : 
                     player.element_type === 2 ? "DEF" :
                     player.element_type === 3 ? "MID" : "FWD"}
                  </span>
                </div>
                <div className="flex flex-col items-center px-2 py-1 rounded-md bg-muted/40">
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Selected</span>
                  <span className="text-sm tabular-nums font-semibold">{player.selected_by_percent}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}