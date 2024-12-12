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
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="w-6 h-6 text-primary" />
            <div>
              <CardTitle className="text-xl">Captain Suggestions</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Based on form and upcoming fixtures
              </p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {viableCaptains.map(player => (
            <div
                key={player.id}
                className={cn(
                  "p-4 rounded-lg cursor-pointer",
                  "bg-gradient-to-br from-background/90 via-background/50 to-muted/30",
                  "border border-border/50",
                  "transition-all duration-300",
                  "hover:shadow-lg hover:scale-[1.02] hover:border-primary/50",
                  (player.id === currentCaptainId || player.id === currentViceCaptainId) && 
                  "ring-2 ring-primary ring-offset-2"
                )}
                onClick={() => onSelectCaptain(player)}
              >
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold truncate">{player.web_name}</span>
                      {player.id === currentCaptainId && (
                        <Badge variant="default" className="bg-primary/90 text-primary-foreground px-2">C</Badge>
                      )}
                      {player.id === currentViceCaptainId && (
                        <Badge variant="outline" className="border-primary/70 text-primary px-2">VC</Badge>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-primary">{player.total_points}</span>
                      <span className="text-sm text-muted-foreground ml-1">pts</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      <span className="text-sm">
                        <span className="font-medium">{player.form}</span>
                        <span className="text-muted-foreground ml-1">Form</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span className="text-sm whitespace-nowrap">
                        <span className="font-medium">{player.team}</span>
                        <span className="text-muted-foreground ml-1">Next</span>
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <span className="whitespace-nowrap">
                        Value: <span className="font-medium text-foreground">£{(player.now_cost / 10).toFixed(1)}m</span>
                      </span>
                      <span className="whitespace-nowrap">
                        Selected: <span className="font-medium text-foreground">{player.selected_by_percent}%</span>
                      </span>
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