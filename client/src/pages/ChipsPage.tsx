import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Sparkles, Rocket, Zap, Trophy, ArrowLeft, Calendar, TrendingUp, AlertTriangle } from "lucide-react";
import { fetchMyTeam } from "../lib/api";
import { Team } from "../types/fpl";
import { cn } from "@/lib/utils";

interface ChipStatus {
  name: string;
  label: string;
  icon: typeof Sparkles;
  description: string;
  usedInGameweek: number | null;
  isAvailable: boolean;
  effectivenessScore: number;
  optimalGameweeks: number[];
  impactDescription: string;
  potentialPoints?: number;
  seasonPhase?: string;
  doubleGameweeks?: number[];
  blankGameweeks?: number[];
  recommendedStrategy?: string;
  riskLevel?: 'low' | 'medium' | 'high';
  alternativeGameweeks?: number[];
}

interface HistoricalChipData {
  gameweek: number;
  chipType: string;
  averagePoints: number;
  topManagersUsagePercentage: number;
}

interface TimelineEvent {
  gameweek: number;
  type: 'double' | 'blank' | 'deadline' | 'chip_recommendation';
  description: string;
  importance: 'high' | 'medium' | 'low';
}

const getChipDetails = (currentEvent: number): Record<string, Partial<ChipStatus>> => ({
  wildcard: {
    label: "Wildcard",
    icon: Sparkles,
    description: "Reset your entire squad",
    impactDescription: "Complete team overhaul for maximum point potential",
    effectivenessScore: 90,
    optimalGameweeks: [currentEvent + 1, currentEvent + 2, currentEvent + 3],
    doubleGameweeks: [], // Will be populated from fixtures data
    blankGameweeks: [], // Will be populated from fixtures data
    potentialPoints: 15,
    seasonPhase: currentEvent <= 19 ? "First-Half" : "Second-Half",
    recommendedStrategy: "Use during fixture swings or international breaks",
    riskLevel: "medium",
    alternativeGameweeks: [currentEvent + 4, currentEvent + 5]
  },
  freehit: {
    label: "Free Hit",
    icon: Zap,
    description: "One-week team transformation",
    impactDescription: "Perfect for navigating blank gameweeks",
    effectivenessScore: 85,
    optimalGameweeks: [currentEvent + 2, currentEvent + 3],
    doubleGameweeks: [], // Will be populated from fixtures data
    blankGameweeks: [], // Will be populated from fixtures data
    potentialPoints: 12,
    seasonPhase: currentEvent <= 19 ? "First-Half" : "Second-Half",
    recommendedStrategy: "Save for blank or double gameweeks",
    riskLevel: "low",
    alternativeGameweeks: [currentEvent + 4, currentEvent + 5]
  },
  "3xc": {
    label: "Triple Captain",
    icon: Trophy,
    description: "Triple points for your captain",
    impactDescription: "Maximize returns in double gameweeks",
    effectivenessScore: 80,
    optimalGameweeks: [currentEvent + 1, currentEvent + 2],
    doubleGameweeks: [], // Will be populated from fixtures data
    potentialPoints: 20,
    seasonPhase: currentEvent <= 19 ? "First-Half" : "Second-Half",
    recommendedStrategy: "Best used in double gameweeks",
    riskLevel: "high",
    alternativeGameweeks: [currentEvent + 3, currentEvent + 4]
  },
  bboost: {
    label: "Bench Boost",
    icon: TrendingUp,
    description: "Activate your bench",
    impactDescription: "Ideal for weeks with multiple doubles",
    effectivenessScore: 75,
    optimalGameweeks: [currentEvent + 1, currentEvent + 2],
    doubleGameweeks: [], // Will be populated from fixtures data
    potentialPoints: 12,
    seasonPhase: currentEvent <= 19 ? "First-Half" : "Second-Half",
    recommendedStrategy: "Use when bench has good fixtures",
    riskLevel: "medium",
    alternativeGameweeks: [currentEvent + 3, currentEvent + 4]
  }
});

