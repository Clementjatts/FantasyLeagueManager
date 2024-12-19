import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, Zap, Trophy, ArrowLeft, Calendar, TrendingUp, AlertTriangle } from "lucide-react";
import { fetchMyTeam, fetchBootstrapStatic, fetchFixtures } from "../lib/api";
import { Team, Fixture } from "../types/fpl";
import { cn } from "@/lib/utils";

interface ChipStatus {
  name: string;
  label: string;
  icon: typeof Sparkles | typeof Zap | typeof Trophy | typeof TrendingUp;
  description: string;
  usedGameweek: number | null;
  isAvailable: boolean;
  effectivenessScore: number;
  optimalGameweeks: number[];
  impactDescription: string;
  potentialPoints: number;
  seasonPhase: string;
  doubleGameweeks: number[];
  blankGameweeks: number[];
  recommendedStrategy: string;
  riskLevel: 'low' | 'medium' | 'high';
  alternativeGameweeks: number[];
}

interface ChipDetails extends Partial<ChipStatus> {
  label: string;
  icon: typeof Sparkles | typeof Zap | typeof Trophy | typeof TrendingUp;
  description: string;
  impactDescription: string;
  recommendedStrategy: string;
  riskLevel: 'low' | 'medium' | 'high';
}

interface TimelineEvent {
  gameweek: number;
  type: 'double' | 'blank' | 'deadline' | 'chip_recommendation';
  description: string;
  importance: 'high' | 'medium' | 'low';
}

// Helper function to identify double gameweeks
function findDoubleGameweeks(fixtures: Fixture[]): number[] {
  const gameweekFixtures = new Map<number, number>();
  
  fixtures.forEach(fixture => {
    if (fixture.event !== null) {
      const count = gameweekFixtures.get(fixture.event) || 0;
      gameweekFixtures.set(fixture.event, count + 1);
    }
  });

  return Array.from(gameweekFixtures.entries())
    .filter(([_, count]) => count > 10) // More than 10 fixtures indicates a double gameweek
    .map(([gw]) => gw);
}

// Helper function to identify blank gameweeks
function findBlankGameweeks(fixtures: Fixture[]): number[] {
  const gameweekFixtures = new Map<number, number>();
  
  fixtures.forEach(fixture => {
    if (fixture.event !== null) {
      const count = gameweekFixtures.get(fixture.event) || 0;
      gameweekFixtures.set(fixture.event, count + 1);
    }
  });

  return Array.from(gameweekFixtures.entries())
    .filter(([_, count]) => count < 10) // Less than 10 fixtures indicates a blank gameweek
    .map(([gw]) => gw);
}

