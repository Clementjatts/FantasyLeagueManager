import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeftRight,
  TrendingUp,
  TrendingDown,
  Target,
  Wallet,  
  Zap,
  PiggyBank,
  ShieldAlert,
  AlertTriangle,
  Star,
  ThumbsUp,
  ArrowUpRight,
  Trophy,
  Sparkles,
  Coins,
} from "lucide-react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { getNextFixtures } from "@/lib/fpl-utils";

interface Fixture {
  opponent: string;
  difficulty: number;
  isHome: boolean;
}

interface Player {
  id: number;
  web_name: string;
  element_type: number;
  team: number;
  now_cost: number;
  form: string;
  minutes: number;
  chance_of_playing_next_round: number | null;
  total_points: number;
}

interface TransferSuggestionsProps {
  currentPlayers: Player[];
  allPlayers: Player[];
  fixtures: any[];
  teams: any[];
  budget: number;
  freeTransfers: number;
  onTransfer: (playerId: number) => void;
}

export function TransferSuggestions({
  currentPlayers,
  allPlayers,
  fixtures,
  teams,
  budget,
  freeTransfers,
  onTransfer,
}: TransferSuggestionsProps): JSX.Element {
  type EnhancedPlayer = Omit<Player, 'form'> & {
    priority: number;
    reason: string;
    fixtures: Fixture[];
    form: number;
    price: number;
  };

  type PlayerReplacement = Omit<Player, 'form'> & {
    form: number;
    price: number;
    priceDiff: number;
    valueScore: number;
    fixtures: Fixture[];
    avgDifficulty: number;
  };

  const suggestions = React.useMemo<Array<{
    current: EnhancedPlayer;
    replacements: PlayerReplacement[];
  }>>(() => {
    const outPlayers = currentPlayers
      .map(player => {
        const form = parseFloat(player.form || '0');
        const nextFixtures = getNextFixtures(player.team, fixtures)
          .map(fixture => ({
            opponent: teams.find(t => 
              t.id === (fixture.team_h === player.team ? fixture.team_a : fixture.team_h)
            )?.short_name || '',
            difficulty: fixture.team_h === player.team ? fixture.team_h_difficulty : fixture.team_a_difficulty,
            isHome: fixture.team_h === player.team
          }));

        const avgDifficulty = nextFixtures.reduce((acc, f) => acc + f.difficulty, 0) / nextFixtures.length;
        const price = player.now_cost / 10;
        const minutes = player.minutes || 0;
        const injured = player.chance_of_playing_next_round === 0;

        const priority = injured ? 3 : 
                        (form < 3 && avgDifficulty > 3.5) ? 2 :
                        (minutes < 450 && price > 5.5) ? 2 :
                        form < 4 ? 1 : 0;

        const reason = injured ? "Injured" :
                      (form < 3 && avgDifficulty > 3.5) ? "Poor form & tough fixtures" :
                      (minutes < 450 && price > 5.5) ? "Limited minutes" :
                      form < 4 ? "Underperforming" : "";

        return {
          ...player,
          priority,
          reason,
          fixtures: nextFixtures,
          form,
          price,
        } as EnhancedPlayer;
      })
      .filter(p => p.priority > 0)
      .sort((a, b) => b.priority - a.priority);

    return outPlayers.map(player => {
      const replacements = allPlayers
        .filter(p => 
          p.element_type === player.element_type &&
          p.now_cost <= (budget + player.now_cost) &&
          !currentPlayers.some(cp => cp.id === p.id) &&
          p.chance_of_playing_next_round !== 0
        )
        .map(p => {
          const form = parseFloat(p.form || '0');
          const nextFixtures = getNextFixtures(p.team, fixtures)
            .map(fixture => ({
              opponent: teams.find(t => 
                t.id === (fixture.team_h === p.team ? fixture.team_a : fixture.team_h)
              )?.short_name || '',
              difficulty: fixture.team_h === p.team ? fixture.team_h_difficulty : fixture.team_a_difficulty,
              isHome: fixture.team_h === p.team
            }));

          const avgDifficulty = nextFixtures.reduce((acc, f) => acc + f.difficulty, 0) / nextFixtures.length;
          const price = p.now_cost / 10;
          const priceDiff = price - player.price;
          const fixtureMultiplier = (5 - avgDifficulty) / 2.5; // Convert difficulty (1-5) to multiplier (1.6-0.4)
          const valueScore = (form * fixtureMultiplier) / price;

          return {
            ...p,
            form,
            price,
            priceDiff,
            valueScore,
            fixtures: nextFixtures,
            avgDifficulty,
          } as PlayerReplacement;
        })
        .sort((a, b) => b.valueScore - a.valueScore)
        .slice(0, 3);

      return {
        current: player,
        replacements,
      };
    });
  }, [currentPlayers, allPlayers, fixtures, teams, budget]);

  return (
    <div className="space-y-6">
      {/* Players to Keep Section */}
      <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger className="hover:cursor-help">
                  Players to Keep
                </TooltipTrigger>
                <TooltipContent className="max-w-[300px] p-4">
                  <div className="space-y-2">
                    <p className="font-semibold">Players are kept based on:</p>
                    <ul className="list-disc pl-4 space-y-1 text-sm">
                      <li>Good form (&ge;4.5) and regular starter (&gt;600 mins)</li>
                      <li>Consistent performance (&gt;80 points, &gt;60 mins/game)</li>
                      <li>Excellent form (&ge;6) with decent playing time</li>
                    </ul>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {currentPlayers
              .filter(player => {
                const playerForm = parseFloat(player.form || '0');
                const minutesPerGame = player.minutes / 38; // Assuming 38 game season
                // Enhanced criteria for keeping players
                return (
                  (playerForm >= 4.5 && player.minutes > 600) || // Good form and regular starter
                  (player.total_points > 80 && minutesPerGame > 60) || // Consistent performers
                  (playerForm >= 6 && player.minutes > 270) // In excellent form with decent minutes
                );
              })
              .sort((a, b) => parseFloat(b.form || '0') - parseFloat(a.form || '0'))
              .map(player => {
                const playerFixtures = fixtures
                  .filter(f => f.team_h === player.team || f.team_a === player.team)
                  .slice(0, 3);
                const form = parseFloat(player.form || '0');
                const avgDifficulty = playerFixtures.reduce((acc, f) => 
                  acc + (f.team_h === player.team ? f.team_h_difficulty : f.team_a_difficulty), 0
                ) / playerFixtures.length;
                const minutesPerGame = player.minutes / 38;

                return (
                  <div key={player.id} className="relative p-4 rounded-lg border bg-white hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold">{player.web_name}</div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge variant={form >= 6 ? "default" : "secondary"} className="ml-2">
                              {form.toFixed(1)}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>Form rating</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <Zap className="h-4 w-4 mr-1" />
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <span>{minutesPerGame.toFixed(0)} mins/game</span>
                            </TooltipTrigger>
                            <TooltipContent>Average minutes per game</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>

                      <div className="flex items-center text-sm text-gray-600">
                        <Trophy className="h-4 w-4 mr-1" />
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <span>{player.total_points} pts</span>
                            </TooltipTrigger>
                            <TooltipContent>Total points this season</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>

                      <div className="flex items-center text-sm text-gray-600">
                        <Target className="h-4 w-4 mr-1" />
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <span>FDR: {avgDifficulty.toFixed(1)}</span>
                            </TooltipTrigger>
                            <TooltipContent>Fixture Difficulty Rating (next 3 games)</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>

                    {form >= 6 && (
                      <div className="absolute -top-2 -right-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Sparkles className="h-5 w-5 text-yellow-500" />
                            </TooltipTrigger>
                            <TooltipContent>In excellent form!</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>

      {/* Transfer Suggestions Section */}
      <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowUpRight className="h-5 w-5 text-purple-500" />
            Recommended Transfers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {suggestions.map(({ current, replacements }) => (
              replacements.slice(0, 3).map((replacement) => (
                <div key={replacement.id} className="group relative">
                  <div className="flex flex-col p-4 rounded-lg bg-white shadow-sm hover:shadow-md transition-all border border-purple-100">
                    <div className="flex items-center gap-3 mb-3">
                      <ArrowLeftRight className="h-4 w-4 text-purple-500" />
                      <div>
                        <p className="font-medium">{replacement.web_name}</p>
                        <p className="text-sm text-muted-foreground">
                          Replace: {current.web_name}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {replacement.form > current.form && (
                          <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            Better Form
                          </Badge>
                        )}
                        {replacement.valueScore > 7 && (
                          <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-purple-200">
                            <PiggyBank className="h-3 w-3 mr-1" />
                            Value Pick
                          </Badge>
                        )}
                        <Badge variant="secondary" className={cn(
                          "border",
                          replacement.priceDiff > 0 
                            ? "bg-red-50 text-red-700 border-red-200"
                            : "bg-green-50 text-green-700 border-green-200"
                        )}>
                          <Coins className="h-3 w-3 mr-1" />
                          £{Math.abs(replacement.priceDiff).toFixed(1)}m {replacement.priceDiff > 0 ? "more" : "less"}
                        </Badge>
                      </div>
                      
                      <div className="text-xs text-muted-foreground">
                        <p className="font-medium mb-1">Next Fixtures:</p>
                        <div className="flex gap-1">
                          {replacement.fixtures.map((fixture, idx) => (
                            <Badge 
                              key={idx}
                              variant={fixture.difficulty <= 2 ? "success" : fixture.difficulty >= 4 ? "destructive" : "secondary"}
                              className="h-5"
                            >
                              {fixture.opponent}
                              {fixture.isHome ? " (H)" : " (A)"}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-3 flex items-center justify-between">
                      <Progress value={replacement.valueScore * 10} className="flex-1 mr-3" />
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => onTransfer(replacement.id)}
                        className="hover:bg-purple-50"
                      >
                        Transfer
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
