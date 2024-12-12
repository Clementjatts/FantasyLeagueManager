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
      <CardHeader>
        <div className="flex items-center gap-2">
          <Crown className="w-5 h-5 text-primary" />
          <CardTitle>Captain Suggestions</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {viableCaptains.map(player => (
            <div
              key={player.id}
              className={cn(
                "flex items-center justify-between p-3 rounded-lg cursor-pointer",
                "bg-gradient-to-br from-background/80 to-muted/50",
                "border border-border/50",
                "transition-all duration-200 hover:shadow-md",
                (player.id === currentCaptainId || player.id === currentViceCaptainId) && 
                "ring-2 ring-primary"
              )}
              onClick={() => onSelectCaptain(player)}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{player.web_name}</span>
                  {player.id === currentCaptainId && (
                    <Badge variant="default">Captain</Badge>
                  )}
                  {player.id === currentViceCaptainId && (
                    <Badge variant="outline">Vice Captain</Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    <span>Form: {player.form}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>Next: {player.team}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">
                  {player.total_points} pts
                </div>
                <div className="text-xs text-muted-foreground">
                  £{(player.now_cost / 10).toFixed(1)}m
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
