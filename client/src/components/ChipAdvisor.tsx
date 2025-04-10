import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Chip, BootstrapStatic, Pick, Team, Player, Fixture } from "@/types/fpl";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";
import { useCallback } from "react";

// Scoring constants for better maintainability
const SCORE_WEIGHTS = {
  INJURY: 0.8,
  PRICE_CHANGE: 0.3,
  DOUBLE_GW: 1.5,
  TRANSFER_COST: 0.4,
  FORM: 0.5,
  FIXTURE_DIFFICULTY: 0.2,
  BENCH_MINUTES: 1.5,
  BENCH_FORM: 0.3,
  BENCH_OWNERSHIP: 0.02,
  MIN_RECOMMEND_SCORE: 4.5
};

type ElementType = 1 | 2 | 3 | 4;

const POSITION_WEIGHTS: Record<ElementType, number> = {
  1: 0.8,  // goalkeeper
  2: 1.2,  // defender
  3: 1.5,  // midfielder
  4: 1.3   // forward
};

interface GameweekTarget {
  gameweek: number;
  type: 'double' | 'blank' | 'normal';
  teams?: string[];
  reason?: string;
}

interface ChipRecommendation {
  chip: string;
  label: string;
  reason: string;
  priority: 'high' | 'medium' | 'low' | 'none';
  score?: string;
  targetGameweeks?: GameweekTarget[];
}

interface ChipAdvisorProps {
  chips: Chip[];
  currentGameweek?: number;
  bootstrapStatic?: BootstrapStatic;
  team?: Team;
}

