import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Link, useLocation } from "wouter";
import { TeamPitch } from "../components/TeamPitch";
import { TransferSuggestions } from "../components/TransferSuggestions";
import { CaptainSuggestions } from "../components/CaptainSuggestions";
import { PlayerStats } from "../components/PlayerStats";
import { fetchMyTeam, fetchPlayers, updateCaptains, fetchBootstrapStatic, fetchFixtures } from "../lib/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CaptainDialog } from "../components/CaptainDialog";
import { type Player } from "../types/fpl";
import { useToast } from "@/hooks/use-toast";
interface OptimalTeam {
  firstTeam: Player[];
  substitutes: Player[];
  captainId: number;
  viceCaptainId: number;
  formation: string;
  totalPoints: number;
}

function calculateOptimalTeam(allPlayers: Player[], fixtures: any[], teams: any[]): OptimalTeam {
  // Calculate player scores based on multiple factors for better points prediction
  const playerScores = allPlayers.map(player => {
    // Recent form (weighted more heavily)
    const form = parseFloat(player.form || '0') * 1.5;
    
    // Points per game (consistent performance indicator)
    const ppg = parseFloat(player.points_per_game || '0');
    
    // Fixture difficulty for upcoming games
    const fixtures_score = calculateFixtureScore(player.team, fixtures);
    
    // Minutes played (reliability indicator)
    const minutes_factor = Math.min(player.minutes / 900, 1); // Max out at 900 minutes
    
    // Bonus points (indicates involvement in play)
    const bonus_factor = (player.bonus / Math.max(player.minutes / 90, 1)) * 2;
    
    // Calculate expected points using weighted components
    const expected_points = (
      (form * 0.35) +               // 35% weight on recent form
      (ppg * 0.25) +               // 25% weight on season performance
      (fixtures_score * 0.20) +     // 20% weight on upcoming fixtures
      (minutes_factor * 0.10) +     // 10% weight on playing time
      (bonus_factor * 0.10)         // 10% weight on bonus point potential
    ) * 6; // Scale to realistic FPL points
    
    return {
      ...player,
      score: expected_points,
      is_optimal: true,
      optimal_reason: `Expected: ${expected_points.toFixed(1)} (Form: ${form.toFixed(1)}, Fixtures: ${fixtures_score.toFixed(1)})`
    };
  });

  // Sort players by score within their positions
  const goalkeepers = playerScores.filter(p => p.element_type === 1).sort((a, b) => b.score - a.score);
  const defenders = playerScores.filter(p => p.element_type === 2).sort((a, b) => b.score - a.score);
  const midfielders = playerScores.filter(p => p.element_type === 3).sort((a, b) => b.score - a.score);
  const forwards = playerScores.filter(p => p.element_type === 4).sort((a, b) => b.score - a.score);

  // Find best formation based on available players
  const formations = [
    { def: 4, mid: 3, fwd: 3 }, // 4-3-3
    { def: 3, mid: 5, fwd: 2 }, // 3-5-2
    { def: 4, mid: 4, fwd: 2 }, // 4-4-2
    { def: 5, mid: 3, fwd: 2 }, // 5-3-2
    { def: 4, mid: 5, fwd: 1 }  // 4-5-1
  ];

  let bestFormation = formations[0];
  let highestScore = 0;

  formations.forEach(formation => {
    const score = (
      defenders.slice(0, formation.def).reduce((sum, p) => sum + p.score, 0) +
      midfielders.slice(0, formation.mid).reduce((sum, p) => sum + p.score, 0) +
      forwards.slice(0, formation.fwd).reduce((sum, p) => sum + p.score, 0) +
      goalkeepers[0].score
    );

    if (score > highestScore) {
      highestScore = score;
      bestFormation = formation;
    }
  });

  // Select players based on best formation
  const firstTeam = [
    goalkeepers[0],
    ...defenders.slice(0, bestFormation.def),
    ...midfielders.slice(0, bestFormation.mid),
    ...forwards.slice(0, bestFormation.fwd)
  ].map((p, i) => ({ ...p, position: i + 1 }));

  // Select substitutes
  const substitutes = [
    goalkeepers[1],
    defenders[bestFormation.def],
    midfielders[bestFormation.mid],
    forwards[bestFormation.fwd]
  ].filter(Boolean).map((p, i) => ({ ...p, position: i + 12 }));

  // Select captain and vice-captain based on highest scores
  const sortedByScore = [...firstTeam].sort((a, b) => b.score - a.score);
  const captainId = sortedByScore[0].id;
  const viceCaptainId = sortedByScore[1].id;

  return {
    firstTeam,
    substitutes,
    captainId,
    viceCaptainId,
    formation: `${bestFormation.def}-${bestFormation.mid}-${bestFormation.fwd}`,
    totalPoints: highestScore
  };
}

function calculateFixtureScore(teamId: number, fixtures: any[]): number {
  const nextGameweekFixtures = fixtures.slice(0, 5); // Look at next 5 fixtures
  const teamFixtures = nextGameweekFixtures.filter(f => f.team_h === teamId || f.team_a === teamId);
  
  if (teamFixtures.length === 0) return 1; // Default score if no fixtures found
  
  return teamFixtures.reduce((score, fixture, index) => {
    const isHome = fixture.team_h === teamId;
    const difficulty = isHome ? fixture.team_h_difficulty : fixture.team_a_difficulty;
    
    // Add home advantage bonus
    const homeBonus = isHome ? 0.2 : 0;
    
    // Weight earlier fixtures more heavily
    const gameweekWeight = (5 - index) / 5;
    
    // Convert difficulty to score (5=easy, 1=hard) and apply weights
    const baseScore = (6 - difficulty) / 5;
    return score + (baseScore + homeBonus) * gameweekWeight;
  }, 0) / teamFixtures.length;
}
import { Users, AlertCircle } from "lucide-react";

