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
import { Button } from "@/components/ui/button";
import { CaptainDialog } from "../components/CaptainDialog";
import { TeamIdInput } from "../components/TeamIdInput";
import { type Player } from "../types/fpl";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Trophy, Zap, Users, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function TeamPage() {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { profile, setFplTeamId } = useAuth();

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

  const teamId = profile?.fplTeamId || null;

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
        <div className="space-y-8">
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-radiant-violet to-pink-500 bg-clip-text text-transparent">
                  Team Management
                </h1>
                <p className="text-lg text-slate-600 dark:text-slate-300 font-medium">
                  Manage your FPL team transfers and captain selection
                </p>
              </div>
            </div>
          </div>

          <Card variant="electric">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <AlertCircle className="w-12 h-12 mx-auto text-electric-cyan" />
                <h2 className="text-2xl font-semibold">No Team Selected</h2>
                <p className="text-slate-gray">
                  Enter your FPL team ID to view your team management page
                </p>
                <TeamIdInput onTeamIdChange={setFplTeamId} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isLoadingTeam || isLoadingPlayers || isLoadingBootstrap || isLoadingFixtures) {
    return (
      <div className="p-6">
        <div className="space-y-8">
          <div className="flex flex-col gap-4">
            <Skeleton className="h-10 w-64" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-40" />
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

  const handleTransfer = (inPlayer: Player, outPlayer: Player) => {
    toast({
      title: "Transfer Initiated",
      description: `${outPlayer.web_name} ➜ ${inPlayer.web_name}`,
    });
  };

  return (
    <div className="p-6">
      <div className="space-y-8">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-electric-cyan to-vibrant-magenta bg-clip-text text-transparent">
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


        {/* Captain Pick Section */}
        <div className="mb-6">
          <CaptainSuggestions 
            allPlayers={players}
            fixtures={fixtures || []}
            teams={bootstrapData?.teams || []}
            onSelectCaptain={(playerId: number) => {
              const player = players.find(p => p.id === playerId);
              if (player) {
                setSelectedPlayer(player);
              }
            }}
            currentCaptainId={captainId || null}
            currentViceCaptainId={viceCaptainId || null}
          />
        </div>

        {/* Pitch Section */}
        <div className="mb-6">
          <TransferPitch 
            players={startingXI}
            substitutes={substitutes}
            fixtures={fixtures || []}
            teams={bootstrapData?.teams || []}
            onPlayerClick={(player) => {
              setSelectedPlayer(player);
            }}
          />
        </div>

        {/* Players to Keep Section */}
        <div className="mb-6">
          <TransferSuggestions
            currentPlayers={[...startingXI, ...substitutes]}
            allPlayers={players}
            fixtures={fixtures || []}
            teams={bootstrapData?.teams || []}
            budget={team?.stats?.bank || 0}
            freeTransfers={team?.transfers?.limit || 0}
            onTransfer={(playerId: number) => {
              const player = players.find(p => p.id === playerId);
              if (player) {
                setSelectedPlayer(player);
              }
            }}
          />
        </div>

        {selectedPlayer && (
          <PlayerStats player={selectedPlayer} />
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
                  queryClient.invalidateQueries({ queryKey: ["/api/fpl/my-team", teamId] });
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
                  queryClient.invalidateQueries({ queryKey: ["/api/fpl/my-team", teamId] });
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