export function ChipAdvisor({ chips, currentGameweek, bootstrapStatic, team }: ChipAdvisorProps) {
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

  const calculateWildcardScore = () => {
    try {
      validateInputs();
      if (!team || !bootstrapStatic) return 0;
      
      // Dynamic injury threshold based on squad size
      const INJURY_THRESHOLD = team.picks.length > 15 ? 80 : 70;
      
      // Count injured or doubtful players
      const injuredPlayers = team.picks.filter(p => {
        const player = getPlayerDetails(p.element);
        return player && 
               typeof player.chance_of_playing_next_round === 'number' && 
               player.chance_of_playing_next_round < INJURY_THRESHOLD;
      }).length;
      
      // Calculate potential price changes
      const priceChanges = team.picks.reduce((acc, pick) => {
        const player = getPlayerDetails(pick.element);
        return acc + (player?.cost_change_event_fall || 0);
      }, 0);

      const next3GWs = getNextFixtures(3);
      const upcomingDoubles = next3GWs.filter(gw => gw.difficulty && gw.difficulty > 4).length;

      // Calculate transfer cost savings
      const transferCost = (team.transfers?.cost || 0) / 10;

      return (
        (Math.min(injuredPlayers, 5) * SCORE_WEIGHTS.INJURY) +
        (Math.min(Math.abs(priceChanges), 10) * SCORE_WEIGHTS.PRICE_CHANGE) +
        (upcomingDoubles * SCORE_WEIGHTS.DOUBLE_GW) +
        (transferCost * SCORE_WEIGHTS.TRANSFER_COST)
      );
    } catch (error) {
      console.error('Error calculating wildcard score:', error);
      return 0;
    }
  };

  const calculateFreehitScore = () => {
    try {
      validateInputs();
      if (!team || !bootstrapStatic || !currentGameweek) return 0;

      const next3GWs = getNextFixtures(3);
      const nextGW = next3GWs[0];
      const nextGWDifficulty = nextGW?.difficulty || 0;

      // Calculate team's defensive strength for next fixtures
      const teamDefensiveStrength = team.picks.reduce((acc, pick) => {
        const player = getPlayerDetails(pick.element);
        const playerTeam = bootstrapStatic.teams.find(t => t.id === player?.team);
        return acc + (playerTeam?.strength_defence_home || 0);
      }, 0) / team.picks.length;

      const futureBlanks = next3GWs.filter(gw => gw.average_entry_score < 30).length;
      const futureDoubles = next3GWs.filter(gw => gw.average_entry_score > 70).length;

      return (
        (futureBlanks * 1.8) + 
        (futureDoubles * SCORE_WEIGHTS.DOUBLE_GW) +
        (Math.max(0, 5 - teamDefensiveStrength) * 0.4) +
        (nextGWDifficulty * SCORE_WEIGHTS.FIXTURE_DIFFICULTY)
      );
    } catch (error) {
      console.error('Error calculating freehit score:', error);
      return 0;
    }
  };

  const calculateBenchBoostScore = () => {
    try {
      validateInputs();
      if (!team || !bootstrapStatic || !currentGameweek) return 0;

      // Analyze bench players with position-specific scoring
      const benchPlayers = team.picks.filter((p: Pick) => p.position > 11);
      const benchStrength = benchPlayers.reduce((acc, pick) => {
        const player = getPlayerDetails(pick.element);
        if (!player) return acc;
        
        const elementType = player.element_type as ElementType;
        const positionWeight = POSITION_WEIGHTS[elementType] || 1;
        const minutesLikelihood = parseFloat(player.points_per_game) > 2 ? 1 : 0.5;
        const form = parseFloat(player.form) || 0;
        const ownership = parseFloat(player.selected_by_percent) || 0;
        
        return acc + (
          (minutesLikelihood * SCORE_WEIGHTS.BENCH_MINUTES * positionWeight) +
          (Math.min(form, 8) * SCORE_WEIGHTS.BENCH_FORM) +
          (Math.min(ownership, 50) * SCORE_WEIGHTS.BENCH_OWNERSHIP)
        );
      }, 0);

      const next3GWs = getNextFixtures(3);
      const upcomingDoubles = next3GWs.filter(gw => gw.average_entry_score > 65).length;

      return (benchStrength * 0.8) + (upcomingDoubles * SCORE_WEIGHTS.DOUBLE_GW);
    } catch (error) {
      console.error('Error calculating bench boost score:', error);
      return 0;
    }
  };

  const calculateTripleCaptainScore = () => {
    try {
      validateInputs();
      if (!team || !bootstrapStatic || !currentGameweek) return 0;
      
      const captain = team.picks.find((p: Pick) => p.is_captain);
      if (!captain) return 0;

      const captainPlayer = getPlayerDetails(captain.element);
      if (!captainPlayer) return 0;

      // Calculate captain's form and fixture potential
      const form = parseFloat(captainPlayer.form) || 0;
      const expectedGoals = captainPlayer.expected_goals || 0;
      const expectedAssists = captainPlayer.expected_assists || 0;
      const totalExpected = expectedGoals + expectedAssists;

      // Add rotation risk factor
      const rotationRisk = captainPlayer.chance_of_playing_next_round 
        ? (100 - captainPlayer.chance_of_playing_next_round)/100 
        : 0;
      const riskPenalty = rotationRisk * 2;

      const next3GWs = getNextFixtures(3);
      const nextGWDifficulty = next3GWs[0]?.difficulty || 50;

      const formScore = Math.min(form, 8) * SCORE_WEIGHTS.FORM;
      const expectedScore = Math.min(totalExpected * 2, 5);
      const fixtureScore = (100 - nextGWDifficulty) / 20;

      return Math.max(0, formScore + expectedScore + fixtureScore - riskPenalty);
    } catch (error) {
      console.error('Error calculating triple captain score:', error);
      return 0;
    }
  };

  const calculateAssistantManagerScore = () => {
    try {
      validateInputs();
      if (!bootstrapStatic || !currentGameweek) return 0;
      
      const next3GWs = getNextFixtures(3);
      const nextDeadline = next3GWs[0]?.deadline_time;
      
      if (!nextDeadline) return 0;
      
      const daysUntilNextDeadline = Math.ceil(
        (new Date(nextDeadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      
      const deadlineScore = daysUntilNextDeadline < 3 ? 2 : daysUntilNextDeadline < 5 ? 1 : 0;
      const busyPeriodScore = next3GWs.length >= 2 ? 2 : 1;

      return deadlineScore + busyPeriodScore;
    } catch (error) {
      console.error('Error calculating assistant manager score:', error);
      return 0;
    }
  };

  const identifyTargetGameweeks = (weeksAhead: number = 10): GameweekTarget[] => {
    if (!bootstrapStatic || !currentGameweek) return [];

    const targets: GameweekTarget[] = [];
    const futureGameweeks = bootstrapStatic.events
      .filter(e => e.id > currentGameweek && e.id <= currentGameweek + weeksAhead);

    // Helper function to get team name
    const getTeamName = (teamId: number): string => {
      return bootstrapStatic.teams.find(t => t.id === teamId)?.short_name || '';
    };

    // Get all fixtures
    const allFixtures = bootstrapStatic.fixtures || [];

    futureGameweeks.forEach(gw => {
      // Get fixtures for this gameweek
      const gwFixtures = allFixtures.filter(f => f.event === gw.id);

      // Get teams playing in this gameweek
      const teamAppearances = new Map<number, number>();
      gwFixtures.forEach(fixture => {
        teamAppearances.set(fixture.team_h, (teamAppearances.get(fixture.team_h) || 0) + 1);
        teamAppearances.set(fixture.team_a, (teamAppearances.get(fixture.team_a) || 0) + 1);
      });

      // Find teams with doubles
      const teamsWithDoubles = Array.from(teamAppearances.entries())
        .filter(([_, count]) => count > 1)
        .map(([teamId]) => getTeamName(teamId))
        .filter(name => name); // Remove empty names

      if (teamsWithDoubles.length > 0) {
        targets.push({
          gameweek: gw.id,
          type: 'double',
          teams: teamsWithDoubles,
          reason: `Double gameweek for ${teamsWithDoubles.join(', ')}`
        });
      }

      // Find teams with blanks
      const teamsWithBlanks = bootstrapStatic.teams
        .filter(team => !teamAppearances.has(team.id))
        .map(team => team.short_name);

      if (teamsWithBlanks.length > 0) {
        targets.push({
          gameweek: gw.id,
          type: 'blank',
          teams: teamsWithBlanks,
          reason: `Blank gameweek for ${teamsWithBlanks.join(', ')}`
        });
      }
    });

    return targets;
  };

  const getChipTargetGameweeks = (chipName: string): GameweekTarget[] => {
    const targets = identifyTargetGameweeks();
    
    switch (chipName) {
      case 'freehit':
        // Target big blank gameweeks
        return targets.filter(t => t.type === 'blank');
        
      case 'wildcard':
        // Target gameweeks before big doubles or after big blanks
        return targets.map(t => ({
          ...t,
          gameweek: t.type === 'double' ? t.gameweek - 1 : t.gameweek + 1,
          reason: t.type === 'double' 
            ? `Prepare for DGW${t.gameweek + 1}` 
            : `Recover from BGW${t.gameweek - 1}`
        }));
        
      case 'bboost':
        // Target double gameweeks
        return targets.filter(t => t.type === 'double');
        
      case '3xc':
        // Target double gameweeks with high-performing teams
        return targets.filter(t => 
          t.type === 'double' && 
          t.teams?.some(team => {
            const teamData = bootstrapStatic?.teams.find(
              bt => bt.short_name === team
            );
            return teamData && teamData.strength_overall_home > 3;
          })
        );
        
      default:
        return [];
    }
  };

  const getChipReason = (chipName: string): string => {
    const targetGWs = getChipTargetGameweeks(chipName);
    const baseReason = (() => {
      switch (chipName) {
        case "wildcard":
          return "Wildcard chip recommended due to high injury risk and potential price changes.";
        case "freehit":
          return "Free Hit chip recommended due to favorable upcoming fixtures and low defensive strength.";
        case "bboost":
          return "Bench Boost chip recommended due to strong bench players and upcoming doubles.";
        case "3xc":
          return "Triple Captain chip recommended due to captain's high form and favorable fixture.";
        case "manager":
          return "Assistant Manager chip recommended due to busy period and tight deadline.";
        default:
          return "";
      }
    })();

    if (targetGWs.length === 0) return baseReason;

    const targetInfo = targetGWs
      .map(t => `GW${t.gameweek} (${t.type === 'double' ? 'DGW' : 'BGW'}: ${t.reason})`)
      .join(', ');

    return `${baseReason}\nTarget gameweeks: ${targetInfo}`;
  };

  const getRecommendation = (): ChipRecommendation => {
    if (!currentGameweek || !bootstrapStatic || !team) {
      return {
        chip: "error",
        label: "Error",
        reason: "Missing required data",
        priority: "none",
        targetGameweeks: []
      };
    }

    try {
      validateInputs();

      // Calculate chip scores
      const chipScores = {
        wildcard: calculateWildcardScore(),
        freehit: calculateFreehitScore(),
        bboost: calculateBenchBoostScore(),
        "3xc": calculateTripleCaptainScore(),
        manager: calculateAssistantManagerScore()
      };

      // Get remaining chips scores
      const remainingChipsNames = remainingChips.map(c => c.name);
      const availableScores = Object.entries(chipScores)
        .filter(([name]) => remainingChipsNames.includes(name))
        .sort((a, b) => b[1] - a[1]);

      // Get top recommendation with minimum threshold
      const topChip = availableScores[0];

      if (!topChip) {
        return {
          chip: "none",
          label: "All Used",
          reason: "You've used all chips. Focus on transfers and captain choices",
          priority: "none",
          targetGameweeks: []
        };
      }

      const [chipName, score] = topChip;

      // Check if score meets minimum threshold
      if (score < SCORE_WEIGHTS.MIN_RECOMMEND_SCORE) {
        return {
          chip: "hold",
          label: "Hold",
          reason: "No strong chip opportunities this week",
          priority: "low",
          targetGameweeks: []
        };
      }

      // Add pairwise comparisons for more nuanced recommendations
      const secondBest = availableScores[1];
      const scoreDiff = secondBest ? score - secondBest[1] : score;
      const priority = scoreDiff > 2.5 ? "high" : scoreDiff > 1.5 ? "medium" : "low";

      const chipLabel = remainingChips.find(c => c.name === chipName)?.label || chipName;
      const reason = getChipReason(chipName);

      return {
        chip: chipName,
        label: chipLabel,
        reason,
        priority,
        score: score.toFixed(1),
        targetGameweeks: getChipTargetGameweeks(chipName)
      };
    } catch (error) {
      console.error('Error getting recommendation:', error);
      return {
        chip: "error",
        label: "Error",
        reason: "An error occurred while calculating recommendations",
        priority: "none",
        targetGameweeks: []
      };
    }
  };

  const recommendation = getRecommendation();

  if (!recommendation) return null;

  return (
    <Card className="bg-gradient-to-br from-primary/5 via-primary/2 to-transparent border-primary/20 hover:border-primary/30 transition-colors">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary animate-pulse" />
            <CardTitle className="text-xl">Chip Advisor</CardTitle>
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
        <div className="space-y-4">
          <div className="space-y-2.5">
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
              {recommendation.score && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium text-muted-foreground uppercase">Score</span>
                  <span className={cn(
                    "text-sm font-semibold",
                    parseFloat(recommendation.score) > 4 ? "text-primary" : "text-muted-foreground"
                  )}>
                    {recommendation.score}/5.0
                  </span>
                </div>
              )}
            </div>
            <div className="text-sm text-muted-foreground space-y-2">
              {recommendation.reason.split("\n").map((line, i) => (
                <div key={i} className="flex items-start gap-2.5 group">
                  <div className={cn(
                    "w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 transition-colors",
                    recommendation.priority === "high" 
                      ? "bg-primary group-hover:bg-primary/80" 
                      : "bg-primary/50 group-hover:bg-primary/60"
                  )} />
                  <p className="leading-relaxed group-hover:text-foreground transition-colors">{line}</p>
                </div>
              ))}
            </div>
          </div>

          {recommendation.targetGameweeks && recommendation.targetGameweeks.length > 0 && (
            <div className="space-y-2 pt-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Target Gameweeks
              </span>
              <div className="flex flex-wrap gap-1.5">
                {recommendation.targetGameweeks.map((target, i) => (
                  <Badge 
                    key={i} 
                    variant="secondary"
                    className={cn(
                      "text-xs bg-background/80 hover:bg-background transition-colors",
                      recommendation.priority === "high" && "border-primary/50"
                    )}
                  >
                    {target.type === 'double' ? 'DGW' : 'BGW'} {target.gameweek}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {remainingChips.length > 0 && (
            <div className="space-y-2 pt-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Available Chips
              </span>
              <div className="flex flex-wrap gap-1.5">
                {remainingChips.map((chip) => (
                  <Badge 
                    key={chip.name} 
                    variant="secondary"
                    className={cn(
                      "text-xs bg-background/80 hover:bg-background transition-colors",
                      chip.name === recommendation.chip && "border-primary/50"
                    )}
                  >
                    {chip.label}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
