import { useQuery } from "@tanstack/react-query";
import { ChipsStatus } from "../components/ChipsStatus";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Zap, Calendar, TrendingUp, Users } from "lucide-react";
import { fetchMyTeam, fetchBootstrapStatic } from "../lib/api";
import { type Team } from "../types/fpl";

export default function ChipsStrategyPage() {
  const teamId = localStorage.getItem("fpl_team_id") ? parseInt(localStorage.getItem("fpl_team_id")!, 10) : null;

  const { data: team, isLoading: isLoadingTeam } = useQuery({
    queryKey: ["/api/fpl/my-team", teamId],
    queryFn: () => teamId ? fetchMyTeam(teamId) : null,
    enabled: !!teamId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const { data: bootstrapData, isLoading: isLoadingBootstrap } = useQuery({
    queryKey: ["/api/fpl/bootstrap-static"],
    queryFn: fetchBootstrapStatic,
    staleTime: 30 * 60 * 1000, // Cache for 30 minutes
  });

  if (isLoadingTeam || isLoadingBootstrap) {
    return <Skeleton className="h-[600px] w-full" />;
  }

  if (!team) {
    return (
      <Alert>
        <AlertDescription>Failed to load team data</AlertDescription>
      </Alert>
    );
  }

  // Get current gameweek and analyze team data
  const currentGameweek = bootstrapData?.events?.find((event: any) => event.is_current)?.id || 0;
  
  type ChipRecommendations = {
    [key: string]: string[];
    wildcard: string[];
    freehit: string[];
    bboost: string[];
    "3xc": string[];
  };

  const getTeamSpecificRecommendations = (team: Team, currentGameweek: number): ChipRecommendations => {
    const recommendations: ChipRecommendations = {
      wildcard: [],
      freehit: [],
      bboost: [],
      "3xc": [],
    };

    // Analyze team value trends for Wildcard recommendations
    const recentValueChange = team.stats.value - team.last_deadline_value;
    if (recentValueChange < -3) {
      recommendations.wildcard.push(`Your team value has dropped by £${(-recentValueChange/10).toFixed(1)}m - Wildcard could help recover value`);
    }

    // Analyze recent performance and trends with advanced metrics
    const recentPoints = team.points_history
      .slice(-3)
      .reduce((acc: number, gw: any) => acc + gw.points, 0) / 3;
    const avgPoints = team.stats.average_entry_score;
    const recentAverage = team.points_history
      .slice(-5)
      .reduce((acc: number, gw: any) => acc + gw.points, 0) / 5;
    const pointsTrend = recentPoints - recentAverage;
    
    // Analyze gameweek patterns and fixture difficulty
    const upcomingFixtures = bootstrapData?.events?.filter(event => event.id > currentGameweek).slice(0, 5) || [];
    const hasDoubleGameweeks = upcomingFixtures.some(event => 
      event.chip_plays?.some(chip => chip.num_played > chip.chip_name.includes('bboost') ? 100000 : 50000)
    );
    const hasBlankGameweeks = upcomingFixtures.some(event => 
      event.transfers_made > (event.average_entry_score || 0) * 1.5
    );
    const fixturesDifficulty = upcomingFixtures.reduce((acc, event) => 
      acc + (event.highest_score || 0) / (event.average_entry_score || 1), 0
    ) / upcomingFixtures.length;
    
    if (recentPoints < avgPoints - 15) {
      recommendations.wildcard.push(`Your recent average of ${Math.round(recentPoints)} points is significantly below the game average of ${avgPoints}`);
      if (pointsTrend < -5) {
        recommendations.wildcard.push(`Your form is declining (down ${Math.abs(Math.round(pointsTrend))} points vs 5-week average) - Consider using Wildcard to reset team structure`);
      }
    }

    // Analyze upcoming fixtures and provide strategic recommendations
    if (hasDoubleGameweeks) {
      if (fixturesDifficulty < 1.2) {
        recommendations.bboost.push("Double gameweeks approaching with favorable fixtures - Consider Bench Boost");
        recommendations["3xc"].push("Double gameweeks ahead with good matchups - Ideal for Triple Captain");
      } else {
        recommendations.bboost.push("Double gameweeks approaching but fixtures are tough - Save Bench Boost for better opportunities");
        recommendations["3xc"].push("Double gameweeks ahead but consider fixture difficulty before using Triple Captain");
      }
    }
    
    if (hasBlankGameweeks) {
      const blankSeverity = upcomingFixtures.filter(event => 
        event.transfers_made > (event.average_entry_score || 0) * 1.5
      ).length;
      
      if (blankSeverity >= 2) {
        recommendations.freehit.push("Multiple blank gameweeks detected - Free Hit essential for navigating fixture disruption");
      } else {
        recommendations.freehit.push("Blank gameweek detected - Consider Free Hit if team heavily affected");
      }
    }
    
    if (fixturesDifficulty > 1.3) {
      recommendations.freehit.push("Upcoming fixtures look difficult - Free Hit could help target easier matchups");
    }
    
    if (recentPoints < avgPoints - 15) {
      recommendations.wildcard.push(`Your recent average of ${Math.round(recentPoints)} points is significantly below the game average of ${avgPoints}`);
    }

    // Analyze bench points history and trends with advanced metrics
    const benchPoints = team.stats.points_on_bench;
    const recentBenchPoints = team.points_history
      .slice(-4)
      .reduce((acc: number, gw: any) => acc + (gw.points_on_bench || 0), 0) / 4;
    const benchTrend = recentBenchPoints - (team.points_history
      .slice(-8, -4)
      .reduce((acc: number, gw: any) => acc + (gw.points_on_bench || 0), 0) / 4);
    
    if (benchPoints > 20 && recentBenchPoints > 15) {
      recommendations.bboost.push(`Strong bench performance with ${benchPoints} points on bench and ${Math.round(recentBenchPoints)} average in last 4 GWs - Consider Bench Boost soon`);
      if (benchTrend > 5) {
        recommendations.bboost.push(`Your bench performance is improving (up by ${Math.round(benchTrend)} points on average) - Bench Boost could be very effective`);
      }
    } else if (benchPoints > 15 && recentBenchPoints > 10) {
      recommendations.bboost.push(`Decent bench returns with ${benchPoints} points - Monitor for potential Bench Boost`);
    }

    // Analyze transfer history and team structure
    const recentTransfers = team.points_history
      .slice(-5)
      .reduce((acc: number, gw: any) => acc + (gw.event_transfers_cost || 0), 0);
    const transferTrend = recentTransfers - team.points_history
      .slice(-10, -5)
      .reduce((acc: number, gw: any) => acc + (gw.event_transfers_cost || 0), 0);
    
    if (recentTransfers > 12) {
      recommendations.wildcard.push(`You've spent ${recentTransfers} points on transfers recently - Wildcard could help stabilize team structure`);
      if (transferTrend > 8) {
        recommendations.wildcard.push(`Transfer cost trend is increasing (up by ${transferTrend} points) - Consider Wildcard to reset transfer strategy`);
      }
    }

    // Analyze captain performance and trends with historical context
    const captain = team.picks.find(p => p.is_captain);
    if (captain) {
      const captainPoints = captain.multiplier * (captain.event_points || 0);
      const recentCaptainPerformance = team.points_history
        .slice(-3)
        .reduce((acc: number, gw: any) => acc + (gw.points - gw.points_on_bench || 0), 0) / 3;
      
      if (captainPoints > 24 && recentCaptainPerformance > avgPoints * 1.2) {
        recommendations["3xc"].push(`Your captain (${captainPoints} points) and overall team form (${Math.round(recentCaptainPerformance)} avg) are strong - Consider Triple Captain`);
      }
    }

    // Free Hit recommendations based on comprehensive team analysis
    const transferIssues = [];
    if (team.transfers.bank < 4) transferIssues.push("limited budget");
    if (team.transfers.limit < 2) transferIssues.push("few free transfers");
    if (team.stats.value_form && team.stats.value_form < 0.5) transferIssues.push("poor team form");
    if (recentPoints < avgPoints - 10) transferIssues.push("below average performance");
    
    if (transferIssues.length >= 2) {
      recommendations.freehit.push(
        `Multiple team constraints (${transferIssues.join(", ")}) - Free Hit could provide temporary flexibility`
      );
    }

    // Rank-based strategy recommendations with dynamic thresholds
    const overallRank = team.summary_overall_rank;
    const rankPercentile = (overallRank / 10000000) * 100; // Assuming 10M total players
    const rankTrend = team.points_history
      .slice(-3)
      .reduce((acc: number, gw: any) => acc + (gw.rank || 0), 0) / 3 - overallRank;

    if (rankPercentile > 90) { // Bottom 10%
      recommendations.wildcard.push(`Current rank in bottom ${Math.round(100-rankPercentile)}% - Consider aggressive team restructure with Wildcard`);
      recommendations["3xc"].push(`Consider aggressive Triple Captain on high-performing premium player to climb ranks`);
      if (rankTrend < -100000) { // Rank improving
        recommendations.wildcard.push(`Your rank is improving rapidly (up ${Math.abs(Math.round(rankTrend))} places on average) - Use Wildcard to maintain momentum`);
      }
    } else if (rankPercentile < 10) { // Top 10%
      recommendations.freehit.push(`Strong overall rank (top ${Math.round(rankPercentile)}%) - Consider Free Hit to maintain position in key gameweeks`);
      recommendations["3xc"].push(`With your high rank, saving Triple Captain for double gameweeks could be optimal`);
      if (rankTrend > 50000) { // Rank declining
        recommendations.wildcard.push(`Your rank has dropped by ${Math.round(rankTrend)} places on average - Consider Wildcard to protect position`);
      }
    }

    return recommendations;
  };

  const chipStrategies = [
    {
      name: "Wildcard",
      description: "Complete team overhaul - use during fixture swings or major team issues",
      icon: <TrendingUp className="w-5 h-5 text-primary" />,
      bestTiming: [
        "Around GW 16-20 for second half optimization",
        "After major blanks/doubles announcement",
        "When team value can be significantly improved",
        "When 4+ transfers are needed"
      ],
      considerations: [
        "Consider future fixture swings",
        "Plan for upcoming blank/double gameweeks",
        "Monitor price changes and team value",
        "Check injury news and team rotations"
      ]
    },
    {
      name: "Free Hit",
      description: "One-week team transformation - ideal for blank/double gameweeks",
      icon: <Calendar className="w-5 h-5 text-primary" />,
      bestTiming: [
        "During significant blank gameweeks",
        "In big double gameweeks",
        "When many key players have difficult fixtures",
        "For maximum point potential in crucial gameweeks"
      ],
      considerations: [
        "Compare potential points gain vs saving for later",
        "Check fixture difficulty of targeted players",
        "Consider form of available players",
        "Evaluate opposition managers' chip strategies"
      ]
    },
    {
      name: "Triple Captain",
      description: "Triple points for your captain - maximize on double gameweeks",
      icon: <Zap className="w-5 h-5 text-primary" />,
      bestTiming: [
        "During double gameweeks for premium players",
        "When top scorer has favorable fixtures",
        "Against defensively weak teams",
        "In crucial differential moments"
      ],
      considerations: [
        "Check fixture difficulty",
        "Verify player's recent form",
        "Consider rotation risks",
        "Compare with other premium options"
      ]
    },
    {
      name: "Bench Boost",
      description: "All bench players score points - maximize bench potential",
      icon: <Users className="w-5 h-5 text-primary" />,
      bestTiming: [
        "During double gameweeks",
        "When bench has good fixtures",
        "After wildcard optimization",
        "When all 15 players are likely to play"
      ],
      considerations: [
        "Ensure all players have fixtures",
        "Check for rotation risks",
        "Verify double gameweek potential",
        "Consider bench player form"
      ]
    }
  ];

  const teamRecommendations = getTeamSpecificRecommendations(team, currentGameweek);

  return (
    <div className="container mx-auto max-w-7xl py-6 space-y-8">
      <div className="flex flex-col gap-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-500 via-primary to-blue-500 bg-clip-text text-transparent">
          Chips Strategy
        </h1>
        <p className="text-lg text-muted-foreground">
          Personalized chip recommendations based on your team's performance
        </p>
      </div>
      
      <div className="grid gap-6">
        <ChipsStatus chips={team.chips} />

        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Strategy Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Currently in Gameweek {currentGameweek} - Plan your chip strategy carefully for maximum impact
            </p>
            <Alert>
              <AlertDescription className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Upcoming double gameweeks and blank gameweeks will be crucial for chip deployment
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          {chipStrategies.map((strategy) => (
            <Card key={strategy.name} className="group hover:shadow-lg transition-all duration-300 hover:border-primary/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300">
                    {strategy.icon}
                  </div>
                  <span className="bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">
                    {strategy.name}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                  {strategy.description}
                </p>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Best Timing</h3>
                    <ScrollArea className="h-32 rounded-md border p-4">
                      <ul className="space-y-2">
                        {strategy.bestTiming.map((timing, index) => (
                          <li key={index} className="text-sm">
                            • {timing}
                          </li>
                        ))}
                      </ul>
                    </ScrollArea>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Key Considerations</h3>
                    <ScrollArea className="h-32 rounded-md border p-4">
                      <ul className="space-y-2">
                        {strategy.considerations.map((consideration, index) => (
                          <li key={index} className="text-sm">
                            • {consideration}
                          </li>
                        ))}
                      </ul>
                    </ScrollArea>
                  </div>

                  {teamRecommendations[strategy.name.toLowerCase().replace(' ', '')] && 
                   teamRecommendations[strategy.name.toLowerCase().replace(' ', '')].length > 0 && (
                    <div className="mt-4">
                      <h3 className="font-semibold mb-2 text-primary">Personal Recommendations</h3>
                      <div className="rounded-md border border-primary/20 bg-primary/5 p-4">
                        <ul className="space-y-2">
                          {teamRecommendations[strategy.name.toLowerCase().replace(' ', '')].map((rec: string, index: number) => (
                            <li key={index} className="text-sm flex items-center gap-2">
                              <Zap className="w-4 h-4 text-primary" />
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}