import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowRightLeft, TrendingUp, ChevronRight } from "lucide-react";
import { type Player } from "../types/fpl";
import { cn } from "@/lib/utils";

interface TransferSuggestionProps {
  currentPlayers: Player[];
  allPlayers: Player[];
  fixtures: any[];
  teams: any[];
  onTransferClick: (inPlayer: Player, outPlayer: Player) => void;
}

interface TransferSuggestion {
  inPlayer: Player;
  outPlayer: Player;
  pointsPotential: number;
  difficulty: number;
  fixtures: string[];
}

export function TransferSuggestions({ 
  currentPlayers, 
  allPlayers,
  fixtures,
  teams,
  onTransferClick 
}: TransferSuggestionProps) {
  const suggestions = useMemo(() => {
    if (!fixtures || !teams) return [];

    const teamMap = teams.reduce((acc: Record<number, string>, team: any) => {
      acc[team.id] = team.short_name;
      return acc;
    }, {});

    // Get next 5 gameweeks
    const currentGameweek = Math.min(...fixtures.map(f => f.event || 38));
    const nextGameweeks = Array.from(
      { length: 5 },
      (_, i) => currentGameweek + i
    );

    const getPlayerFixtures = (player: Player) => {
      return nextGameweeks.map(gw => {
        const fixture = fixtures.find(f => 
          f.event === gw && 
          (f.team_h === player.team || f.team_a === player.team)
        );
        
        if (!fixture) return null;

        const isHome = fixture.team_h === player.team;
        const opponent = isHome ? fixture.team_a : fixture.team_h;
        return {
          opponent: teamMap[opponent],
          difficulty: fixture.difficulty || 3,
          isHome
        };
      }).filter(f => f !== null);
    };

    const calculatePointsPotential = (player: Player, fixtures: any[]) => {
      const formScore = parseFloat(player.form) * 2;
      const fixtureScore = fixtures.reduce((acc, f) => 
        acc + (5 - f.difficulty), 0
      ) / fixtures.length;
      
      return (formScore + fixtureScore) * 
        (player.minutes > 0 ? 1 : 0.5);
    };

    const suggestedTransfers: TransferSuggestion[] = [];

    // Find potential transfers for each position
    currentPlayers.forEach(currentPlayer => {
      const potentialReplacements = allPlayers.filter(p => 
        p.element_type === currentPlayer.element_type && // Same position
        p.id !== currentPlayer.id && // Not the same player
        p.status !== "i" && // Not injured
        p.minutes > 0 && // Has played
        parseFloat(p.form) > parseFloat(currentPlayer.form) // Better form
      );

      potentialReplacements.forEach(newPlayer => {
        const newPlayerFixtures = getPlayerFixtures(newPlayer);
        const currentPlayerFixtures = getPlayerFixtures(currentPlayer);

        const newPlayerPotential = calculatePointsPotential(
          newPlayer,
          newPlayerFixtures
        );
        const currentPlayerPotential = calculatePointsPotential(
          currentPlayer,
          currentPlayerFixtures
        );

        if (newPlayerPotential > currentPlayerPotential) {
          suggestedTransfers.push({
            inPlayer: newPlayer,
            outPlayer: currentPlayer,
            pointsPotential: newPlayerPotential - currentPlayerPotential,
            difficulty: newPlayerFixtures.reduce((acc, f) => 
              acc + f.difficulty, 0
            ) / newPlayerFixtures.length,
            fixtures: newPlayerFixtures.map(f => 
              `${f.isHome ? 'vs' : '@'} ${f.opponent}`
            )
          });
        }
      });
    });

    return suggestedTransfers
      .sort((a, b) => b.pointsPotential - a.pointsPotential)
      .slice(0, 5);
  }, [currentPlayers, allPlayers, fixtures, teams]);

  if (!suggestions.length) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-primary" />
            <CardTitle>Transfer Suggestions</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No beneficial transfers found at this time. Your team looks well-positioned for upcoming fixtures.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <ArrowRightLeft className="w-5 h-5 text-primary" />
          <div>
            <CardTitle>Suggested Transfers</CardTitle>
            <p className="text-sm text-muted-foreground">
              Based on form and next 5 gameweeks
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {suggestions.map((suggestion, index) => (
            <div
              key={`${suggestion.inPlayer.id}-${suggestion.outPlayer.id}`}
              className={cn(
                "p-4 rounded-lg",
                "bg-gradient-to-br from-card to-muted/10",
                "border border-border/30",
                "transition-all duration-200",
                "hover:shadow-md hover:border-primary/20"
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    +{Math.round(suggestion.pointsPotential)} pts
                  </Badge>
                  <TrendingUp className="w-4 h-4 text-green-500" />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onTransferClick(
                    suggestion.inPlayer,
                    suggestion.outPlayer
                  )}
                >
                  Transfer
                </Button>
              </div>

              <div className="grid grid-cols-[1fr,auto,1fr] gap-2 items-center">
                <div>
                  <div className="font-medium">{suggestion.outPlayer.web_name}</div>
                  <div className="text-sm text-muted-foreground">
                    Form: {suggestion.outPlayer.form}
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-muted-foreground" />

                <div>
                  <div className="font-medium">{suggestion.inPlayer.web_name}</div>
                  <div className="text-sm text-muted-foreground">
                    Form: {suggestion.inPlayer.form}
                  </div>
                </div>
              </div>

              <div className="mt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">
                    Fixture Difficulty
                  </span>
                  <span className="text-xs font-medium">
                    {suggestion.difficulty.toFixed(1)}
                  </span>
                </div>
                <Progress 
                  value={((5 - suggestion.difficulty) / 4) * 100}
                  className={cn(
                    "h-1.5",
                    suggestion.difficulty <= 2.5 ? "bg-green-500" :
                    suggestion.difficulty <= 3.5 ? "bg-yellow-500" :
                    "bg-red-500"
                  )}
                />
              </div>

              <div className="mt-3 flex gap-2 flex-wrap">
                {suggestion.fixtures.map((fixture, i) => (
                  <Badge
                    key={i}
                    variant="secondary"
                    className="text-[10px]"
                  >
                    {fixture}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
