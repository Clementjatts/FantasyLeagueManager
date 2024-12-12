import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
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
import { TrendingUp, Users, Coins, AlertCircle } from "lucide-react";

export default function TeamPage() {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
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
        <h1 className="text-3xl font-bold">My Team</h1>
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

  const totalValue = (team.transfers.value / 10).toFixed(1);
  const bankValue = (team.transfers.bank / 10).toFixed(1);
  const freeTransfers = team.transfers.limit;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Team</h1>
        <div className="flex gap-4">
          <Card className="bg-gradient-to-br from-background/80 to-muted/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Free Transfers</p>
                  <p className="text-lg font-semibold">{freeTransfers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-background/80 to-muted/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Coins className="w-4 h-4 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Team Value</p>
                  <p className="text-lg font-semibold">£{totalValue}m</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-background/80 to-muted/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-4 h-4 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">In Bank</p>
                  <p className="text-lg font-semibold">£{bankValue}m</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-[2fr,1fr]">
        {/* Left Column - Team and Transfers */}
        <div className="space-y-6">
          {/* Team View */}
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

          {/* Team Value Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Team Value Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Starting XI</p>
                    <p className="text-lg font-semibold">
                      £{(startingXI.reduce((sum, p) => sum + (p.now_cost || 0), 0) / 10).toFixed(1)}m
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Bench</p>
                    <p className="text-lg font-semibold">
                      £{(substitutes.reduce((sum, p) => sum + (p.now_cost || 0), 0) / 10).toFixed(1)}m
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Captain Suggestions */}
        <div className="space-y-6">
          <CaptainSuggestions 
            allPlayers={players}
            onSelectCaptain={setSelectedPlayer}
            currentCaptainId={captainId}
            currentViceCaptainId={viceCaptainId}
          />
        </div>
      </div>
    </div>
  );
}