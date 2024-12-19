import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { TransferPitch } from "../components/pitch/TransferPitch";
import { TransferSuggestions } from "../components/TransferSuggestions";
import CaptainSuggestions from "../components/CaptainSuggestions";
import { PlayerStats } from "../components/PlayerStats";
import { fetchMyTeam, fetchPlayers, updateCaptains, fetchBootstrapStatic, fetchFixtures } from "../lib/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CaptainDialog } from "../components/CaptainDialog";
import { type Player } from "../types/fpl";
import { useToast } from "@/hooks/use-toast";
import TeamValueProjection from '../components/TeamValueProjection';
import AlternativeTransfers from '../components/AlternativeTransfers';
import { AlertCircle, Trophy, Zap } from "lucide-react";

export default function TeamPage() {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: players, isLoading: isLoadingPlayers } = useQuery({
    queryKey: ["/api/fpl/players"],
    queryFn: fetchPlayers
  });

  const { data: bootstrapData } = useQuery({
    queryKey: ["/api/fpl/bootstrap-static"],
    queryFn: fetchBootstrapStatic,
  });

  const { data: fixtures } = useQuery({
    queryKey: ["/api/fpl/fixtures"],
    queryFn: fetchFixtures
  });

  const teamId = localStorage.getItem("fpl_team_id") ? parseInt(localStorage.getItem("fpl_team_id")!, 10) : null;

  const { data: team, isLoading: isLoadingTeam } = useQuery({
    queryKey: ["/api/fpl/my-team", teamId],
    queryFn: () => teamId ? fetchMyTeam(teamId) : null,
    enabled: !!teamId
  });

  const [captainId, setCaptainId] = useState<number | undefined>(undefined);
  const [viceCaptainId, setViceCaptainId] = useState<number | undefined>(undefined);

  // Initialize captain and vice-captain when team data is loaded
  useEffect(() => {
    if (team?.picks) {
      const captain = team.picks.find(pick => pick.is_captain);
      const viceCaptain = team.picks.find(pick => pick.is_vice_captain);
      setCaptainId(captain?.element);
      setViceCaptainId(viceCaptain?.element);
    }
  }, [team?.picks]);

  // Get current gameweek and next gameweek
  const currentGameweek = bootstrapData?.events?.find((event: any) => event.is_current)?.id;
  const nextGameweek = currentGameweek ? currentGameweek + 1 : null;

  if (!teamId) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Transfer Planning</h1>
        <Link href="/dream-team">
              <Button variant="outline" className="gap-2">
                <Trophy className="w-4 h-4" />
                Dream Team
              </Button>
            </Link>
            <Link href="/chips">
              <Button variant="outline" className="gap-2">
                <Zap className="w-4 h-4" />
                Chips Strategy
              </Button>
            </Link>
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

  // Captain selection handler
  const handleCaptainSelect = (player: Player) => {
    setCaptainId(player.id);
    toast({
      title: "Captain Updated",
      description: `${player.web_name} is now your captain`,
    });
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto max-w-7xl space-y-8 px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold">
              Gameweek {nextGameweek} Transfer Planning
            </h1>
            <Link href="/dream-team">
              <Button variant="outline" className="gap-2">
                <Trophy className="w-4 h-4" />
                Dream Team
              </Button>
            </Link>
            <Link href="/chips">
              <Button variant="outline" className="gap-2">
                <Zap className="w-4 h-4" />
                Chips Strategy
              </Button>
            </Link>
          </div>
        </div>

        {isLoadingTeam || isLoadingPlayers ? (
          <div className="flex justify-center items-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900" />
          </div>
        ) : (
          <div className="space-y-8">
            <TeamValueProjection 
              players={[...startingXI, ...substitutes]} 
              nextGameweek={nextGameweek || 0}
              freeTransfers={team.transfers?.limit || 0}
            />

            <div>
              <TransferPitch 
                players={startingXI}
                substitutes={substitutes}
                captainId={captainId}
                viceCaptainId={viceCaptainId}
                onPlayerClick={setSelectedPlayer}
                onSubstituteClick={setSelectedPlayer}
                fixtures={fixtures || []}
                teams={bootstrapData?.teams}
              />
              {selectedPlayer && (
                <PlayerStats player={selectedPlayer} />
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <TransferSuggestions
                currentPlayers={[...startingXI, ...substitutes]}
                allPlayers={players}
                fixtures={fixtures || []}
                teams={bootstrapData?.teams || []}
                onTransferClick={(inPlayer, outPlayer) => {
                  toast({
                    title: "Transfer Initiated",
                    description: `${outPlayer.web_name} ➜ ${inPlayer.web_name}`,
                  });
                }}
              />
              <AlternativeTransfers
                currentPlayers={[...startingXI, ...substitutes]}
                allPlayers={players}
                budget={team?.stats?.bank || 0}
                fixtures={fixtures || []}
                teams={bootstrapData?.teams || []}
                freeTransfers={team?.transfers?.limit || 0}
              />
              <CaptainSuggestions 
                allPlayers={players}
                fixtures={fixtures || []}
                teams={bootstrapData?.teams || []}
                onSelectCaptain={handleCaptainSelect}
                currentCaptainId={captainId}
                currentViceCaptainId={viceCaptainId}
              />
            </div>
          </div>
        )}

        {selectedPlayer && (
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
        )}
      </div>
    </div>
  );
}