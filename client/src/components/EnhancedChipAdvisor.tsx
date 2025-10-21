import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Chip, BootstrapStatic, Pick, Team, Player } from "@/types/fpl";
import { cn } from "@/lib/utils";
import { 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Target, 
  Users,
  Activity,
  Zap,
  Shield,
  Clock,
  HelpCircle
} from "lucide-react";
import { useCallback } from "react";

interface ChipAnalysis {
  chip: string;
  label: string;
  score: number;
  priority: 'high' | 'medium' | 'low' | 'none';
  factors: {
    name: string;
    value: number;
    maxValue: number;
    icon: React.ComponentType<{ className?: string }>;
    description: string;
    color: string;
  }[];
  recommendation: string;
  targetGameweeks?: string[];
}

interface EnhancedChipAdvisorProps {
  chips: Chip[];
  currentGameweek?: number;
  bootstrapStatic?: BootstrapStatic;
  team?: Team;
}

export function EnhancedChipAdvisor({ chips, currentGameweek, bootstrapStatic, team }: EnhancedChipAdvisorProps) {
  // Data validation
  const validateInputs = () => {
    if (!bootstrapStatic?.elements || !team?.picks) {
      throw new Error('Missing required bootstrap data or team picks');
    }
    if (currentGameweek && (currentGameweek < 1 || currentGameweek > 38)) {
      throw new Error(`Invalid gameweek: ${currentGameweek}`);
    }
  };

  // Get remaining chips
  const usedChips = new Set(chips.map((c: Chip) => c.name));
  const remainingChips = [
    { name: "wildcard", label: "Wildcard" },
    { name: "freehit", label: "Free Hit" },
    { name: "bboost", label: "Bench Boost" },
    { name: "3xc", label: "Triple Captain" },
    { name: "manager", label: "Assistant Manager" },
  ].filter(c => !usedChips.has(c.name));

  // Memoized player details function
  const getPlayerDetails = useCallback((elementId: number): Player | undefined => {
    return bootstrapStatic?.elements.find(e => e.id === elementId);
  }, [bootstrapStatic?.elements]);

  // Memoized fixture difficulty service
  const getNextFixtures = useCallback((weeksAhead: number) => {
    if (!currentGameweek || !bootstrapStatic) return [];
    return bootstrapStatic.events.filter(e => 
      e.id > currentGameweek && 
      e.id <= currentGameweek + weeksAhead
    );
  }, [currentGameweek, bootstrapStatic]);

  const analyzeWildcard = (): ChipAnalysis => {
    if (!team || !bootstrapStatic) {
      return {
        chip: "wildcard",
        label: "Wildcard",
        score: 0,
        priority: "none",
        factors: [],
        recommendation: "Unable to analyze - missing data"
      };
    }

    // Team Form Analysis
    const startingXI = team.picks.filter(p => p.position <= 11);
    const teamForm = startingXI.reduce((acc, pick) => {
      const player = getPlayerDetails(pick.element);
      return acc + (parseFloat(player?.form || '0'));
    }, 0) / startingXI.length;
    const leagueAverageForm = 4.5;
    const formDifference = Math.max(0, leagueAverageForm - teamForm);

    // Injury Analysis
    const injuredPlayers = team.picks.filter(p => {
      const player = getPlayerDetails(p.element);
      return player && 
             typeof player.chance_of_playing_next_round === 'number' && 
             player.chance_of_playing_next_round < 75;
    }).length;

    // Deadwood Detection
    const deadwoodPlayers = team.picks.filter(p => {
      const player = getPlayerDetails(p.element);
      if (!player) return false;
      const minutesPerGame = parseFloat(player.minutes_per_game || '0');
      const pointsPerGame = parseFloat(player.points_per_game || '0');
      return minutesPerGame < 30 && pointsPerGame < 2;
    }).length;

    // Fixture Difficulty Swing
    const next5GWs = getNextFixtures(5);
    const currentFDR = next5GWs.slice(0, 2).reduce((acc, gw) => acc + (gw.difficulty || 3), 0) / 2;
    const futureFDR = next5GWs.slice(2, 5).reduce((acc, gw) => acc + (gw.difficulty || 3), 0) / 3;
    const fdrSwing = Math.max(0, currentFDR - futureFDR);

    // Price Changes
    const priceChanges = team.picks.reduce((acc, pick) => {
      const player = getPlayerDetails(pick.element);
      return acc + Math.abs(player?.cost_change_event_fall || 0);
    }, 0);

    const factors = [
      {
        name: "Team Form",
        value: Math.min(formDifference * 2, 10),
        maxValue: 10,
        icon: TrendingDown,
        description: `Your team form (${teamForm.toFixed(1)}) vs league average (${leagueAverageForm})`,
        color: formDifference > 1 ? "text-red-500" : "text-green-500"
      },
      {
        name: "Injuries & Doubts",
        value: Math.min(injuredPlayers, 5),
        maxValue: 5,
        icon: AlertTriangle,
        description: `${injuredPlayers} players with injury concerns`,
        color: "text-orange-500"
      },
      {
        name: "Deadwood Players",
        value: Math.min(deadwoodPlayers, 4),
        maxValue: 4,
        icon: Users,
        description: `${deadwoodPlayers} players with minimal minutes/points`,
        color: "text-gray-500"
      },
      {
        name: "Fixture Swing",
        value: Math.min(fdrSwing * 2, 8),
        maxValue: 8,
        icon: TrendingUp,
        description: `FDR improvement from ${currentFDR.toFixed(1)} to ${futureFDR.toFixed(1)}`,
        color: "text-blue-500"
      },
      {
        name: "Price Changes",
        value: Math.min(priceChanges, 10),
        maxValue: 10,
        icon: Activity,
        description: `Total price changes: ${priceChanges}`,
        color: "text-purple-500"
      }
    ];

    const totalScore = factors.reduce((acc, factor) => acc + factor.value, 0);
    const priority = totalScore > 15 ? "high" : totalScore > 10 ? "medium" : totalScore > 5 ? "low" : "none";

    return {
      chip: "wildcard",
      label: "Wildcard",
      score: totalScore,
      priority,
      factors,
      recommendation: priority === "high" 
        ? "Strong wildcard opportunity - multiple factors suggest team overhaul needed"
        : priority === "medium"
        ? "Consider wildcard - some factors indicate potential benefits"
        : "Hold wildcard - current team structure appears stable"
    };
  };

  const analyzeFreeHit = (): ChipAnalysis => {
    if (!team || !bootstrapStatic || !currentGameweek) {
      return {
        chip: "freehit",
        label: "Free Hit",
        score: 0,
        priority: "none",
        factors: [],
        recommendation: "Unable to analyze - missing data"
      };
    }

    // Gameweek Anomaly Detection
    const allFixtures = bootstrapStatic.fixtures || [];
    const nextGW = getNextFixtures(1)[0];
    const nextGWFixtures = allFixtures.filter(f => f.event === nextGW?.id);
    
    const teamsWithFixtures = new Set();
    nextGWFixtures.forEach(fixture => {
      teamsWithFixtures.add(fixture.team_h);
      teamsWithFixtures.add(fixture.team_a);
    });
    
    const teamsWithBlanks = bootstrapStatic.teams.filter(team => 
      !teamsWithFixtures.has(team.id)
    ).length;
    
    const teamAppearances = new Map<number, number>();
    nextGWFixtures.forEach(fixture => {
      teamAppearances.set(fixture.team_h, (teamAppearances.get(fixture.team_h) || 0) + 1);
      teamAppearances.set(fixture.team_a, (teamAppearances.get(fixture.team_a) || 0) + 1);
    });
    
    const teamsWithDoubles = Array.from(teamAppearances.values()).filter(count => count > 1).length;
    
    const userPlayersWithoutFixtures = team.picks.filter(p => {
      const player = getPlayerDetails(p.element);
      return player && !teamsWithFixtures.has(player.team);
    }).length;

    const factors = [
      {
        name: "Blank Gameweek",
        value: Math.min(teamsWithBlanks, 6),
        maxValue: 6,
        icon: Shield,
        description: `${teamsWithBlanks} teams without fixtures`,
        color: "text-red-500"
      },
      {
        name: "Double Gameweek",
        value: Math.min(teamsWithDoubles, 4),
        maxValue: 4,
        icon: Zap,
        description: `${teamsWithDoubles} teams with double fixtures`,
        color: "text-green-500"
      },
      {
        name: "Your Affected Players",
        value: Math.min(userPlayersWithoutFixtures, 8),
        maxValue: 8,
        icon: Users,
        description: `${userPlayersWithoutFixtures} of your players affected`,
        color: "text-orange-500"
      }
    ];

    const totalScore = factors.reduce((acc, factor) => acc + factor.value, 0);
    const priority = totalScore > 8 ? "high" : totalScore > 5 ? "medium" : totalScore > 2 ? "low" : "none";

    return {
      chip: "freehit",
      label: "Free Hit",
      score: totalScore,
      priority,
      factors,
      recommendation: priority === "high" 
        ? "Excellent free hit opportunity - significant gameweek anomalies detected"
        : priority === "medium"
        ? "Good free hit opportunity - some gameweek anomalies present"
        : "Save free hit - no significant gameweek anomalies"
    };
  };

  const analyzeTripleCaptain = (): ChipAnalysis => {
    if (!team || !bootstrapStatic || !currentGameweek) {
      return {
        chip: "3xc",
        label: "Triple Captain",
        score: 0,
        priority: "none",
        factors: [],
        recommendation: "Unable to analyze - missing data"
      };
    }

    // Find best captain candidate
    const allPlayers = team.picks.map(p => ({
      pick: p,
      player: getPlayerDetails(p.element)
    })).filter(item => item.player);
    
    let bestCandidate = null;
    let bestScore = 0;
    
    allPlayers.forEach(({ pick, player }) => {
      if (!player) return;
      
      const form = parseFloat(player.form) || 0;
      const expectedGoals = player.expected_goals || 0;
      const expectedAssists = player.expected_assists || 0;
      const totalExpected = expectedGoals + expectedAssists;
      
      const threatIndex = parseFloat(player.ict_index_threat || '0');
      const influenceIndex = parseFloat(player.ict_index_influence || '0');
      const explosiveTrait = (threatIndex + influenceIndex) / 2;
      
      const playerScore = Math.min(form, 8) + Math.min(totalExpected * 2, 5) + Math.min(explosiveTrait / 10, 3);
      
      if (playerScore > bestScore) {
        bestScore = playerScore;
        bestCandidate = { pick, player, form, totalExpected, explosiveTrait };
      }
    });

    if (!bestCandidate) {
      return {
        chip: "3xc",
        label: "Triple Captain",
        score: 0,
        priority: "none",
        factors: [],
        recommendation: "No suitable captain candidates found"
      };
    }

    const factors = [
      {
        name: "Player Form",
        value: Math.min(bestCandidate.form, 8),
        maxValue: 8,
        icon: TrendingUp,
        description: `Form: ${bestCandidate.form.toFixed(1)}`,
        color: "text-green-500"
      },
      {
        name: "Expected Returns",
        value: Math.min(bestCandidate.totalExpected * 2, 5),
        maxValue: 5,
        icon: Target,
        description: `xG + xA: ${bestCandidate.totalExpected.toFixed(2)}`,
        color: "text-blue-500"
      },
      {
        name: "Explosive Potential",
        value: Math.min(bestCandidate.explosiveTrait / 10, 3),
        maxValue: 3,
        icon: Zap,
        description: `ICT Threat + Influence: ${bestCandidate.explosiveTrait.toFixed(1)}`,
        color: "text-purple-500"
      }
    ];

    const totalScore = factors.reduce((acc, factor) => acc + factor.value, 0);
    const priority = totalScore > 10 ? "high" : totalScore > 7 ? "medium" : totalScore > 4 ? "low" : "none";

    return {
      chip: "3xc",
      label: "Triple Captain",
      score: totalScore,
      priority,
      factors,
      recommendation: priority === "high" 
        ? "Excellent triple captain opportunity - elite player with high ceiling"
        : priority === "medium"
        ? "Good triple captain opportunity - solid player with decent potential"
        : "Save triple captain - no standout candidates this week"
    };
  };

  const getBestRecommendation = (): ChipAnalysis => {
    const analyses = [
      analyzeWildcard(),
      analyzeFreeHit(),
      analyzeTripleCaptain()
    ].filter(analysis => remainingChips.some(chip => chip.name === analysis.chip));

    if (analyses.length === 0) {
      return {
        chip: "none",
        label: "All Used",
        score: 0,
        priority: "none",
        factors: [],
        recommendation: "You've used all chips. Focus on transfers and captain choices."
      };
    }

    return analyses.reduce((best, current) => 
      current.score > best.score ? current : best
    );
  };

  const recommendation = getBestRecommendation();

  if (!recommendation) return null;

  return (
    <Card className="bg-gradient-to-br from-primary/5 via-primary/2 to-transparent border-primary/20 hover:border-primary/30 transition-colors shadow-colorhunt">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary animate-pulse" />
            <CardTitle className="text-xl">Enhanced Chip Advisor</CardTitle>
          </div>
          <Badge 
            variant={recommendation.priority === "high" ? "default" : "secondary"}
            className={cn(
              "text-xs font-semibold uppercase tracking-wider",
              recommendation.priority === "high" && "animate-pulse bg-primary/90 hover:bg-primary"
            )}
          >
            {recommendation.priority === "none" ? "INFO" : `${recommendation.priority} PRIORITY`}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Main Recommendation */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm text-muted-foreground">RECOMMENDATION</span>
                <Badge 
                  variant={recommendation.priority === "high" ? "default" : "outline"}
                  className={cn(
                    "font-semibold",
                    recommendation.priority === "high" && "bg-primary/90 hover:bg-primary"
                  )}
                >
                  {recommendation.label}
                </Badge>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-muted-foreground uppercase">Score</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1">
                        <span className={cn(
                          "text-sm font-semibold",
                          recommendation.score > 10 ? "text-primary" : "text-muted-foreground"
                        )}>
                          {recommendation.score.toFixed(1)}/16.0
                        </span>
                        <HelpCircle className="w-3 h-3 text-muted-foreground hover:text-primary transition-colors" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <div className="space-y-1 text-xs">
                        <p className="font-semibold">Chip Recommendation Score</p>
                        <p>Based on multiple factors analyzed for optimal chip usage timing.</p>
                        <div className="space-y-0.5 pt-1">
                          <p><span className="text-green-500">12+</span> = High Priority</p>
                          <p><span className="text-yellow-500">8-11</span> = Medium Priority</p>
                          <p><span className="text-gray-500">4-7</span> = Low Priority</p>
                          <p><span className="text-gray-400">0-3</span> = Not Recommended</p>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {recommendation.recommendation}
            </p>
          </div>

          {/* Analysis Factors */}
          {recommendation.factors.length > 0 && (
            <div className="space-y-3">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Analysis Factors
              </span>
              <div className="space-y-3">
                {recommendation.factors.map((factor, index) => {
                  const IconComponent = factor.icon;
                  const percentage = (factor.value / factor.maxValue) * 100;
                  
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <IconComponent className={cn("w-4 h-4", factor.color)} />
                          <span className="text-sm font-medium">{factor.name}</span>
                        </div>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-1">
                                <span className={cn("text-sm font-semibold", factor.color)}>
                                  {factor.value.toFixed(1)}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  /{factor.maxValue}
                                </span>
                                <HelpCircle className="w-3 h-3 text-muted-foreground hover:text-primary transition-colors" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <div className="space-y-1 text-xs">
                                <p className="font-semibold">{factor.name} Score</p>
                                <p>{factor.description}</p>
                                <p className="text-muted-foreground">
                                  Score: {factor.value.toFixed(1)} out of {factor.maxValue} possible points
                                </p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <div className="space-y-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="cursor-help">
                                <Progress 
                                  value={percentage} 
                                  className="h-2 bg-primary/10" 
                                />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <div className="space-y-1 text-xs">
                                <p className="font-semibold">Progress Bar</p>
                                <p>Visual representation of {factor.name} strength</p>
                                <p className="text-muted-foreground">
                                  {percentage.toFixed(0)}% of maximum possible score
                                </p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <p className="text-xs text-muted-foreground">
                          {factor.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
