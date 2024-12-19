import { useMemo } from "react";
import { type Player } from "../types/fpl";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge"; // Import Badge component

interface CaptainSuggestionsProps {
  allPlayers: Player[];
  fixtures: any[];
  teams: any;
  onSelectCaptain: (player: Player) => void;
  currentCaptainId?: number;
  currentViceCaptainId?: number;
}

interface TeamData {
  id: number;
  short_name: string;
}

const CaptainSuggestions: React.FC<CaptainSuggestionsProps> = ({
  allPlayers,
  fixtures,
  teams,
  onSelectCaptain,
  currentCaptainId,
  currentViceCaptainId
}) => {
  // Calculate player scores based on form and upcoming fixture difficulty
  const viableCaptains = useMemo(() => {
    if (!fixtures || !teams) {
      console.log("Missing data:", { fixtures: !!fixtures, teams: !!teams });
      return [];
    }

    // Create team mapping
    const teamMap = teams.reduce((acc: Record<number, string>, team: TeamData) => {
      acc[team.id] = team.short_name;
      return acc;
    }, {});

    // Get next gameweek's fixtures
    const nextGameweek = Math.min(...fixtures.map(f => f.event || 38));
    const nextFixtures = fixtures.filter(f => f.event === nextGameweek);

    console.log("Processing fixtures:", {
      nextGameweek,
      fixturesCount: nextFixtures.length,
      teamMap
    });

    return allPlayers
      .filter(p => p.minutes > 0) // Only players who have played
      .map(player => {
        const nextFixture = nextFixtures.find(f => 
          f.team_h === player.team || f.team_a === player.team
        );
        
        if (!nextFixture) {
          console.log("No fixture found for player:", player.web_name);
          return null;
        }

        const isHome = nextFixture.team_h === player.team;
        const opponent = isHome ? nextFixture.team_a : nextFixture.team_h;
        const difficulty = nextFixture.difficulty || 3;
        const opponentName = teamMap[opponent];
        
        if (!opponentName) {
          console.log("No team name found for opponent:", opponent);
          return null;
        }

        // Calculate captain score based on form and fixture difficulty
        const captainScore = 
          parseFloat(player.form) * 2 + 
          parseFloat(player.points_per_game) - 
          (difficulty / 2);

        return {
          ...player,
          nextOpponent: opponent,
          isHome,
          captainScore,
          difficulty,
          opponentName
        };
      })
      .filter((p): p is NonNullable<typeof p> => p !== null)
      .sort((a, b) => b.captainScore - a.captainScore)
      .slice(0, 5);
  }, [allPlayers, fixtures, teams]);

  console.log("Viable captains:", viableCaptains.length);

  return (
    <div className="bg-card rounded-xl p-4 shadow-lg border border-border h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold bg-gradient-to-r from-primary to-primary/80 text-transparent bg-clip-text">
          Captain Picks
        </h3>
        <span className="px-3 py-1 rounded-full text-sm font-semibold bg-primary/10 text-primary">
          Top {viableCaptains.length}
        </span>
      </div>

      <div className="space-y-3">
        {viableCaptains.map((player, index) => (
          <div
            key={index}
            onClick={() => onSelectCaptain(player)}
            className="bg-muted/50 rounded-lg p-3 border border-border/50 hover:border-primary/30 transition-colors cursor-pointer"
          >
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-primary font-medium">{player.web_name}</span>
                {player.id === currentCaptainId && (
                  <Badge variant="default" className="bg-primary/20 text-primary text-xs">C</Badge>
                )}
                {player.id === currentViceCaptainId && (
                  <Badge variant="default" className="bg-primary/20 text-primary text-xs">VC</Badge>
                )}
                <span className="text-muted-foreground text-sm">
                  ({player.total_points} pts)
                </span>
              </div>
              <div className="px-2 py-1 rounded-md bg-primary/10 text-primary text-sm">
                x2
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="bg-background/50 rounded-md p-2 text-center">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <p className="text-muted-foreground text-xs mb-1">Form</p>
                        <p className="text-foreground font-semibold">{player.form}</p>
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
                        <p className="text-muted-foreground text-xs mb-1">PPG</p>
                        <p className="text-foreground font-semibold">{player.points_per_game}</p>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Average points per game this season</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="bg-background/50 rounded-md p-2 text-center">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <p className="text-muted-foreground text-xs mb-1">Selected</p>
                        <p className="text-foreground font-semibold">{player.selected_by_percent}%</p>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Percentage of teams that have selected this player</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            <div className="mt-2 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-1">
                <span className="text-muted-foreground">Next:</span>
                <div className="flex space-x-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span
                          className={cn(
                            "px-1.5 py-0.5 rounded",
                            player.difficulty <= 2 ? "bg-green-500/20 text-green-400" :
                            player.difficulty === 3 ? "bg-primary/20 text-primary" :
                            "bg-destructive/20 text-destructive"
                          )}
                        >
                          {player.opponentName}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Fixture difficulty: {
                          player.difficulty <= 2 ? 'Easy' :
                          player.difficulty === 3 ? 'Moderate' :
                          'Difficult'
                        }</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-muted-foreground">
                      {player.minutes > 630 ? '🟢' : 
                       player.minutes > 450 ? '🟡' : '🔴'} 
                      {Math.round((player.minutes / 90) / 8 * 100)}% starts
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Percentage of matches started in the last 8 gameweeks</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CaptainSuggestions;
