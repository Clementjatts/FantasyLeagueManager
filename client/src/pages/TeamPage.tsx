import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TeamPitch } from "../components/TeamPitch";
import { fetchMyTeam, fetchPlayers, updateCaptains } from "../lib/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { CaptainDialog } from "../components/CaptainDialog";
import { Player } from "../types/fpl";
import { useToast } from "@/hooks/use-toast";

export default function TeamPage() {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [substitutionMode, setSubstitutionMode] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<number>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: team, isLoading: isLoadingTeam } = useQuery({
    queryKey: ["/api/fpl/my-team/1"],
    queryFn: () => fetchMyTeam(1)
  });

  const { data: players, isLoading: isLoadingPlayers } = useQuery({
    queryKey: ["/api/fpl/players"],
    queryFn: () => fetchPlayers()
  });

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

  const teamPlayers = team.picks.map(pick => ({
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold">My Team</h1>
          <Button
            variant={substitutionMode ? "destructive" : "outline"}
            onClick={() => {
              setSubstitutionMode(!substitutionMode);
              setSelectedPosition(undefined);
            }}
          >
            {substitutionMode ? "Cancel Substitution" : "Make Substitution"}
          </Button>
        </div>
        <div className="flex gap-4">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Team Value</p>
            <p className="text-lg font-semibold">£{totalValue}m</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">In Bank</p>
            <p className="text-lg font-semibold">£{bankValue}m</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Free Transfers</p>
            <p className="text-lg font-semibold">{freeTransfers}</p>
          </div>
        </div>
      </div>

      <>
        <TeamPitch 
          players={teamPlayers}
          captainId={captainId}
          viceCaptainId={viceCaptainId}
          onPlayerClick={(player) => {
            if (substitutionMode) {
              setSelectedPosition(player.position);
            } else {
              setSelectedPlayer(player);
            }
          }}
          onSubstituteClick={async (benchPlayer, starterPosition) => {
            try {
              await makeSubstitution(benchPlayer.id, starterPosition);
              queryClient.invalidateQueries({ queryKey: ["/api/fpl/my-team/1"] });
              toast({
                title: "Substitution Made",
                description: "Players have been swapped successfully",
              });
              setSubstitutionMode(false);
              setSelectedPosition(undefined);
            } catch {
              toast({
                title: "Error",
                description: "Failed to make substitution",
                variant: "destructive",
              });
            }
          }}
          substitutionMode={substitutionMode}
          selectedPosition={selectedPosition}
        />
        
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
      </>
    </div>
  );
}
