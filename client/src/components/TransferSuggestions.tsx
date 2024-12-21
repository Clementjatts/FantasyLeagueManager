import { useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TransferSuggestionProps {
  currentPlayers: any[];
  allPlayers: any[];
  fixtures: any[];
  teams: any[];
  onTransferClick: (inPlayer: any, outPlayer: any) => void;
}

interface TransferSuggestion {
  inPlayer: any;
  outPlayer: any;
  pointsPotential: number;
  difficulty: number;
  fixtures: any[];
  xG: number;
  xA: number;
  priceChange: number;
  rotationRisk: number;
  ownership: number;
  transferScore: number;
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

    console.log("Current Players:", currentPlayers);
    console.log("All Players:", allPlayers);

    const teamMap = teams.reduce((acc: Record<number, string>, team: any) => {
      acc[team.id] = team.short_name;
      return acc;
    }, {});

    // Get next 8 gameweeks for better long-term analysis
    const currentGameweek = Math.min(...fixtures.map(f => f.event || 38));
    const nextGameweeks = Array.from(
      { length: 8 },
      (_, i) => currentGameweek + i
    );

    const getPlayerFixtures = (player: any) => {
      return nextGameweeks.map(gw => {
        const fixture = fixtures.find(f => 
          f.event === gw && 
          (f.team_h === player.team || f.team_a === player.team)
        );
        
        if (!fixture) return null;

        const isHome = fixture.team_h === player.team;
        const opponent = isHome ? fixture.team_a : fixture.team_h;
        const opponentTeam = teams.find(t => t.id === opponent);
        
        return {
          opponent: teamMap[opponent],
          difficulty: fixture.difficulty || 3,
          isHome,
          event: gw,
          opponentStrength: isHome ? 
            opponentTeam?.strength_attack_away || 3 : 
            opponentTeam?.strength_attack_home || 3
        };
      }).filter(f => f !== null);
    };

    const startingXI = currentPlayers.filter(player => player.position <= 11);
    console.log("Starting XI:", startingXI);

    // Evaluate each starting player
    const playerEvaluations = startingXI.map(player => {
      const predictedPoints = player.points_per_game ? parseFloat(player.points_per_game) * 4 : 0;
      return { player, predictedPoints };
    }).sort((a, b) => a.predictedPoints - b.predictedPoints);

    console.log("Player Evaluations:", playerEvaluations);

    // Find replacements for the bottom 4 performers
    const weakPerformers = playerEvaluations.slice(0, 4);
    console.log("Weak Performers:", weakPerformers);

    const suggestedTransfers: TransferSuggestion[] = [];

    weakPerformers.forEach(({ player: currentPlayer, predictedPoints: currentPoints }) => {
      const potentialReplacements = allPlayers.filter(p => 
        p.element_type === currentPlayer.element_type &&
        p.id !== currentPlayer.id &&
        !currentPlayers.some(cp => cp.id === p.id) &&
        p.status !== "i" && // Filter out injured players
        p.minutes > 180 && // Played at least 2 games
        p.now_cost <= currentPlayer.now_cost + 20 // Within budget (+2.0m)
      );

      potentialReplacements.forEach(newPlayer => {
        const newPlayerFixtures = getPlayerFixtures(newPlayer);
        const form = parseFloat(newPlayer.form || '0');
        const minutesPlayed = newPlayer.minutes || 0;
        const gamesPlayed = minutesPlayed / 90;
        
        // Calculate predicted points using multiple factors
        const pointsPerGame = parseFloat(newPlayer.points_per_game || '0');
        const formFactor = form > 5 ? 1.2 : form > 3 ? 1.1 : 1;
        const minutesFactor = gamesPlayed > 7 ? 1.2 : gamesPlayed > 4 ? 1.1 : 1;
        
        const newPlayerPrediction = pointsPerGame * 4 * formFactor * minutesFactor;
        const pointsDifference = newPlayerPrediction - currentPoints;

        // Calculate fixture difficulty
        const fixtureDifficulty = newPlayerFixtures.reduce((acc, f) => acc + f.difficulty, 0) / newPlayerFixtures.length;
        const fixtureBonus = fixtureDifficulty < 2.5 ? 1.2 : fixtureDifficulty < 3 ? 1.1 : 1;

        // Require meaningful improvement
        if (pointsDifference > 2) {
          const rotationRisk = Math.max(0, 100 - (minutesPlayed / 8)); // Based on last 8 games
          const xG = form * (newPlayer.element_type === 4 ? 0.45 : 
                           newPlayer.element_type === 3 ? 0.3 : 0.1);
          const xA = form * (newPlayer.element_type === 3 ? 0.35 :
                           newPlayer.element_type === 4 ? 0.25 : 0.15);

          const transferScore = (
            (pointsDifference * 5) +
            (xG * 10) +
            (xA * 8) +
            ((100 - rotationRisk) * 0.2) +
            ((5 - fixtureDifficulty) * 5)
          ) * fixtureBonus;

          suggestedTransfers.push({
            inPlayer: newPlayer,
            outPlayer: currentPlayer,
            pointsPotential: Math.round(pointsDifference),
            difficulty: fixtureDifficulty,
            fixtures: newPlayerFixtures,
            xG,
            xA,
            priceChange: (newPlayer.now_cost - currentPlayer.now_cost) || 0,
            rotationRisk,
            ownership: parseFloat(newPlayer.selected_by_percent || '0'),
            transferScore
          });
        }
      });
    });

    console.log("Suggested Transfers:", suggestedTransfers);

    return suggestedTransfers
      .sort((a, b) => b.transferScore - a.transferScore)
      .slice(0, 5);
  }, [currentPlayers, allPlayers, fixtures, teams]);

  if (!suggestions.length) {
    return (
      <div className="bg-card rounded-xl p-4 shadow-lg border border-border h-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold bg-gradient-to-r from-primary to-primary/80 text-transparent bg-clip-text">
            Recommended Transfers
          </h3>
          <span className="px-3 py-1 rounded-full text-sm font-semibold bg-primary/10 text-primary">
            No suggestions
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          No beneficial transfers found at this time. Your team looks well-positioned for upcoming fixtures.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl p-4 shadow-lg border border-border h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold bg-gradient-to-r from-primary to-primary/80 text-transparent bg-clip-text">
          Recommended Transfers
        </h3>
        <span className="px-3 py-1 rounded-full text-sm font-semibold bg-primary/10 text-primary">
          Top {suggestions.length}
        </span>
      </div>

      <div className="space-y-3">
        {suggestions.map((suggestion, index) => (
          <div
            key={index}
            className="bg-muted/50 rounded-lg p-3 border border-border/50 hover:border-primary/30 transition-colors cursor-pointer"
            onClick={() => onTransferClick(suggestion.inPlayer, suggestion.outPlayer)}
          >
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-muted-foreground text-sm">OUT</span>
                <span className="text-destructive">{suggestion.outPlayer.web_name}</span>
                <span className="text-xs text-muted-foreground">
                  (£{(suggestion.outPlayer.now_cost / 10).toFixed(1)}m)
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-muted-foreground">
                  (£{(suggestion.inPlayer.now_cost / 10).toFixed(1)}m)
                </span>
                <span className="text-primary">{suggestion.inPlayer.web_name}</span>
                <span className="text-muted-foreground text-sm">IN</span>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="bg-background/50 rounded-md p-2 text-center">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <p className="text-muted-foreground text-xs mb-1">Points</p>
                        <p className="text-primary font-semibold">+{suggestion.pointsPotential}</p>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Predicted additional points over next 4 gameweeks</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="bg-background/50 rounded-md p-2 text-center">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <p className="text-muted-foreground text-xs mb-1">Form</p>
                        <p className="text-foreground font-semibold">{suggestion.inPlayer.form}</p>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Average points over the last 4 gameweeks</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="bg-background/50 rounded-md p-2 text-center">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <p className="text-muted-foreground text-xs mb-1">Price</p>
                        <p className={cn(
                          "font-semibold",
                          suggestion.priceChange >= 0 ? "text-primary" : "text-destructive"
                        )}>
                          {suggestion.priceChange >= 0 ? '+' : ''}{(suggestion.priceChange / 10).toFixed(1)}
                        </p>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Price difference between players</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            <div className="mt-2 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-1">
                <span className="text-muted-foreground">Fixtures:</span>
                <div className="flex space-x-1">
                  {suggestion.fixtures.slice(0, 3).map((fixture, idx) => (
                    <span
                      key={idx}
                      className={cn(
                        "px-1.5 py-0.5 rounded",
                        fixture.difficulty <= 2 ? "bg-green-500/20 text-green-400" :
                        fixture.difficulty === 3 ? "bg-primary/20 text-primary" :
                        "bg-destructive/20 text-destructive"
                      )}
                    >
                      {fixture.opponent}
                    </span>
                  ))}
                </div>
              </div>
              <span className="text-muted-foreground">
                {suggestion.rotationRisk < 25 ? '🟢' : suggestion.rotationRisk < 50 ? '🟡' : '🔴'} 
                {Math.round(100 - suggestion.rotationRisk)}% starts
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
