import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown } from "lucide-react";
import { type Player } from "../types/fpl";
import { fetchFixtures } from "../lib/api";
import { cn } from "@/lib/utils";

interface CaptainSuggestionsProps {
  allPlayers: Player[];
  onSelectCaptain: (player: Player) => void;
  currentCaptainId?: number;
  currentViceCaptainId?: number;
}

export function CaptainSuggestions({ 
  allPlayers, 
  onSelectCaptain,
  currentCaptainId,
  currentViceCaptainId
}: CaptainSuggestionsProps) {
  const { data: fixtures } = useQuery({
    queryKey: ["/api/fpl/fixtures"],
    queryFn: fetchFixtures
  });

  // Calculate player scores based on form and upcoming fixture difficulty
  const viableCaptains = useMemo(() => {
    if (!fixtures) return [];

    return allPlayers
      .filter(p => p.minutes > 180) // Players with significant minutes
      .map(player => {
        const nextFixture = fixtures.find(f => 
          (f.team_h === player.team || f.team_a === player.team) &&
          f.event === fixtures[0]?.event // Next gameweek
        );
        
        const isHome = nextFixture?.team_h === player.team;
        const opponent = isHome ? nextFixture?.team_a : nextFixture?.team_h;
        const difficulty = nextFixture?.difficulty || 3;
        
        // Calculate captain score: form * 2 + points per game - difficulty/2
        const captainScore = 
          parseFloat(player.form) * 2 + 
          parseFloat(player.points_per_game) - 
          (difficulty / 2);

        return {
          ...player,
          nextOpponent: opponent,
          isHome,
          captainScore,
          difficulty
        };
      })
      .sort((a, b) => b.captainScore - a.captainScore)
      .slice(0, 5);
  }, [allPlayers, fixtures]);

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
              
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 flex items-center justify-between px-3 py-1.5 rounded-md bg-muted/40">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Next:</span>
                    <span className="text-sm font-semibold">
                      {player.isHome ? 'vs' : '@'} Team {player.nextOpponent}
                    </span>
                  </div>
                  <Badge 
                    variant="secondary" 
                    className={cn(
                      "text-[11px]",
                      player.difficulty <= 2 && "bg-green-500/10 text-green-500",
                      player.difficulty >= 4 && "bg-red-500/10 text-red-500"
                    )}
                  >
                    FDR {player.difficulty}
                  </Badge>
                </div>
                <div className="flex flex-col items-center px-2 py-1 rounded-md bg-muted/40">
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">PPG</span>
                  <span className="text-sm tabular-nums font-semibold">{player.points_per_game}</span>
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