import { useQuery } from "@tanstack/react-query";
import { ChipsStatus } from "../components/ChipsStatus";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  History,
  Calendar,
  ArrowUpRight,
  ChevronDown,
} from "lucide-react";
import { Link } from "wouter";
import { TeamStats } from "../components/TeamStats";
import { CHIP_STRATEGIES } from "../constants/chipStrategies";
import { getTeamSpecificRecommendations } from "../utils/chipRecommendations";
import { fetchMyTeam, fetchBootstrapStatic } from "../lib/api";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

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
      <div className="p-6">
        <Alert>
          <AlertDescription>
            Please connect your FPL account to view chip strategy recommendations.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const currentGameweek = bootstrapData?.events?.find((event) => event.is_current)?.id || 0;
  
  if (!bootstrapData?.events || !team.stats || !team.chips) {
    return (
      <div className="p-6">
        <Alert>
          <AlertDescription>
            Loading game data... This may take a moment.
          </AlertDescription>
        </Alert>
        <div className="grid gap-6 mt-6">
          <Skeleton className="h-[200px]" />
          <Skeleton className="h-[400px]" />
        </div>
      </div>
    );
  }

  const teamRecommendations = getTeamSpecificRecommendations(team, currentGameweek);

  return (
    <div className="p-6 space-y-8">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Link 
            href="/team" 
            className="p-2 rounded-lg hover:bg-primary/10 transition-colors duration-200"
          >
            <ArrowUpRight className="w-5 h-5" />
          </Link>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-500 via-primary to-blue-500 bg-clip-text text-transparent">
            Chips Strategy
          </h1>
        </div>
        <p className="text-lg text-muted-foreground">
          Personalized chip recommendations based on your team's performance
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <ChipsStatus chips={team.chips} />
          <Progress 
            value={(team.chips.length / 4) * 100} 
            className="h-2 w-full"
          />
          <p className="text-sm text-muted-foreground text-center">
            {4 - team.chips.length} chips remaining
          </p>
        </div>

        {team.chips.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5 text-primary" />
                Chip Usage Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative pb-12">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
                <div className="space-y-8">
                  {team.chips.map((chip, index) => (
                    <div key={chip.name} className="relative">
                      <div className="absolute left-0 w-8 h-8 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center">
                        <span className="text-xs font-bold">{index + 1}</span>
                      </div>
                      <div className="ml-12 space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium">{chip.name.toUpperCase()}</h3>
                          <Badge>GW {chip.event}</Badge>
                        </div>
                        <Progress 
                          value={((chip.event - 1) / 38) * 100} 
                          className="h-2"
                        />
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>Season Progress</span>
                          <span>{((chip.event - 1) / 38 * 100).toFixed(1)}%</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Used on {new Date(chip.time).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Strategy Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground">
                  Gameweek {currentGameweek}
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">
                    Overall Rank: #{team.summary_overall_rank.toLocaleString()}
                  </p>
                  <Badge variant={team.summary_overall_rank < 100000 ? "default" : "secondary"}>
                    Top {((team.summary_overall_rank / 10000000) * 100).toFixed(1)}%
                  </Badge>
                </div>
              </div>
              <TeamStats team={team} />
            </div>
            
            <ScrollArea className="h-[600px] pr-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {CHIP_STRATEGIES.map((strategy, index) => {
                  const recommendations = teamRecommendations[strategy.chipName] || [];
                  const isUsed = team.chips.some(chip => chip.name === strategy.chipName);
                  
                  const order = strategy.chipName === 'wildcard' ? 0 
                    : strategy.chipName === 'freehit' ? 1
                    : strategy.chipName === '3xc' ? 2
                    : 3;
                  
                  return (
                    <Card 
                      key={strategy.chipName} 
                      className={`${isUsed ? "opacity-50" : ""}`}
                      style={{ order }}
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2">
                          {strategy.icon}
                          {strategy.name}
                          {isUsed && <Badge variant="outline">Used</Badge>}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                          {strategy.description}
                        </p>
                        
                        <Accordion type="single" collapsible className="space-y-2">
                          {!isUsed && recommendations.length > 0 && (
                            <AccordionItem value="recommendations" className="border-none">
                              <AccordionTrigger className="py-2 hover:no-underline">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">Recommendations</span>
                                  <Badge variant="secondary" className="ml-2">
                                    {recommendations.length}
                                  </Badge>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent>
                                <ul className="grid gap-2 pl-4">
                                  {recommendations.map((rec, index) => (
                                    <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                                      <span className="text-primary">•</span>
                                      <span>{rec}</span>
                                    </li>
                                  ))}
                                </ul>
                              </AccordionContent>
                            </AccordionItem>
                          )}

                          <AccordionItem value="timing" className="border-none">
                            <AccordionTrigger className="py-2 hover:no-underline">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">Best Timing</span>
                                <Badge variant="secondary" className="ml-2">
                                  {strategy.bestTiming.length}
                                </Badge>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <ul className="grid gap-2 pl-4">
                                {strategy.bestTiming.map((timing, index) => (
                                  <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                                    <span className="text-primary">•</span>
                                    <span>{timing}</span>
                                  </li>
                                ))}
                              </ul>
                            </AccordionContent>
                          </AccordionItem>

                          <AccordionItem value="considerations" className="border-none">
                            <AccordionTrigger className="py-2 hover:no-underline">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">Key Considerations</span>
                                <Badge variant="secondary" className="ml-2">
                                  {strategy.considerations.length}
                                </Badge>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <ul className="grid gap-2 pl-4">
                                {strategy.considerations.map((consideration, index) => (
                                  <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                                    <span className="text-primary">•</span>
                                    <span>{consideration}</span>
                                  </li>
                                ))}
                              </ul>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