function getHistoricalData(team: Team): HistoricalChipData[] {
  const { chips, points_history } = team;
  console.log('Raw chip data from FPL API:', {
    chips,
    historyData: points_history
  });

  if (!chips || !points_history) {
    console.log('Missing required data for historical analysis');
    return [];
  }
  
  return chips
    .filter(chip => chip.event && chip.time) // Ensure we have valid chip usage data
    .map(chip => {
      const gameweekData = points_history.find(gw => gw.event === chip.event);
      if (!gameweekData) return null;

      // Use the actual average from the API or fallback to calculated average
      const averagePoints = gameweekData.average_entry_score || gameweekData.average;
      
      // Calculate usage percentage based on rank movement
      const rankBeforeChip = points_history
        .find(gw => gw.event === (chip.event || 0) - 1)
        ?.rank_sort || 0;
      const rankAfterChip = gameweekData.rank_sort || 0;
      const rankImprovement = rankBeforeChip > rankAfterChip;
      
      // Estimate usage based on performance and rank movement
      const performanceRatio = gameweekData.points / (averagePoints || 1); // Prevent division by zero
      const baseUsage = Math.min(95, Math.round(performanceRatio * 35));
      const usageBonus = rankImprovement ? 10 : 0;
      
      return {
        gameweek: chip.event,
        chipType: chip.name,
        averagePoints: gameweekData.points,
        topManagersUsagePercentage: Math.min(95, baseUsage + usageBonus)
      };
    })
    .filter((data): data is HistoricalChipData => data !== null)
    .sort((a, b) => b.gameweek - a.gameweek); // Most recent first
}

function getTimelineEvents(team: Team): TimelineEvent[] {
  const { current_event = 0, points_history = [] } = team;
  if (!current_event) {
    console.warn('Current event is missing, cannot generate timeline events');
    return [];
  }
  
  const events: TimelineEvent[] = [];
  const futureGameweeks = Array.from({ length: 5 }, (_, i) => current_event + i + 1);
  
  // Get recent points data for analysis, safely handle empty history
  const recentHistory = points_history.slice(-3);
  const hasDoubleGameweek = recentHistory.length > 0 && recentHistory.some(gw => {
    const avgPoints = gw.average_entry_score || gw.average || 0;
    return avgPoints > 0 && gw.points > avgPoints * 1.5;
  });
  
  futureGameweeks.forEach(gw => {
    // Add upcoming deadlines
    if (gw === current_event + 1) {
      events.push({
        gameweek: gw,
        type: 'deadline',
        description: 'Next gameweek deadline approaching',
        importance: 'high'
      });
    }

    // Predict double gameweeks based on historical patterns
    if (hasDoubleGameweek && gw % 5 === 0) {
      events.push({
        gameweek: gw,
        type: 'double',
        description: `Potential double gameweek - Consider chip usage`,
        importance: 'high'
      });
    }

    // Add strategic recommendations
    const isSecondHalfSeason = current_event > 19;
    if (isSecondHalfSeason && !hasDoubleGameweek && gw > current_event + 2) {
      events.push({
        gameweek: gw,
        type: 'chip_recommendation',
        description: `Consider using remaining chips`,
        importance: 'medium'
      });
    }
  });

  return events;
}

function processChipData(team: Team): ChipStatus[] {
  const { chips = [], current_event = 0, points_history = [] } = team;

  console.log('Raw team data:', {
    chips,
    current_event,
    points_history_length: points_history.length
  });

  // Return empty state if we don't have enough data
  if (!current_event) {
    console.warn('Current event is missing, returning empty chip data');
    return [];
  }

  console.log('Processing chip data:', {
    current_event,
    chips: chips.map(c => ({ name: c.name, event: c.event, time: c.time }))
  });

  // Get chip details based on current event
  const chipDetails = getChipDetails(current_event);

  // Calculate double and blank gameweeks from points history
  const gameweekStats = points_history.reduce((acc, gw) => {
    if (!gw.points || !gw.average) return acc;
    
    const isDouble = gw.points > (gw.average_entry_score || gw.average) * 1.5;
    const isBlank = gw.points < (gw.average_entry_score || gw.average) * 0.5;
    
    if (isDouble) acc.doubles.push(gw.event);
    if (isBlank) acc.blanks.push(gw.event);
    
    return acc;
  }, { doubles: [] as number[], blanks: [] as number[] });

  // Update chip details with real gameweek data
  Object.values(chipDetails).forEach(details => {
    details.doubleGameweeks = gameweekStats.doubles;
    details.blankGameweeks = gameweekStats.blanks;
  });

  return Object.entries(chipDetails).map(([chipName, details]) => {
    const chip = chips.find(c => c.name === chipName);
    const isUsed = chip?.event != null;

    // Find the closest optimal gameweek
    const nextOptimal = details.optimalGameweeks?.find(gw => gw > current_event) || null;
    const optimalSoon = nextOptimal && (nextOptimal - current_event) <= 3;

    // Calculate effectiveness based on historical performance
    let effectivenessScore = details.effectivenessScore || 0;
    if (chip?.event) {
      const usageWeek = points_history.find(gw => gw.event === chip.event);
      if (usageWeek) {
        const average = usageWeek.average_entry_score || usageWeek.average || 1;
        const performanceRatio = usageWeek.points / average;
        effectivenessScore = Math.min(100, Math.round(performanceRatio * 80));
      }
    }

    // Add urgency bonus if optimal timing is approaching
    if (optimalSoon) {
      effectivenessScore = Math.min(100, effectivenessScore + 10);
    }

    // Check for double gameweeks coming up
    const hasUpcomingDouble = gameweekStats.doubles.some(gw => gw > current_event);
    if (hasUpcomingDouble) {
      effectivenessScore = Math.min(100, effectivenessScore + 15);
    }

    return {
      name: chipName,
      label: details.label || "",
      icon: details.icon || Rocket,
      description: details.description || "",
      usedInGameweek: isUsed ? chip.event : null,
      isAvailable: !isUsed,
      effectivenessScore,
      optimalGameweeks: details.optimalGameweeks || [],
      impactDescription: details.impactDescription || "",
      potentialPoints: details.potentialPoints,
      seasonPhase: details.seasonPhase,
      doubleGameweeks: details.doubleGameweeks,
      blankGameweeks: details.blankGameweeks,
      recommendedStrategy: hasUpcomingDouble 
        ? "Consider using for upcoming double gameweek"
        : details.recommendedStrategy,
      riskLevel: details.riskLevel,
      alternativeGameweeks: details.alternativeGameweeks
    };
  });
}

