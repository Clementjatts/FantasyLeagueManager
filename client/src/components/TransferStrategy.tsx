import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  TrendingDown,
  TrendingUp,
  AlertCircle,
  PiggyBank,
  Coins,
  Info,
  Calendar,
  Target,
  ArrowRight,
  ChevronUp,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface TransferStrategyProps {
  team: any;
  players: any[];
  fixtures: any[];
  teams: any[];
  freeTransfers: number;
  teamValue: number;
  bankBalance: number;
}

interface PlayerAnalysis {
  player: any;
  upcomingFixtures: any[];
  fixturesDifficulty: number;
  form: number;
  priceChange: number;
  sellValue: number;
  expectedPoints: number;
  shouldSell: boolean;
  sellReason: string;
}

export function TransferStrategy({
  team,
  players,
  fixtures,
  teams,
  freeTransfers,
  teamValue,
  bankBalance,
}: TransferStrategyProps) {
  const analysis = useMemo(() => {
    if (!team || !players || !fixtures || !teams) return null;

    // Get next 5 gameweeks
    const currentGameweek = Math.min(...fixtures.map(f => f.event || 38));
    const nextGameweeks = Array.from(
      { length: 5 },
      (_, i) => currentGameweek + i
    );

    // Analyze each player in the team
    const playerAnalysis: PlayerAnalysis[] = team.picks.map((pick: any) => {
      const player = players.find(p => p.id === pick.element);
      if (!player) return null;

      // Get upcoming fixtures
      const upcomingFixtures = nextGameweeks.map(gw => {
        return fixtures.find(f => 
          f.event === gw && 
          (f.team_h === player.team || f.team_a === player.team)
        );
      }).filter(f => f);

      // Calculate average fixture difficulty
      const fixturesDifficulty = upcomingFixtures.reduce(
        (acc, f) => acc + (f.difficulty || 3), 
        0
      ) / upcomingFixtures.length;

      const form = parseFloat(player.form || '0');
      const priceChange = player.cost_change_event || 0;
      const sellValue = player.now_cost / 10;
      
      // Calculate expected points based on form and fixtures
      const expectedPoints = form * (
        fixturesDifficulty <= 2 ? 1.2 :
        fixturesDifficulty <= 3 ? 1 :
        0.8
      ) * 4; // 4 gameweeks projection

      // Determine if player should be sold
      const shouldSell = (
        (form < 3 && fixturesDifficulty > 3) || // Poor form and difficult fixtures
        (priceChange < -1 && form < 4) || // Dropping price and mediocre form
        (expectedPoints < 10 && sellValue > 6) // Low expected points for expensive player
      );

      // Generate sell reason
      let sellReason = '';
      if (shouldSell) {
        if (form < 3 && fixturesDifficulty > 3) {
          sellReason = 'Poor form and difficult upcoming fixtures';
        } else if (priceChange < -1 && form < 4) {
          sellReason = 'Price dropping and underperforming';
        } else if (expectedPoints < 10 && sellValue > 6) {
          sellReason = 'Low expected returns for price';
        }
      }

      return {
        player,
        upcomingFixtures,
        fixturesDifficulty,
        form,
        priceChange,
        sellValue,
        expectedPoints,
        shouldSell,
        sellReason
      };
    }).filter(Boolean);

    // Find potential replacements for players to sell
    const replacementSuggestions = playerAnalysis
      .filter(pa => pa.shouldSell)
      .map(pa => {
        const replacements = players
          .filter(p => 
            p.element_type === pa.player.element_type && // Same position
            p.now_cost <= (pa.sellValue * 10) + (bankBalance * 10) && // Within budget
            p.form > pa.form && // Better form
            !team.picks.some((pick: any) => pick.element === p.id) // Not already in team
          )
          .map(p => ({
            player: p,
            fixturesDifficulty: nextGameweeks
              .map(gw => fixtures.find(f => 
                f.event === gw && 
                (f.team_h === p.team || f.team_a === p.team)
              ))
              .filter(Boolean)
              .reduce((acc, f) => acc + (f.difficulty || 3), 0) / 5,
            form: parseFloat(p.form || '0'),
            price: p.now_cost / 10,
            priceDiff: (p.now_cost - pa.player.now_cost) / 10
          }))
          .sort((a, b) => 
            (b.form / b.fixturesDifficulty) - (a.form / a.fixturesDifficulty)
          )
          .slice(0, 3);

        return {
          sellPlayer: pa,
          replacements
        };
      });

    // Determine if transfers should be used or saved
    const urgentTransfers = playerAnalysis.filter(pa => 
      pa.shouldSell && 
      (pa.form < 2 || pa.fixturesDifficulty > 4)
    ).length;

    const shouldUseTransfers = 
      urgentTransfers > 0 || // Has urgent transfers needed
      (freeTransfers === 2 && playerAnalysis.some(pa => pa.shouldSell)) || // Max free transfers and has improvements
      (freeTransfers === 1 && urgentTransfers > 0); // One free transfer and urgent need

    return {
      playerAnalysis,
      replacementSuggestions,
      shouldUseTransfers,
      urgentTransfers,
      averageTeamForm: playerAnalysis.reduce((acc, pa) => acc + pa.form, 0) / playerAnalysis.length,
      averageFixtureDifficulty: playerAnalysis.reduce((acc, pa) => acc + pa.fixturesDifficulty, 0) / playerAnalysis.length
    };
  }, [team, players, fixtures, teams, freeTransfers, teamValue, bankBalance]);

  if (!analysis) {
    return null;
  }

  // Calculate projected team value
  const calculateProjectedValue = () => {
    let totalProjectedValue = teamValue;
    let riskPlayers: { name: string; risk: number }[] = [];
    let growthPlayers: { name: string; potential: number }[] = [];

    analysis.playerAnalysis.forEach(pa => {
      const player = pa.player;
      const form = parseFloat(player.form || '0');
      const ownership = parseFloat(player.selected_by_percent || '0');
      const priceChange = player.cost_change_event || 0;
      
      let projectedChange = 0;
      
      if (form > 6 && ownership > 20) {
        projectedChange += 0.2;
      } else if (form > 4 && ownership > 15) {
        projectedChange += 0.1;
      }
      
      if (priceChange > 0) {
        projectedChange += 0.1;
      } else if (priceChange < 0) {
        projectedChange -= 0.1;
      }
      
      if (form > 5 && ownership < 10) {
        growthPlayers.push({
          name: player.web_name,
          potential: projectedChange + 0.2
        });
      }
      
      if (form < 3 && ownership > 20) {
        riskPlayers.push({
          name: player.web_name,
          risk: -0.2
        });
      }
      
      totalProjectedValue += projectedChange;
    });

    return {
      totalProjectedValue: totalProjectedValue.toFixed(1),
      currentValue: teamValue.toFixed(1),
      riskPlayers,
      growthPlayers
    };
  };

  const projection = calculateProjectedValue();
  const valueDifference = parseFloat(projection.totalProjectedValue) - teamValue;

  return (
    <Card className="relative overflow-hidden group">
      {/* Premium ambient effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none opacity-70" />
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.07] via-transparent to-primary/[0.07] pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
      <div className="absolute top-0 left-0 w-px h-full bg-gradient-to-b from-primary/20 via-transparent to-primary/20" />
      <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-primary/20 via-transparent to-primary/20" />
      
      <CardHeader className="relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
              <div className="relative bg-gradient-to-br from-primary/30 to-primary/10 p-2 rounded-xl backdrop-blur-sm border border-primary/20">
                <Target className="w-5 h-5 text-primary" />
              </div>
            </div>
            <div>
              <CardTitle className="text-xl bg-gradient-to-br from-foreground to-foreground/80 text-transparent bg-clip-text">
                Transfer Strategy & Value Forecast
              </CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <Calendar className="w-3.5 h-3.5" />
                Analysis for the next 5 gameweeks
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="group/badge relative">
                    <div className="absolute inset-0 bg-primary/20 blur-sm rounded-full transition-all group-hover/badge:bg-primary/30" />
                    <Badge variant="outline" className="relative font-mono bg-background/50 backdrop-blur-sm border-primary/20">
                      <PiggyBank className="w-4 h-4 mr-1 text-primary" />
                      £{bankBalance.toFixed(1)}m
                    </Badge>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Available transfer budget</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="group/badge relative">
                    <div className="absolute inset-0 bg-primary/20 blur-sm rounded-full transition-all group-hover/badge:bg-primary/30" />
                    <Badge variant="outline" className="relative font-mono bg-background/50 backdrop-blur-sm border-primary/20">
                      <Coins className="w-4 h-4 mr-1 text-primary" />
                      {freeTransfers} FT
                    </Badge>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Free transfers available</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative space-y-6">
        {/* Value Forecast */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            {/* Transfer Recommendation */}
            <div className="group/card relative rounded-xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-background/95 to-background/50 backdrop-blur-sm" />
              <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.07] via-transparent to-primary/[0.07] opacity-0 group-hover/card:opacity-100 transition-opacity" />
              <div className="absolute inset-px rounded-[11px] bg-gradient-to-br from-primary/20 to-transparent opacity-[0.15]" />
              <div className="relative p-4">
                <div className="flex items-start gap-4">
                  {analysis.shouldUseTransfers ? (
                    <>
                      <div className="relative">
                        <div className="absolute inset-0 bg-green-500/30 blur-xl rounded-full" />
                        <div className="relative bg-gradient-to-br from-green-500/30 to-green-500/10 p-2.5 rounded-xl backdrop-blur-sm border border-green-500/20">
                          <TrendingUp className="w-6 h-6 text-green-500" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold bg-gradient-to-br from-foreground to-foreground/80 text-transparent bg-clip-text flex items-center gap-2">
                          Use Your Transfers
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Recommended actions based on team analysis</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {analysis.urgentTransfers > 0
                            ? `You have ${analysis.urgentTransfers} player${
                                analysis.urgentTransfers > 1 ? "s" : ""
                              } that need urgent attention.`
                            : "You can improve your team with the available transfers."}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="relative">
                        <div className="absolute inset-0 bg-primary/30 blur-xl rounded-full" />
                        <div className="relative bg-gradient-to-br from-primary/30 to-primary/10 p-2.5 rounded-xl backdrop-blur-sm border border-primary/20">
                          <PiggyBank className="w-6 h-6 text-primary" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold bg-gradient-to-br from-foreground to-foreground/80 text-transparent bg-clip-text flex items-center gap-2">
                          Save Your Transfer
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Your team looks well-positioned for upcoming fixtures</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Consider rolling the transfer to have more flexibility next week.
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="group/card relative rounded-xl overflow-hidden cursor-help">
                    <div className="absolute inset-0 bg-gradient-to-br from-background/95 to-background/50 backdrop-blur-sm" />
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.07] via-transparent to-primary/[0.07] opacity-0 group-hover/card:opacity-100 transition-opacity" />
                    <div className="absolute inset-px rounded-[11px] bg-gradient-to-br from-primary/20 to-transparent opacity-[0.15]" />
                    <div className="relative p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">Team Value</p>
                        <Badge variant={valueDifference > 0 ? "default" : "destructive"} className="font-mono bg-background/50 backdrop-blur-sm">
                          {valueDifference > 0 ? "+" : ""}£{valueDifference.toFixed(1)}m
                        </Badge>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <p className="text-2xl font-bold bg-gradient-to-br from-foreground to-foreground/80 text-transparent bg-clip-text">
                          £{projection.currentValue}m
                        </p>
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                        <p className="text-2xl font-bold bg-gradient-to-br from-primary to-primary/80 text-transparent bg-clip-text">
                          £{projection.totalProjectedValue}m
                        </p>
                      </div>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Projected team value change over next 5 gameweeks</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <div className="grid grid-cols-2 gap-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="group/card relative rounded-xl overflow-hidden cursor-help">
                      <div className="absolute inset-0 bg-gradient-to-br from-background/95 to-background/50 backdrop-blur-sm" />
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.07] via-transparent to-primary/[0.07] opacity-0 group-hover/card:opacity-100 transition-opacity" />
                      <div className="absolute inset-px rounded-[11px] bg-gradient-to-br from-primary/20 to-transparent opacity-[0.15]" />
                      <div className="relative p-4 space-y-2">
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <Target className="w-4 h-4" />
                          Form
                        </p>
                        <p className="text-lg font-semibold bg-gradient-to-br from-foreground to-foreground/80 text-transparent bg-clip-text">
                          {analysis.averageTeamForm.toFixed(1)}
                        </p>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Average form of your starting XI</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="group/card relative rounded-xl overflow-hidden cursor-help">
                      <div className="absolute inset-0 bg-gradient-to-br from-background/95 to-background/50 backdrop-blur-sm" />
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.07] via-transparent to-primary/[0.07] opacity-0 group-hover/card:opacity-100 transition-opacity" />
                      <div className="absolute inset-px rounded-[11px] bg-gradient-to-br from-primary/20 to-transparent opacity-[0.15]" />
                      <div className="relative p-4 space-y-2">
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Difficulty
                        </p>
                        <p className="text-lg font-semibold bg-gradient-to-br from-foreground to-foreground/80 text-transparent bg-clip-text">
                          {analysis.averageFixtureDifficulty.toFixed(1)}
                        </p>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Average difficulty of upcoming fixtures (1-5 scale)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>

        {/* Value Changes */}
        <div className="grid grid-cols-2 gap-4">
          {projection.growthPlayers.length > 0 && (
            <div className="group/card relative rounded-xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-background/95 to-background/50 backdrop-blur-sm" />
              <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.07] via-transparent to-primary/[0.07] opacity-0 group-hover/card:opacity-100 transition-opacity" />
              <div className="absolute inset-px rounded-[11px] bg-gradient-to-br from-primary/20 to-transparent opacity-[0.15]" />
              <div className="relative p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <div className="absolute inset-0 bg-primary/30 blur-lg rounded-full" />
                      <div className="relative bg-gradient-to-br from-primary/30 to-primary/10 p-1.5 rounded-lg backdrop-blur-sm border border-primary/20">
                        <ChevronUp className="w-4 h-4 text-primary" />
                      </div>
                    </div>
                    <p className="text-sm font-medium text-primary">Growth Potential</p>
                  </div>
                  <Badge variant="outline" className="bg-primary/10 border-primary/20">
                    {projection.growthPlayers.length}
                  </Badge>
                </div>
                <ul className="space-y-2">
                  {projection.growthPlayers.slice(0, 3).map((player, idx) => (
                    <li key={idx} className="flex justify-between items-center text-sm">
                      <span className="text-foreground">{player.name}</span>
                      <span className="text-primary font-medium">+£{player.potential.toFixed(1)}m</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {projection.riskPlayers.length > 0 && (
            <div className="group/card relative rounded-xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-background/95 to-background/50 backdrop-blur-sm" />
              <div className="absolute inset-0 bg-gradient-to-br from-destructive/[0.07] via-transparent to-destructive/[0.07] opacity-0 group-hover/card:opacity-100 transition-opacity" />
              <div className="absolute inset-px rounded-[11px] bg-gradient-to-br from-destructive/20 to-transparent opacity-[0.15]" />
              <div className="relative p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <div className="absolute inset-0 bg-destructive/30 blur-lg rounded-full" />
                      <div className="relative bg-gradient-to-br from-destructive/30 to-destructive/10 p-1.5 rounded-lg backdrop-blur-sm border border-destructive/20">
                        <TrendingDown className="w-4 h-4 text-destructive" />
                      </div>
                    </div>
                    <p className="text-sm font-medium text-destructive">Price Drop Risk</p>
                  </div>
                  <Badge variant="outline" className="bg-destructive/10 border-destructive/20 text-destructive">
                    {projection.riskPlayers.length}
                  </Badge>
                </div>
                <ul className="space-y-2">
                  {projection.riskPlayers.slice(0, 3).map((player, idx) => (
                    <li key={idx} className="flex justify-between items-center text-sm">
                      <span className="text-foreground">{player.name}</span>
                      <span className="text-destructive font-medium">{player.risk.toFixed(1)}m</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent opacity-50" />
          <Separator className="relative" />
        </div>

        {/* Players to Consider Selling */}
        {analysis.replacementSuggestions.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-500" />
              Players to Consider Selling
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Players identified as potential transfer targets based on form, fixtures, and price changes</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </h4>
            
            {analysis.replacementSuggestions.map((suggestion, index) => (
              <div key={index} className="space-y-3">
                <div className="flex items-center justify-between bg-gradient-to-br from-card to-muted/50 rounded-lg p-4 border border-border/50 shadow-sm">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">
                        {suggestion.sellPlayer.player.web_name}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        £{suggestion.sellPlayer.sellValue.toFixed(1)}m
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {suggestion.sellPlayer.sellReason}
                    </p>
                  </div>
                  {suggestion.sellPlayer.priceChange < 0 && (
                    <Badge variant="destructive" className="h-fit">
                      <TrendingDown className="w-3 h-3 mr-1" />
                      £{(Math.abs(suggestion.sellPlayer.priceChange) / 10).toFixed(1)}m
                    </Badge>
                  )}
                </div>

                <div className="pl-4 space-y-2">
                  <p className="text-sm font-medium flex items-center gap-2">
                    Recommended Replacements
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Top 3 replacements based on form, fixtures, and price</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </p>
                  {suggestion.replacements.map((replacement, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center justify-between bg-gradient-to-br from-background/50 to-muted/30 rounded-lg p-3 border border-border/50 hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <ArrowRight className="w-4 h-4 text-primary" />
                        <span className="font-medium">
                          {replacement.player.web_name}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          £{replacement.price.toFixed(1)}m
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="outline">
                                Form: {replacement.form}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Average points over last 4 gameweeks</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <span className={cn(
                          "text-sm font-medium",
                          replacement.priceDiff > 0 
                            ? "text-destructive" 
                            : "text-green-500"
                        )}>
                          {replacement.priceDiff > 0 ? "+" : ""}
                          £{replacement.priceDiff.toFixed(1)}m
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