// Helper function to calculate chip effectiveness based on fixture difficulty and team form
function calculateChipEffectiveness(
  chip: string,
  currentGW: number,
  doubleGWs: number[],
  blankGWs: number[],
  fixtures: Fixture[],
  bootstrapData: BootstrapData
): number {
  try {
  let score = 50; // Base score
  
  const upcomingFixtures = fixtures.filter(f => f.event && f.event >= currentGW).slice(0, 5);
  const averageDifficulty = upcomingFixtures.reduce((acc, f) => {
    // Use home or away difficulty based on the fixture
    const difficulty = f.team_h_difficulty || f.team_a_difficulty || 2;
    return acc + difficulty;
  }, 0) / upcomingFixtures.length;
  
  // Get current form data from bootstrap
  const teams = bootstrapData.teams || [];
  const avgTeamForm = teams.reduce((acc: number, team: any) => acc + (parseFloat(team.form) || 0), 0) / teams.length;

  // Adjust score based on chip type, fixtures, and team form
  switch (chip) {
    case 'freehit':
      // Higher effectiveness during blank gameweeks or high difficulty periods
      if (blankGWs.some(gw => Math.abs(gw - currentGW) <= 3)) score += 30;
      if (averageDifficulty > 3) score += 20; // Bonus for difficult fixture periods
      break;
      
    case '3xc':
      // Higher effectiveness during double gameweeks and when top teams are in form
      if (doubleGWs.some(gw => Math.abs(gw - currentGW) <= 3)) score += 35;
      // Add bonus if there are teams in good form
      const topTeamForm = Math.max(...teams.map((t: any) => parseFloat(t.form) || 0));
      if (topTeamForm > avgTeamForm + 1) score += 20;
      break;
      
    case 'bboost':
      // Higher effectiveness during double gameweeks with favorable fixtures
      if (doubleGWs.some(gw => Math.abs(gw - currentGW) <= 3)) {
        score += 25;
        if (averageDifficulty < 3) score += 15; // Bonus for easier fixtures
      }
      break;
      
    case 'wildcard':
      // Higher effectiveness before fixture swings or multiple upcoming doubles/blanks
      const upcomingDGW = doubleGWs.filter(gw => gw > currentGW && gw <= currentGW + 5).length;
      const upcomingBGW = blankGWs.filter(gw => gw > currentGW && gw <= currentGW + 5).length;
      
      score += upcomingDGW * 10; // Bonus for each upcoming DGW
      score += upcomingBGW * 8;  // Bonus for each upcoming BGW
      
      // Additional bonus for significant fixture difficulty changes
      const fixtureDifficultySwing = Math.abs(
        Math.max(...upcomingFixtures.map(f => f.difficulty || 2)) -
        Math.min(...upcomingFixtures.map(f => f.difficulty || 2))
      );
      if (fixtureDifficultySwing >= 2) score += 15;
      break;
  }

  return Math.min(score, 100);
}

interface BootstrapData {
  teams: Array<{
    id: number;
    name: string;
    short_name: string;
    form: string;
    strength: number;
    strength_overall_home: number;
    strength_overall_away: number;
    strength_attack_home: number;
    strength_attack_away: number;
    strength_defence_home: number;
    strength_defence_away: number;
  }>;
  events: Array<{
    id: number;
    name: string;
    deadline_time: string;
    average_entry_score: number;
    finished: boolean;
    data_checked: boolean;
    highest_scoring_entry: number;
    deadline_time_epoch: number;
    deadline_time_game_offset: number;
    highest_score: number;
    is_previous: boolean;
    is_current: boolean;
    is_next: boolean;
  }>;
}

function processChipData(
  team: Team,
  fixtures: Fixture[],
  bootstrapData: BootstrapData
): ChipStatus[] {
  try {
    const { chips = [], current_event } = team;
    const doubleGameweeks = findDoubleGameweeks(fixtures);
    const blankGameweeks = findBlankGameweeks(fixtures);
    
    // Calculate average points per gameweek from historical data with proper type checking
    const avgPointsPerGW = team.history && team.history.current 
      ? team.history.current.reduce((acc, gw) => acc + (gw.points || 0), 0) / team.history.current.length
      : 50; // Default to 50 points if no history available

    return Object.entries(CHIP_DETAILS).map(([chipName, details]) => {
      const chip = chips.find(c => c.name === chipName);
      const isUsed = chip?.event != null;
      const usedGameweek = isUsed ? chip.event : null;

      const effectivenessScore = calculateChipEffectiveness(
        chipName,
        current_event,
        doubleGameweeks,
        blankGameweeks,
        fixtures,
        bootstrapData
      );

      // Calculate potential points based on historical performance and chip type
      const potentialPoints = Math.round(
        avgPointsPerGW * (
          chipName === '3xc' ? 2 :
          chipName === 'bboost' ? 1.5 :
          chipName === 'freehit' ? 1.3 :
          chipName === 'wildcard' ? 1.4 : 1
        )
      );

      // Calculate optimal gameweeks with improved logic
      const optimalGameweeks = (() => {
        const futureFixtures = fixtures.filter(f => f.event && f.event > current_event);
        const upcomingDifficulties = new Map<number, number>();
        
        futureFixtures.forEach(f => {
          if (f.event) {
            upcomingDifficulties.set(
              f.event,
              (upcomingDifficulties.get(f.event) || 0) + (f.difficulty || 2)
            );
          }
        });

        switch (chipName) {
          case 'freehit':
            // Prioritize blank gameweeks and weeks with high difficulty
            return [...blankGameweeks, 
              ...Array.from(upcomingDifficulties.entries())
                .filter(([_, diff]) => diff > 30)
                .map(([gw]) => gw)
            ].filter(gw => gw > current_event).slice(0, 3);
            
          case '3xc':
            // Prioritize double gameweeks with favorable fixtures
            return doubleGameweeks
              .filter(gw => gw > current_event)
              .filter(gw => (upcomingDifficulties.get(gw) || 30) < 28)
              .slice(0, 2);
            
          case 'bboost':
            // Prioritize double gameweeks with moderate difficulty
            return doubleGameweeks
              .filter(gw => gw > current_event)
              .filter(gw => {
                const diff = upcomingDifficulties.get(gw) || 30;
                return diff >= 24 && diff <= 32;
              })
              .slice(0, 2);
            
          case 'wildcard':
            // Consider both doubles/blanks and fixture difficulty swings
            const difficultySwings = Array.from(upcomingDifficulties.entries())
              .map(([gw]) => gw)
              .filter(gw => {
                const currentDiff = upcomingDifficulties.get(gw) || 30;
                const nextDiff = upcomingDifficulties.get(gw + 1) || 30;
                return Math.abs(currentDiff - nextDiff) > 8;
              });
              
            return Array.from(new Set([
              ...doubleGameweeks,
              ...blankGameweeks,
              ...difficultySwings
            ]))
              .filter(gw => gw > current_event)
              .slice(0, 3);
            
          default:
            return [];
        }
      })();

      // Determine season phase based on current gameweek
      const seasonPhase = current_event <= 12 ? 'Early Season' :
                         current_event <= 24 ? 'Mid Season' :
                         current_event <= 32 ? 'Late Season' : 'Final Run-in';

      return {
        name: chipName,
        label: details.label || "",
        icon: details.icon || Sparkles,
        description: details.description || "",
        usedGameweek,
        isAvailable: !isUsed,
        effectivenessScore,
        optimalGameweeks,
        impactDescription: details.impactDescription || "",
        potentialPoints,
        seasonPhase,
        doubleGameweeks,
        blankGameweeks,
        recommendedStrategy: details.recommendedStrategy,
        riskLevel: details.riskLevel,
        alternativeGameweeks: optimalGameweeks.slice(1)
      };
    });
  } catch (error) {
    console.error('Error processing chip data:', error);
    // Return safe fallback data
    return Object.entries(CHIP_DETAILS).map(([chipName, details]) => ({
      name: chipName,
      label: details.label || "",
      icon: details.icon || Sparkles,
      description: details.description || "",
      usedGameweek: null,
      isAvailable: true,
      effectivenessScore: 50,
      optimalGameweeks: [],
      impactDescription: details.impactDescription || "",
      potentialPoints: 0,
      seasonPhase: 'Unknown',
      doubleGameweeks: [],
      blankGameweeks: [],
      recommendedStrategy: 'Unable to calculate strategy at this time',
      riskLevel: 'medium' as const,
      alternativeGameweeks: []
    }));
  }
}

const CHIP_DETAILS: Record<string, ChipDetails> = {
  wildcard: {
    label: "Wildcard",
    icon: Sparkles,
    description: "Reset your entire squad",
    impactDescription: "Complete team overhaul for maximum point potential",
    recommendedStrategy: "Target fixture swings and team value optimization",
    riskLevel: "medium"
  },
  freehit: {
    label: "Free Hit",
    icon: Zap,
    description: "One-week team transformation",
    impactDescription: "Perfect for navigating blank gameweeks",
    recommendedStrategy: "Use during major blank gameweeks or attractive fixtures",
    riskLevel: "low"
  },
  "3xc": {
    label: "Triple Captain",
    icon: Trophy,
    description: "Triple points for your captain",
    impactDescription: "Maximize returns in double gameweeks",
    recommendedStrategy: "Target premium players with two favorable fixtures",
    riskLevel: "high"
  },
  bboost: {
    label: "Bench Boost",
    icon: TrendingUp,
    description: "Activate your bench",
    impactDescription: "Ideal for weeks with multiple doubles",
    recommendedStrategy: "Use when bench players have double gameweeks",
    riskLevel: "medium"
  }
} as const;

function ChipsPage() {
  const [selectedChip, setSelectedChip] = useState<string | null>(null);
  const [showTimeline, setShowTimeline] = useState(true);
  const [showHistorical, setShowHistorical] = useState(false);

  // Fetch required data
  const { data: bootstrapData, isLoading: isLoadingBootstrap } = useQuery<BootstrapData>({
    queryKey: ["bootstrap-static"],
    queryFn: fetchBootstrapStatic
  });

  const { data: fixtures, isLoading: isLoadingFixtures } = useQuery<Fixture[]>({
    queryKey: ["fixtures"],
    queryFn: fetchFixtures
  });

  const { data: team, isLoading: isLoadingTeam } = useQuery<Team>({
    queryKey: ["myTeam"],
    queryFn: () => fetchMyTeam(1) // Replace with actual manager ID
  });

  const isLoading = isLoadingBootstrap || isLoadingFixtures || isLoadingTeam;
  const hasError = !bootstrapData || !fixtures || !team;

  // Add error boundary for API data
  if (hasError && !isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Unable to load FPL data. Please check your connection and try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-8">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-6">
              <div className="space-y-4">
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Error boundary already handled above with hasError check

  const chips = team && fixtures && bootstrapData 
    ? processChipData(team, fixtures, bootstrapData)
    : [];
  const currentGameweek = bootstrapData?.events.find((event: { is_current: boolean; id: number }) => event.is_current)?.id || 1;

  // Generate timeline events based on fixtures and chips with proper type checking
  const timelineEvents: TimelineEvent[] = fixtures ? [
    ...findDoubleGameweeks(fixtures).map(gw => ({
      gameweek: gw,
      type: 'double' as const,
      description: `Double Gameweek ${gw} - Multiple teams play twice`,
      importance: gw > currentGameweek ? 'high' as const : 'low' as const
    })),
    ...findBlankGameweeks(fixtures).map(gw => ({
      gameweek: gw,
      type: 'blank' as const,
      description: `Blank Gameweek ${gw} - Reduced fixtures`,
      importance: gw > currentGameweek ? 'high' as const : 'low' as const
    }))
  ].sort((a, b) => a.gameweek - b.gameweek) : [];

  // Add chip recommendations to timeline with proper error handling and type checking
  if (Array.isArray(chips) && chips.length > 0) {
    const validChips = chips.filter(
      (chip): chip is ChipStatus => 
        chip.isAvailable && 
        Array.isArray(chip.optimalGameweeks) && 
        chip.optimalGameweeks.length > 0
    );

    validChips.forEach(chip => {
      timelineEvents.push({
        gameweek: chip.optimalGameweeks[0],
        type: 'chip_recommendation' as const,
        description: `Consider using ${chip.label} (Potential: +${chip.potentialPoints || '?'} pts)`,
        importance: 'medium' as const
      });
    });
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header with Back Button and Toggles */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-6">
        <div className="space-y-4">
          <Link href="/team">
            <Button
              variant="outline"
              className="mb-4 group transition-all duration-200 hover:border-primary"
            >
              <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
              Back to Team
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Chip Strategy</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Current Gameweek: {currentGameweek} | 
              Available Chips: {chips.filter(c => c.isAvailable).length}
            </p>
          </div>
        </div>
        <div className="flex gap-4">
          <Button
            variant={showTimeline ? "default" : "outline"}
            onClick={() => setShowTimeline(!showTimeline)}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Timeline
          </Button>
          <Button
            variant={showHistorical ? "default" : "outline"}
            onClick={() => setShowHistorical(!showHistorical)}
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Historical Data
          </Button>
        </div>
      </div>

      {/* Selected Chip Details */}
      {selectedChip && (
        <Alert className="mb-6">
          <AlertDescription>
            {chips.find(c => c.name === selectedChip)?.recommendedStrategy}
          </AlertDescription>
        </Alert>
      )}

      {/* Timeline View */}
      {showTimeline && (
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Season Timeline</h2>
          <div className="relative min-h-[200px]">
            {/* Timeline line */}
            <div className="absolute left-0 top-[100px] w-full h-1 bg-muted" />
            
            {/* Gameweek markers */}
            <div className="absolute left-0 top-[92px] w-full flex justify-between">
              {[1, 10, 19, 28, 38].map((gw) => (
                <div key={gw} className="flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                  <span className="text-xs text-muted-foreground mt-2">GW{gw}</span>
                </div>
              ))}
            </div>

            {/* Timeline events */}
            <div className="relative">
              {timelineEvents.map((event, index) => {
                // Calculate position and offset
                const position = (event.gameweek / 38) * 100;
                const isTop = index % 2 === 0;
                const topOffset = isTop ? '0' : '120px';
                
                return (
                  <div
                    key={event.gameweek}
                    className="absolute w-64 transition-all duration-200 hover:z-10"
                    style={{
                      left: `calc(${position}% - 128px)`, // Center the card (half of width)
                      top: topOffset
                    }}
                  >
                    <div className={cn(
                      "p-4 rounded-lg shadow-lg border",
                      "bg-card",
                      "transition-all duration-200 hover:scale-105",
                      isTop ? "mb-4" : "mt-4"
                    )}>
                      {/* Connecting line */}
                      <div 
                        className={cn(
                          "absolute left-1/2 w-px bg-border",
                          isTop ? "top-full h-[20px]" : "bottom-full h-[20px]"
                        )}
                      />
                      
                      {/* Event marker */}
                      <div 
                        className={cn(
                          "absolute left-1/2 w-3 h-3 rounded-full -translate-x-1/2",
                          isTop ? "bottom-[-28px]" : "top-[-28px]",
                          event.importance === 'high' ? "bg-destructive" :
                          event.importance === 'medium' ? "bg-yellow-500" :
                          "bg-primary"
                        )}
                      />

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline">GW{event.gameweek}</Badge>
                          <Badge 
                            variant="outline" 
                            className={cn(
                              event.type === 'double' ? "border-yellow-500 text-yellow-500" :
                              event.type === 'blank' ? "border-destructive text-destructive" :
                              "border-primary text-primary"
                            )}
                          >
                            {event.type === 'double' ? 'Double GW' :
                             event.type === 'blank' ? 'Blank GW' :
                             event.type === 'deadline' ? 'Deadline' : 'Recommendation'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{event.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-12 flex items-center justify-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-destructive" />
              <span className="text-sm text-muted-foreground">High Priority</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
              <span className="text-sm text-muted-foreground">Medium Priority</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-sm text-muted-foreground">Low Priority</span>
            </div>
          </div>
        </Card>
      )}

      {/* Historical Data */}
      {showHistorical && (
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Historical Performance</h2>
          <div className="space-y-4">
            {/* Historical data will be fetched and displayed here */}
          </div>
        </Card>
      )}

      {/* Chip Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {chips.map((chip) => (
          <motion.div
            key={chip.name}
            onClick={() => setSelectedChip(chip.name)}
            className="cursor-pointer"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <ChipCard chip={chip} />
          </motion.div>
        ))}
      </div>

      {/* Dynamic Recommendations */}
      <Card className="p-6 mt-8">
        <h2 className="text-xl font-semibold mb-4">Personalized Recommendations</h2>
        <div className="space-y-4">
          {chips
            .filter(chip => chip.isAvailable)
            .map(chip => (
              <Alert key={chip.name}>
                <AlertDescription className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <chip.icon className="w-4 h-4" />
                    <span>
                      Consider using {chip.label} in GW
                      {chip.optimalGameweeks[0]} for maximum impact
                    </span>
                  </div>
                  <Badge variant="outline">
                    +{chip.potentialPoints} pts potential
                  </Badge>
                </AlertDescription>
              </Alert>
            ))}
        </div>
      </Card>
    </div>
  );
}

function ChipCard({ chip }: { chip: ChipStatus }): JSX.Element {
  const Icon = chip.icon || Sparkles;
  const riskColor = chip.riskLevel === 'high' ? "text-destructive" :
                   chip.riskLevel === 'medium' ? "text-yellow-500" :
                   "text-green-500";
  
  return (
    <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 bg-gradient-to-br from-background to-background/80 backdrop-blur-sm"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg",
              chip.isAvailable ? "bg-primary/10" : "bg-muted"
            )}>
              <chip.icon className={cn(
                "w-5 h-5",
                chip.isAvailable ? "text-primary" : "text-muted-foreground"
              )} />
            </div>
            <div>
              <h3 className="text-lg font-semibold tracking-tight">{chip.label}</h3>
              <p className="text-sm text-muted-foreground">{chip.description}</p>
            </div>
          </div>
          <Badge 
            variant={chip.isAvailable ? "default" : "secondary"}
            className="ml-2"
          >
            {chip.isAvailable ? "Available" : `Used GW${chip.usedGameweek}`}
          </Badge>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Effectiveness</span>
              <span className="text-sm text-muted-foreground">{chip.effectivenessScore}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${chip.effectivenessScore}%` }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Optimal Gameweeks</h4>
            <div className="flex flex-wrap gap-2">
              {chip.optimalGameweeks.map((gw) => (
                <Badge 
                  key={gw}
                  variant="outline"
                >
                  GW{gw}
                  {gw === 29 && <span className="ml-1 text-xs">(Blank)</span>}
                  {chip.doubleGameweeks?.includes(gw) && <span className="ml-1 text-xs">(Double)</span>}
                </Badge>
              ))}
            </div>
          </div>

          {chip.doubleGameweeks && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Double Gameweeks</h4>
              <div className="flex flex-wrap gap-2">
                {chip.doubleGameweeks.map((gw) => (
                  <Badge 
                    key={gw}
                    variant="secondary"
                  >
                    GW{gw}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Strategy</h4>
            <p className="text-sm text-muted-foreground">{chip.recommendedStrategy}</p>
          </div>

          {chip.riskLevel && (
            <div className="flex items-center gap-2">
              <AlertTriangle className={cn(
                "w-4 h-4",
                chip.riskLevel === 'high' ? "text-destructive" :
                chip.riskLevel === 'medium' ? "text-yellow-500" :
                "text-green-500"
              )} />
              <span className="text-sm">
                {chip.riskLevel.charAt(0).toUpperCase() + chip.riskLevel.slice(1)} risk
              </span>
            </div>
          )}
        </div>
      </motion.div>
    </Card>
  );
}

export default ChipsPage;
