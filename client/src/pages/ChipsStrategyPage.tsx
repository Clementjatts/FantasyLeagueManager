import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ChipsStatus } from "@/components/ChipsStatus";
import { ChipAdvisor } from "@/components/ChipAdvisor";
import {
  Rocket,
  Users,
  AlertCircle,
  Timer,
  Target,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchBootstrapStatic, fetchMyTeam } from "@/lib/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface ChipAdvice {
  name: string;
  label: string;
  bestTimings: string[];
  considerations: string[];
  currentAdvice: string;
}

const CHIP_ADVICE: ChipAdvice[] = [
  {
    name: "wildcard",
    label: "Wildcard",
    bestTimings: [
      "During international breaks when player prices are volatile",
      "Before a significant fixture swing for key teams",
      "Around GW 30-32 to prepare for blank/double gameweeks",
    ],
    considerations: [
      "Team value and price changes",
      "Upcoming fixture difficulty",
      "Blank and double gameweeks",
      "Team performance trends",
    ],
    currentAdvice: "Monitor upcoming fixture swings and international breaks",
  },
  {
    name: "freehit",
    label: "Free Hit",
    bestTimings: [
      "During major blank gameweeks",
      "During attractive double gameweeks",
      "When your team is heavily affected by postponements",
    ],
    considerations: [
      "Number of players available for the gameweek",
      "Quality of double gameweek fixtures",
      "Potential points hits avoided",
    ],
    currentAdvice: "Save for blank or double gameweeks unless emergency",
  },
  {
    name: "bboost",
    label: "Bench Boost",
    bestTimings: [
      "During a double gameweek",
      "When all 15 players have favorable fixtures",
      "After using a Wildcard to set up bench",
    ],
    considerations: [
      "Fixture quality for all 15 players",
      "Rotation risks",
      "Double gameweek opportunities",
    ],
    currentAdvice: "Best used in conjunction with Wildcard planning",
  },
  {
    name: "3xc",
    label: "Triple Captain",
    bestTimings: [
      "Premium player with double gameweek",
      "Strong fixture against bottom-table team",
      "In-form player with high ceiling",
    ],
    considerations: [
      "Player's recent form",
      "Fixture difficulty",
      "Historical performance vs opponent",
      "Double gameweek potential",
    ],
    currentAdvice: "Target premium players in double gameweeks",
  },
  {
    name: "manager",
    label: "Assistant Manager",
    bestTimings: [
      "When you can't make the deadline",
      "During busy periods with multiple deadlines",
      "When you're unavailable or on holiday",
    ],
    considerations: [
      "Team setup before activation",
      "Upcoming fixture difficulty",
      "Player rotation risks",
    ],
    currentAdvice: "Use when you can't actively manage your team",
  },
];

