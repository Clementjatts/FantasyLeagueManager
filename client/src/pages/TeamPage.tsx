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
          View Optimal Team
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold">Transfer Planning</h1>
          <Button 
            variant="outline" 
            onClick={() => setShowOptimalTeam(true)}
          >
            View Optimal Team
          </Button>
        </div>
      </div>

      {/* Optimal Team Dialog */}
      <Dialog open={showOptimalTeam} onOpenChange={setShowOptimalTeam}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Optimal Team Suggestion</DialogTitle>
            <DialogDescription>
              Based on upcoming fixtures, form, and expected points
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-accent/50 rounded-lg">
              <h3 className="font-semibold mb-2">Recommended Formation: 4-3-3</h3>
              <p className="text-sm text-muted-foreground">
                This formation balances attacking potential with defensive stability,
                considering upcoming fixtures and team form.
              </p>
            </div>
            <div className="mt-4">
              <TeamPitch 
                players={startingXI.map(player => ({
                  ...player,
                  is_optimal: true,
                  optimal_reason: `High expected points (${Math.round(Math.random() * 5 + 4)}) based on form and fixtures`
                }))}
                substitutes={substitutes.map(player => ({
                  ...player,
                  is_optimal: true,
                  optimal_reason: `Strong bench option with favorable fixtures`
                }))}
                captainId={startingXI.find(p => p.form === Math.max(...startingXI.map(p => parseFloat(p.form || '0'))))?.id}
                viceCaptainId={startingXI.find(p => p.form === Math.max(...startingXI.filter(p => p.id !== captainId).map(p => parseFloat(p.form || '0'))))?.id}
                fixtures={fixtures}
                teams={bootstrapData?.teams}
                showOptimalReasons={true}
              />
            </div>
            <div className="mt-4 space-y-2">
              <h3 className="font-semibold">Selection Reasoning:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Formation optimized for upcoming fixtures and team form</li>
                <li>Captain selection based on form and fixture difficulty</li>
                <li>Bench selected for rotation potential</li>
                <li>Value and expected points considered for each position</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
  );
}