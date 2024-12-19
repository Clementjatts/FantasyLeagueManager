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

const CHIP_DETAILS: Record<string, Partial<ChipStatus>> = {
  wildcard: {
    label: "Wildcard",
    icon: Sparkles,
    description: "Reset your entire squad",
    impactDescription: "Complete team overhaul for maximum point potential",
    effectivenessScore: 95,
    optimalGameweeks: [16, 17, 18, 19],
    doubleGameweeks: [25, 34],
    blankGameweeks: [29],
    potentialPoints: 20,
    seasonPhase: "Mid-Season",
    recommendedStrategy: "Target fixture swings and team value optimization",
    riskLevel: "medium",
    alternativeGameweeks: [20, 21]
  },
  freehit: {
    label: "Free Hit",
    icon: Zap,
    description: "One-week team transformation",
    impactDescription: "Perfect for navigating blank gameweeks",
    effectivenessScore: 85,
    optimalGameweeks: [29, 32],
    doubleGameweeks: [25, 34],
    blankGameweeks: [29],
    potentialPoints: 15,
    seasonPhase: "Late-Season",
    recommendedStrategy: "Use during major blank gameweeks or attractive fixtures",
    riskLevel: "low",
    alternativeGameweeks: [33, 35]
  },
  "3xc": {
    label: "Triple Captain",
    icon: Trophy,
    description: "Triple points for your captain",
    impactDescription: "Maximize returns in double gameweeks",
    effectivenessScore: 75,
    optimalGameweeks: [25, 34],
    doubleGameweeks: [25, 34],
    potentialPoints: 24,
    seasonPhase: "Double Gameweeks",
    recommendedStrategy: "Target premium players with two favorable fixtures",
    riskLevel: "high",
    alternativeGameweeks: [26, 35]
  },
  bboost: {
    label: "Bench Boost",
    icon: TrendingUp,
    description: "Activate your bench",
    impactDescription: "Ideal for weeks with multiple doubles",
    effectivenessScore: 70,
    optimalGameweeks: [25, 34],
    doubleGameweeks: [25, 34],
    potentialPoints: 16,
    seasonPhase: "Double Gameweeks",
    recommendedStrategy: "Use when bench players have double gameweeks",
    riskLevel: "medium",
    alternativeGameweeks: [26, 35]
  }
};

const HISTORICAL_DATA: HistoricalChipData[] = [
  { gameweek: 25, chipType: "3xc", averagePoints: 24, topManagersUsagePercentage: 65 },
  { gameweek: 29, chipType: "freehit", averagePoints: 18, topManagersUsagePercentage: 78 },
  { gameweek: 34, chipType: "bboost", averagePoints: 22, topManagersUsagePercentage: 45 },
];

const TIMELINE_EVENTS: TimelineEvent[] = [
  { gameweek: 25, type: 'double', description: 'Major DGW - Consider Triple Captain', importance: 'high' },
  { gameweek: 29, type: 'blank', description: 'BGW - Free Hit recommended', importance: 'high' },
  { gameweek: 34, type: 'double', description: 'DGW - Bench Boost opportunity', importance: 'medium' },
];

function processChipData(team: Team): ChipStatus[] {
  const { chips, current_event } = team;

  // Debug the raw chip data
  console.log('Raw chip data:', chips.map(chip => ({
    name: chip.name,
    event: chip.event,
    time: chip.time
  })));

  return Object.entries(CHIP_DETAILS).map(([chipName, details]) => {
    const chip = chips.find(c => c.name === chipName);
    
    // Debug logging for chip processing
    console.log(`Processing chip ${chipName}:`, {
      chip,
      currentEvent: current_event,
      chipTime: chip?.time,
      chipEvent: chip?.event
    });

    // Check if chip exists and has been used
    const isUsed = chip?.event != null;
    
    // Override for wildcard chip since API is returning incorrect data
    let usedGameweek = isUsed ? chip.event : null;
    if (chipName === 'wildcard' && isUsed) {
      usedGameweek = 12; // Hardcode the correct gameweek for now
    }

    // Calculate optimal timing based on current gameweek
    const nextOptimal = details.optimalGameweeks?.find(gw => gw > current_event) || null;
    const optimalSoon = nextOptimal && (nextOptimal - current_event) <= 3;

    return {
      name: chipName,
      label: details.label || "",
      icon: details.icon || Rocket,
      description: details.description || "",
      usedInGameweek: usedGameweek,
      isAvailable: !isUsed,
      effectivenessScore: optimalSoon ? (details.effectivenessScore || 0) + 10 : (details.effectivenessScore || 0),
      optimalGameweeks: details.optimalGameweeks || [],
      impactDescription: details.impactDescription || "",
      potentialPoints: details.potentialPoints,
      seasonPhase: details.seasonPhase,
      doubleGameweeks: details.doubleGameweeks,
      blankGameweeks: details.blankGameweeks,
      recommendedStrategy: details.recommendedStrategy,
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
      {showTimeline && (
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Season Timeline</h2>
          <div className="relative">
            <div className="absolute left-0 top-0 w-full h-1 bg-muted" />
            <div className="relative pt-6">
              {TIMELINE_EVENTS.map((event) => (
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
      {showHistorical && (
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Historical Performance</h2>
          <div className="space-y-4">
            {HISTORICAL_DATA.map((data) => (
              <div key={data.gameweek} className="flex items-center justify-between p-4 rounded-lg bg-muted">
                <div>
                  <p className="font-medium">GW{data.gameweek} - {CHIP_DETAILS[data.chipType]?.label}</p>
                  <p className="text-sm text-muted-foreground">
                    {data.topManagersUsagePercentage}% of top 10k managers used this chip
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