export default function ChipsStrategyPage() {
  const teamId = localStorage.getItem("fpl_team_id");

  const { data: bootstrapStatic, isLoading: isLoadingBootstrap } = useQuery({
    queryKey: ["bootstrap-static"],
    queryFn: fetchBootstrapStatic,
  });

  const { 
    data: team, 
    isLoading: isLoadingTeam,
    error: teamError
  } = useQuery({
    queryKey: ["my-team", teamId],
    queryFn: () => teamId ? fetchMyTeam(parseInt(teamId, 10)) : null,
    enabled: !!teamId
  });

  // If there's no team ID, show guidance
  if (!teamId) {
    return (
      <div className="container py-8 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Chips Strategy</h1>
          <p className="text-muted-foreground">
            Monitor your chip status and see how other managers are using their chips
          </p>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please set your FPL Team ID in the settings to view your chips strategy.
            You can find your Team ID by going to the Points tab on the FPL website 
            and looking at the number in the URL.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // If there's an error fetching team data
  if (teamError) {
    return (
      <div className="container py-8 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Chips Strategy</h1>
          <p className="text-muted-foreground">
            Monitor your chip status and see how other managers are using their chips
          </p>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to fetch team data. Please ensure your team ID ({teamId}) is correct and try again.
            {teamError instanceof Error ? ` Error: ${teamError.message}` : ''}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const currentGameweek = bootstrapStatic?.events?.find((event) => event.is_current);
  const currentGameweekStats = currentGameweek?.chip_plays || [];

  // Calculate season totals
  const seasonTotals = bootstrapStatic?.events?.reduce((acc, event) => {
    event.chip_plays.forEach(play => {
      if (!acc[play.chip_name]) {
        acc[play.chip_name] = { num_played: 0, total_points: 0, count_with_points: 0 };
      }
      acc[play.chip_name].num_played += play.num_played;
      if (play.average_entry_score) {
        acc[play.chip_name].total_points += play.average_entry_score * play.num_played;
        acc[play.chip_name].count_with_points += play.num_played;
      }
    });
    return acc;
  }, {} as Record<string, { num_played: number; total_points: number; count_with_points: number }>);

  const getUsagePercentage = (chipName: string, count: number) => {
    if (!bootstrapStatic?.total_players) return 0;
    return (count / bootstrapStatic.total_players) * 100;
  };

  if (isLoadingBootstrap || isLoadingTeam) {
    return (
      <div className="container py-8 space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-8 w-[200px]" />
          <Skeleton className="h-4 w-[300px]" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-[200px] w-full" />
          <Skeleton className="h-[200px] w-full" />
        </div>
      </div>
    );
  }

  if (!bootstrapStatic || !team) {
    return (
      <div className="container py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load FPL data. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Chips Strategy</h1>
        <p className="text-muted-foreground">
          Monitor your chip status and see how other managers are using their chips
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* Top Section - Chips Status */}
        <ChipsStatus chips={team?.chips || []} />

        {/* Chip Advisor */}
        <ChipAdvisor 
          chips={team?.chips || []} 
          currentGameweek={currentGameweek?.id}
          bootstrapStatic={bootstrapStatic}
          team={team}
        />

        {/* Bottom Section - Community Stats */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <CardTitle>Community Insights</CardTitle>
              </div>
              <Badge variant="outline" className="text-xs">
                GW {currentGameweek?.id}
              </Badge>
            </div>
            <CardDescription className="mt-1">
              Chip usage statistics for current gameweek and season
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {currentGameweekStats.map((stat) => {
                const percentage = getUsagePercentage(stat.chip_name, stat.num_played);
                const seasonTotal = seasonTotals?.[stat.chip_name];
                const seasonPercentage = seasonTotal ? getUsagePercentage(stat.chip_name, seasonTotal.num_played) : 0;
                const averagePoints = seasonTotal?.count_with_points 
                  ? (seasonTotal.total_points / seasonTotal.count_with_points).toFixed(1) 
                  : null;
                const chipLabel = CHIP_ADVICE.find(c => c.name === stat.chip_name)?.label;
                
                return (
                  <div 
                    key={stat.chip_name} 
                    className="space-y-4 p-3 rounded-lg bg-muted/30 border border-border/50 transition-all duration-300 hover:border-primary/30"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-sm">{chipLabel}</span>
                        <Badge variant="secondary" className="text-xs">
                          {stat.num_played.toLocaleString()} this GW
                        </Badge>
                      </div>
                      <div className="relative">
                        <Progress 
                          value={percentage} 
                          className="h-2 bg-primary/10" 
                        />
                        <div 
                          className="absolute -top-1 left-0 h-3 w-0.5 bg-primary rounded-full transition-all"
                          style={{ left: `${percentage}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                        <span>{percentage.toFixed(2)}% usage</span>
                        {stat.average_entry_score && (
                          <span>{stat.average_entry_score} pts avg</span>
                        )}
                      </div>
                    </div>

                    {seasonTotal && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-muted-foreground">Season Total</span>
                          <Badge variant="outline" className="text-xs">
                            {seasonTotal.num_played.toLocaleString()} total
                          </Badge>
                        </div>
                        <div className="relative">
                          <Progress 
                            value={seasonPercentage} 
                            className="h-2 bg-primary/10" 
                          />
                          <div 
                            className="absolute -top-1 left-0 h-3 w-0.5 bg-primary rounded-full transition-all"
                            style={{ left: `${seasonPercentage}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                          <span>{seasonPercentage.toFixed(2)}% used</span>
                          {averagePoints && (
                            <span>{averagePoints} pts avg</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
