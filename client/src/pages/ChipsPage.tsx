import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Rocket, Calendar, Trophy, TrendingUp, Star, AlertTriangle, ArrowLeft } from "lucide-react";
import { fetchMyTeam } from "../lib/api";

interface ChipAnalysis {
  name: string;
  averagePoints: number;
  bestGameweek: number;
  recommendedGameweek: number;
  status: "available" | "used" | "expired";
  description: string;
  icon: typeof Rocket;
}

function getChipAnalytics(teamChips: any[]): ChipAnalysis[] {
  const baseChips = [
    {
      name: "wildcard",
      label: "Wildcard",
      averagePoints: 82,
      bestGameweek: 8,
      recommendedGameweek: 16,
      description: "Complete team overhaul - Ideal for upcoming fixture swings (GW16-20) with Arsenal, Liverpool, and Man City having favorable runs",
      icon: Star
    },
    {
      name: "freehit",
      label: "Free Hit",
      averagePoints: 76,
      bestGameweek: 12,
      recommendedGameweek: 29,
      description: "Temporary team change - ideal for blank/double gameweeks",
      icon: Rocket
    },
    {
      name: "3xc",
      label: "Triple Captain",
      averagePoints: 45,
      bestGameweek: 21,
      recommendedGameweek: 25,
      description: "3x points for your captain - use during double gameweeks for maximum impact",
      icon: Trophy
    },
    {
      name: "bboost",
      label: "Bench Boost",
      averagePoints: 38,
      bestGameweek: 26,
      recommendedGameweek: 34,
      description: "All bench players score points - best used during double gameweeks",
      icon: TrendingUp
    }
  ];

  return baseChips.map(chip => {
    const usedChip = teamChips.find(c => c.name === chip.name);
    return {
      ...chip,
      status: usedChip ? "used" : "available",
      usedInGameweek: usedChip?.event || null,
      description: usedChip 
        ? `Used in Gameweek ${usedChip.event}. ${chip.description}`
        : chip.description
    };
  });
}

const doubleGameweeks = [
  { 
    week: 25, 
    teams: ["ARS", "CHE", "LIV", "MUN"], 
    potential: 85,
    chips: ["Triple Captain", "Bench Boost"],
    reasoning: "High-scoring teams with strong fixtures, ideal for TC on premium assets"
  },
  { 
    week: 34, 
    teams: ["MCI", "NEW", "TOT", "WHU"], 
    potential: 78,
    chips: ["Bench Boost", "Free Hit"],
    reasoning: "Multiple teams with good fixtures, maximize points with full squad"
  },
];

const blankGameweeks = [
  { week: 29, teams: ["ARS", "CHE", "LIV", "MUN"], impact: "High" },
  { week: 32, teams: ["MCI", "NEW"], impact: "Medium" },
];

function ChipCard({ chip, doubleGameweeks }: { chip: ChipAnalysis; doubleGameweeks: any[] }) {
  const recommendedWeeks = doubleGameweeks
    .filter(gw => gw.chips.includes(chip.label))
    .map(gw => gw.week);
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <chip.icon className="w-5 h-5 text-primary" />
            <CardTitle>{chip.label}</CardTitle>
          </div>
          <Badge 
            variant={chip.status === "available" ? "default" : "secondary"}
            className={chip.status === "used" ? "gap-2" : ""}
          >
            {chip.status}
            {chip.status === "used" && (
              <span className="text-xs">GW {chip.usedInGameweek}</span>
            )}
          </Badge>
        </div>
        <CardDescription>{chip.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Avg. Points Impact</p>
              <p className="text-2xl font-bold">+{chip.averagePoints}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Best Gameweek</p>
              <p className="text-2xl font-bold">{chip.bestGameweek}</p>
            </div>
          </div>
          {chip.status === "available" && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Recommended Timing</span>
                <span className="text-sm font-medium">GW {chip.recommendedGameweek}</span>
              </div>
              <Progress 
                value={(chip.recommendedGameweek / 38) * 100} 
                className="h-2"
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function ChipsPage() {
  const { data: team, isLoading } = useQuery({
    queryKey: ["/api/fpl/my-team/1"],
    queryFn: () => fetchMyTeam(1)
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-[250px]" />
          ))}
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Failed to load team data</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/team">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Chip Strategy</h1>
      </div>

      <Tabs defaultValue="chips" className="space-y-6">
        <TabsList>
          <TabsTrigger value="chips">
            <Rocket className="w-4 h-4 mr-2" />
            Available Chips
          </TabsTrigger>
          <TabsTrigger value="gameweeks">
            <Calendar className="w-4 h-4 mr-2" />
            Key Gameweeks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chips">
          <div className="grid gap-6 md:grid-cols-2">
            {getChipAnalytics(team.chips || []).map(chip => (
              <ChipCard 
                key={chip.name} 
                chip={chip} 
                doubleGameweeks={doubleGameweeks}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="gameweeks">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  <CardTitle>Double Gameweeks</CardTitle>
                </div>
                <CardDescription>
                  Teams playing twice - great opportunities for chip usage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {doubleGameweeks.map(gw => (
                    <div key={gw.week} className="flex items-center gap-4">
                      <div className="bg-primary/10 rounded-lg p-3">
                        <span className="font-bold">GW{gw.week}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-wrap gap-2">
                          {gw.teams.map(team => (
                            <Badge key={team} variant="outline">{team}</Badge>
                          ))}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Potential Points</div>
                        <div className="font-bold text-green-500">+{gw.potential}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  <CardTitle>Blank Gameweeks</CardTitle>
                </div>
                <CardDescription>
                  Teams without fixtures - plan transfers accordingly
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {blankGameweeks.map(gw => (
                    <div key={gw.week} className="flex items-center gap-4">
                      <div className="bg-primary/10 rounded-lg p-3">
                        <span className="font-bold">GW{gw.week}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-wrap gap-2">
                          {gw.teams.map(team => (
                            <Badge key={team} variant="outline">{team}</Badge>
                          ))}
                        </div>
                      </div>
                      <Badge 
                        variant={gw.impact === "High" ? "destructive" : "secondary"}
                      >
                        {gw.impact} Impact
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
