import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { TransferPitch } from "../components/pitch/TransferPitch";
import { TransferSuggestions } from "../components/TransferSuggestions";
import { TransferStrategy } from "../components/TransferStrategy";
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
import AlternativeTransfers from '../components/AlternativeTransfers';
import { AlertCircle, Trophy, Zap, Users } from "lucide-react";

export default function TeamPage() {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: players, isLoading: isLoadingPlayers } = useQuery({
    queryKey: ["/api/fpl/players"],
    queryFn: fetchPlayers
  });

  const { data: bootstrapData, isLoading: isLoadingBootstrap } = useQuery({
    queryKey: ["/api/fpl/bootstrap-static"],
    queryFn: fetchBootstrapStatic,
  });

  const { data: fixtures, isLoading: isLoadingFixtures } = useQuery({
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
      <div className="p-6">
        <Alert>
          <AlertDescription>
            Please connect your FPL account to view your team.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoadingTeam || isLoadingPlayers || isLoadingBootstrap || isLoadingFixtures) {
    return (
      <div className="p-6">
        <div className="space-y-8">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-500 via-primary to-blue-500 bg-clip-text text-transparent">
                Transfer Planning
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" className="gap-2" disabled>
                <Trophy className="w-4 h-4" />
                Dream Team
              </Button>
              <Button variant="outline" className="gap-2" disabled>
                <Zap className="w-4 h-4" />
                Chips Strategy
              </Button>
            </div>
          </div>
          <div className="grid gap-6">
            <Skeleton className="h-[400px]" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Skeleton className="h-[300px]" />
              <Skeleton className="h-[300px]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!team || !players || !bootstrapData || !fixtures) {
    return (
      <div className="p-6">
        <Alert>
          <AlertDescription>
            Failed to load team data. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
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
    <div className="p-6">
      <div className="space-y-8">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-500 via-primary to-blue-500 bg-clip-text text-transparent">
                Gameweek {nextGameweek} Transfer Planning
              </h1>
              <p className="text-lg text-muted-foreground">
                Plan your transfers and optimize your team for the upcoming gameweek
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link 
                href="/chips"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500/10 via-primary/10 to-blue-500/10 hover:from-purple-500/20 hover:via-primary/20 hover:to-blue-500/20 text-primary transition-all duration-200 font-medium"
              >
                <Zap className="w-4 h-4" />
                Chips Strategy
              </Link>
              <Link 
                href="/top-managers-team"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500/10 via-primary/10 to-blue-500/10 hover:from-purple-500/20 hover:via-primary/20 hover:to-blue-500/20 text-primary transition-all duration-200 font-medium"
              >
                <Users className="w-4 h-4" />
                Top Managers' Team
              </Link>
              <Link 
                href="/dream-team"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500/10 via-primary/10 to-blue-500/10 hover:from-purple-500/20 hover:via-primary/20 hover:to-blue-500/20 text-primary transition-all duration-200 font-medium"
              >
                <Trophy className="w-4 h-4" />
                Dream Team
              </Link>
            </div>
          </div>
        </div>

        <TransferStrategy
          team={team}
          players={players}
          fixtures={fixtures}
          teams={bootstrapData?.teams || []}
          freeTransfers={team?.transfers?.limit ?? 0}
          teamValue={(team?.last_deadline_value || 0) / 10}
          bankBalance={(team?.last_deadline_bank || 0) / 10}
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
  );
}