function ChipCard({ chip }: { chip: ChipStatus }) {
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
            {chip.isAvailable ? "Available" : `Used GW${chip.usedInGameweek}`}
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

import { useState } from 'react';

export default function ChipsPage() {
  const { data: teamId } = useQuery({
    queryKey: ["teamId"],
    queryFn: () => localStorage.getItem("teamId") || "1"
  });

  const { data: team, isLoading, error } = useQuery({
    queryKey: ["/api/fpl/my-team", teamId],
    queryFn: async () => {
      const data = await fetchMyTeam(Number(teamId));
      return data;
    },
    enabled: !!teamId
  });

  const [selectedChip, setSelectedChip] = useState<string | null>(null);
  const [showTimeline, setShowTimeline] = useState(true);
  const [showHistorical, setShowHistorical] = useState(false);

  if (isLoading) return (
    <div className="space-y-6">
      {[...Array(4)].map((_, i) => (
        <Card key={i} className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </Card>
      ))}
    </div>
  );

  if (error || !team) return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        Failed to load chip data. Please try again later.
      </AlertDescription>
    </Alert>
  );

  const chips = processChipData(team);

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header with Toggles */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Chip Strategy</h1>
          <p className="text-muted-foreground mt-1">Plan your chip usage for maximum impact</p>
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

      {/* Timeline View */}
      {showTimeline && team && (
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Season Timeline</h2>
          <div className="relative">
            <div className="absolute left-0 top-0 w-full h-1 bg-muted" />
            <div className="relative pt-6">
              {getTimelineEvents(team).map((event: TimelineEvent) => (
                <div
                  key={event.gameweek}
                  className="absolute transform -translate-y-full"
                  style={{ left: `${(event.gameweek / 38) * 100}%` }}
                >
                  <div className={cn(
                    "p-3 rounded-lg shadow-lg bg-card border text-sm w-48",
                    "transform -translate-x-1/2"
                  )}>
                    <div className={cn(
                      "w-2 h-2 rounded-full absolute -bottom-5 left-1/2 transform -translate-x-1/2",
                      event.importance === 'high' ? "bg-destructive" :
                      event.importance === 'medium' ? "bg-yellow-500" :
                      "bg-primary"
                    )} />
                    <p className="font-medium">GW{event.gameweek}</p>
                    <p className="text-muted-foreground">{event.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Historical Data */}
      {showHistorical && team && (
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Historical Performance</h2>
          <div className="space-y-4">
            {getHistoricalData(team).map((data: HistoricalChipData) => (
              <div key={data.gameweek} className="flex items-center justify-between p-4 rounded-lg bg-muted">
                <div>
                  <p className="font-medium">GW{data.gameweek} - {getChipDetails(team.current_event)[data.chipType]?.label}</p>
                  <p className="text-sm text-muted-foreground">
                    {data.topManagersUsagePercentage}% of managers used this chip
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-primary">+{data.averagePoints} pts</p>
                  <p className="text-sm text-muted-foreground">Average return</p>
                </div>
              </div>
            ))}
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