export default function TeamPage() {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [showOptimalTeam, setShowOptimalTeam] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [teamId, setTeamId] = useState(() => {
    const savedId = localStorage.getItem("fpl_team_id");
    return savedId ? parseInt(savedId, 10) : null;
  });

  const { data: team, isLoading: isLoadingTeam } = useQuery({
    queryKey: ["/api/fpl/my-team", teamId],
    queryFn: () => teamId ? fetchMyTeam(teamId) : null,
    enabled: !!teamId
  });

  const { data: players, isLoading: isLoadingPlayers } = useQuery({
    queryKey: ["/api/fpl/players"],
    queryFn: fetchPlayers
  });

  const { data: bootstrapData } = useQuery({
    queryKey: ["/api/fpl/bootstrap-static"],
    queryFn: fetchBootstrapStatic
  });

  const { data: fixtures } = useQuery({
    queryKey: ["/api/fpl/fixtures"],
    queryFn: fetchFixtures
  });

  if (!teamId) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Transfer Planning</h1>
        <Button 
          variant="outline" 
          className="ml-4"
          onClick={() => setShowOptimalTeam(true)}
        >
          View Dream Team
        </Button>
        <Card>
          <CardContent className="p-6">
            <div className="text-center space-y-2">
              <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground" />
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

  if (isLoadingTeam || isLoadingPlayers) {
    return <Skeleton className="h-[600px] w-full" />;
  }

  if (!team || !players) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Failed to load team data</AlertDescription>
      </Alert>
    );
  }

  // Split players into starting XI and substitutes
  const startingXI = team.picks
    .filter(pick => pick.position <= 11)
    .map(pick => ({
      ...players.find(p => p.id === pick.element)!,
      position: pick.position,
    }));
  
  const substitutes = team.picks
    .filter(pick => pick.position > 11)
    .map(pick => ({
      ...players.find(p => p.id === pick.element)!,
      position: pick.position,
    }));

  const captainId = team.picks.find(p => p.is_captain)?.element;
  const viceCaptainId = team.picks.find(p => p.is_vice_captain)?.element;

  return (
    <div className="min-h-screen w-full overflow-y-auto">
      <div className="container mx-auto max-w-7xl space-y-6 px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold">Transfer Planning</h1>
            <Link href="/optimal-team">
              <Button variant="outline">
                View Dream Team
              </Button>
            </Link>
            <Link href="/chips">
              <Button variant="outline">
                Chips Strategy
              </Button>
            </Link>
          </div>
        </div>

      {/* Optimal Team Dialog */}
      

      {/* Team View - Full Width */}
      <TeamPitch 
        players={startingXI}
        substitutes={substitutes}
        captainId={captainId}
        viceCaptainId={viceCaptainId}
        onPlayerClick={setSelectedPlayer}
        onSubstituteClick={setSelectedPlayer}
        fixtures={fixtures}
        teams={bootstrapData?.teams}
      />

      {/* Transfers and Captain Suggestions Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Transfer Suggestions */}
        {(startingXI.length > 0 || substitutes.length > 0) && bootstrapData?.teams && fixtures && (
          <TransferSuggestions
            currentPlayers={[...startingXI, ...substitutes]}
            allPlayers={players}
            fixtures={fixtures}
            teams={bootstrapData.teams}
            onTransferClick={(inPlayer, outPlayer) => {
              toast({
                title: "Transfer Initiated",
                description: `${outPlayer.web_name} ➜ ${inPlayer.web_name}`,
              });
            }}
          />
        )}

        {/* Captain Suggestions */}
        <CaptainSuggestions 
          allPlayers={players}
          onSelectCaptain={setSelectedPlayer}
          currentCaptainId={captainId}
          currentViceCaptainId={viceCaptainId}
        />

          {/* Player Stats Dialog */}
          {selectedPlayer && (
            <>
              
              <PlayerStats player={selectedPlayer} />
              <CaptainDialog
                player={selectedPlayer}
                isOpen={!!selectedPlayer}
                onClose={() => setSelectedPlayer(null)}
                isCaptain={selectedPlayer.id === captainId}
                isViceCaptain={selectedPlayer.id === viceCaptainId}
                onMakeCaptain={() => {
                  updateCaptains(selectedPlayer.id, viceCaptainId || 0)
                    .then(() => {
                      queryClient.invalidateQueries({ queryKey: ["/api/fpl/my-team/1"] });
                      toast({
                        title: "Captain Updated",
                        description: `${selectedPlayer.web_name} is now your captain`,
                      });
                      setSelectedPlayer(null);
                    })
                    .catch(() => {
                      toast({
                        title: "Error",
                        description: "Failed to update captain",
                        variant: "destructive",
                      });
                    });
                }}
                onMakeViceCaptain={() => {
                  updateCaptains(captainId || 0, selectedPlayer.id)
                    .then(() => {
                      queryClient.invalidateQueries({ queryKey: ["/api/fpl/my-team/1"] });
                      toast({
                        title: "Vice Captain Updated",
                        description: `${selectedPlayer.web_name} is now your vice captain`,
                      });
                      setSelectedPlayer(null);
                    })
                    .catch(() => {
                      toast({
                        title: "Error",
                        description: "Failed to update vice captain",
                        variant: "destructive",
                      });
                    });
                }}
              />
            </>
          )}
      </div>
      </div>
    </div>
  );
}