import { useQuery } from "@tanstack/react-query";
import { ChipsStatus } from "../components/ChipsStatus";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Zap, Calendar, TrendingUp, Users } from "lucide-react";
import { fetchMyTeam, fetchBootstrapStatic } from "../lib/api";

export default function ChipsStrategyPage() {
  const teamId = localStorage.getItem("fpl_team_id") ? parseInt(localStorage.getItem("fpl_team_id")!, 10) : null;

  const { data: team, isLoading: isLoadingTeam } = useQuery({
    queryKey: ["/api/fpl/my-team", teamId],
    queryFn: () => teamId ? fetchMyTeam(teamId) : null,
    enabled: !!teamId
  });

  const { data: bootstrapData, isLoading: isLoadingBootstrap } = useQuery({
    queryKey: ["/api/fpl/bootstrap-static"],
    queryFn: fetchBootstrapStatic,
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

  // Get current gameweek
  const currentGameweek = bootstrapData?.events?.find((event: any) => event.is_current)?.id || 0;

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

  return (
    <div className="container mx-auto max-w-7xl py-6 space-y-8">
      <div className="flex flex-col gap-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-500 via-primary to-blue-500 bg-clip-text text-transparent">
          Chips Strategy
        </h1>
        <p className="text-lg text-muted-foreground">
          Maximize your FPL points by utilizing chips at the optimal moments
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
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
