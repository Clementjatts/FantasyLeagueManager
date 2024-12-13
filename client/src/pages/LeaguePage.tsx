import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Users, ArrowRight, ArrowDown, ArrowUp } from "lucide-react";
import { fetchLeagues, fetchLeagueStandings, fetchCupMatches } from "../lib/api";
import type { League, LeagueStanding, CupMatch } from "../types/fpl";

function RankChange({ current, last }: { current: number; last: number }) {
  if (current === last) return <span className="text-muted-foreground">→</span>;
  
  const diff = last - current;
  const color = diff > 0 ? "text-green-500" : "text-red-500";
  const Icon = diff > 0 ? ArrowUp : ArrowDown;
  
  return (
    <span className={`flex items-center gap-1 ${color}`}>
      <Icon className="w-4 h-4" />
      {Math.abs(diff)}
    </span>
  );
}

function LeagueTable({ standings }: { standings: LeagueStanding[] }) {
  return (
    <div className="relative overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left py-3 px-4">Rank</th>
            <th className="text-left py-3 px-4">Team</th>
            <th className="text-right py-3 px-4">Points</th>
            <th className="text-right py-3 px-4">Behind</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((standing) => (
            <tr
              key={standing.entry}
              className="border-b hover:bg-muted/50 transition-colors"
            >
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  {standing.rank}
                  <RankChange current={standing.rank} last={standing.last_rank} />
                </div>
              </td>
              <td className="py-3 px-4">
                <div>
                  <div className="font-medium">{standing.entry_name}</div>
                  <div className="text-sm text-muted-foreground">
                    {standing.player_name}
                  </div>
                </div>
              </td>
              <td className="py-3 px-4 text-right font-medium">
                {standing.total}
              </td>
              <td className="py-3 px-4 text-right text-muted-foreground">
                {standing.points_behind_leader > 0 && 
                  `${standing.points_behind_leader} pts`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CupProgress({ matches }: { matches: CupMatch[] }) {
  const rounds = matches.reduce((acc, match) => {
    (acc[match.round] = acc[match.round] || []).push(match);
    return acc;
  }, {} as Record<number, CupMatch[]>);

  return (
    <div className="space-y-6">
      {Object.entries(rounds).map(([round, matches]) => (
        <Card key={round}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Round {round}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {matches.map((match) => (
              <div
                key={match.id}
                className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
              >
                <div className="space-y-1">
                  <div className="font-medium">{match.entry_1_name}</div>
                  <div className="text-sm text-muted-foreground">
                    {match.entry_1_player_name}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-xl font-bold">
                    {match.entry_1_points} - {match.entry_2_points}
                  </div>
                </div>
                <div className="space-y-1 text-right">
                  <div className="font-medium">{match.entry_2_name}</div>
                  <div className="text-sm text-muted-foreground">
                    {match.entry_2_player_name}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function LeaguePage() {
  const [selectedLeague, setSelectedLeague] = useState<number | null>(null);

  const [teamId, setTeamId] = useState(() => {
    const savedId = localStorage.getItem("fpl_team_id");
    return savedId ? parseInt(savedId, 10) : null;
  });

  const { data: leagues, isLoading: isLoadingLeagues } = useQuery({
    queryKey: ["/api/fpl/leagues", teamId],
    queryFn: () => teamId ? fetchLeagues(teamId) : Promise.resolve([]),
    enabled: !!teamId,
  });

  const { data: standings, isLoading: isLoadingStandings } = useQuery({
    queryKey: ["/api/fpl/leagues", selectedLeague, "standings"],
    queryFn: () => 
      selectedLeague ? fetchLeagueStandings(selectedLeague) : Promise.resolve([]),
    enabled: !!selectedLeague,
  });

  const { data: cupMatches, isLoading: isLoadingCup } = useQuery({
    queryKey: ["/api/fpl/cup", teamId],
    queryFn: () => teamId ? fetchCupMatches(teamId) : Promise.resolve([]),
    enabled: !!teamId,
  });

  if (isLoadingLeagues) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  if (!teamId) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Leagues & Cups</h1>
        <Card>
          <CardContent className="p-6">
            <div className="text-center space-y-2">
              <Users className="w-12 h-12 mx-auto text-muted-foreground" />
              <h2 className="text-2xl font-semibold">No Team Selected</h2>
              <p className="text-muted-foreground">
                Please go to the Dashboard and enter your FPL team ID first
              </p>
              <Link href="/">
                <Button className="mt-4">Go to Dashboard</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!leagues?.length) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Leagues & Cups</h1>
        <Card>
          <CardContent className="p-6">
            <div className="text-center space-y-2">
              <Users className="w-12 h-12 mx-auto text-muted-foreground" />
              <h2 className="text-2xl font-semibold">No Leagues Found</h2>
              <p className="text-muted-foreground">
                Join a league to compete with other managers
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Leagues & Cups</h1>
        {selectedLeague && (
          <Badge variant="outline" className="text-lg">
            {leagues.find(l => l.id === selectedLeague)?.name}
          </Badge>
        )}
      </div>

      <Tabs defaultValue="leagues" className="space-y-6">
        <TabsList>
          <TabsTrigger value="leagues">
            <Users className="w-4 h-4 mr-2" />
            Leagues
          </TabsTrigger>
          <TabsTrigger value="cup">
            <Trophy className="w-4 h-4 mr-2" />
            Cup
          </TabsTrigger>
        </TabsList>

        <TabsContent value="leagues">
          <div className="space-y-6">
            {!selectedLeague ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {leagues.map((league) => (
                  <Card
                    key={league.id}
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => setSelectedLeague(league.id)}
                  >
                    <CardHeader>
                      <CardTitle>{league.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Type</span>
                          <Badge variant="outline">
                            {league.type === 'h2h' ? 'Head-to-Head' : 'Classic'}
                          </Badge>
                        </div>
                        {league.type === 'h2h' && (
                          <Progress value={70} className="h-2" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {isLoadingStandings ? (
                  <Skeleton className="h-[400px]" />
                ) : (
                  <LeagueTable standings={standings || []} />
                )}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="cup">
          {isLoadingCup ? (
            <Skeleton className="h-[400px]" />
          ) : cupMatches?.length ? (
            <CupProgress matches={cupMatches} />
          ) : (
            <Card>
              <CardContent className="p-6">
                <div className="text-center space-y-2">
                  <Trophy className="w-12 h-12 mx-auto text-muted-foreground" />
                  <h2 className="text-2xl font-semibold">Cup Not Started</h2>
                  <p className="text-muted-foreground">
                    The FPL Cup will begin in a future gameweek
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
