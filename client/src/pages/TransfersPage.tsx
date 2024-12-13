import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PlayerTable } from "../components/PlayerTable";
import { fetchPlayers, makeTransfer, fetchMyTeam } from "../lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { TransferFilters, type FilterOptions } from "@/components/TransferFilters";

export default function TransfersPage() {
  const [search, setSearch] = useState("");
  const [selectedOut, setSelectedOut] = useState<number | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    team: 'ALL'
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: team, isLoading: isLoadingTeam } = useQuery({
    queryKey: ["/api/fpl/my-team/1"],
    queryFn: () => fetchMyTeam(1)
  });

  const { data: players, isLoading: isLoadingPlayers } = useQuery({
    queryKey: ["/api/fpl/players"],
    queryFn: () => {
      const result = fetchPlayers();
      console.log('Player data example:', result?.[0]);
      return result;
    }
  });

  // Log team information when players data changes
  React.useEffect(() => {
    if (players) {
      console.log('Available teams:', 
        Array.from(new Set(players.map(p => p.team)))
          .map(teamId => {
            const player = players.find(p => p.team === teamId);
            return {
              id: teamId,
              name: player?.team_name,
              team: player?.team
            };
          })
      );
    }
  }, [players]);

  const transferMutation = useMutation({
    mutationFn: (params: { playerId: number; outId: number }) =>
      makeTransfer(params.playerId, params.outId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fpl/my-team/1"] });
      toast({
        title: "Transfer successful",
        description: "Your team has been updated",
      });
      setSelectedOut(null);
    },
    onError: () => {
      toast({
        title: "Transfer failed",
        description: "Unable to complete the transfer. Please try again.",
        variant: "destructive",
      });
    },
  });

  const filteredPlayers = useMemo(() => {
    if (!players) return [];
    
    return players
      .filter(player => {
        const matchesSearch = player.web_name.toLowerCase().includes(search.toLowerCase());
        const matchesTeam = filters.team === 'ALL' || player.team.toString() === filters.team;
        return matchesSearch && matchesTeam;
      });
  }, [players, search, filters]);

  const teamValue = (team?.transfers?.value || 0) / 10;
  const bankValue = (team?.transfers?.bank || 0) / 10;
  const freeTransfers = team?.transfers?.limit || 0;

  if (isLoadingTeam || isLoadingPlayers) {
    return <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-96 w-full" />
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <h1 className="text-3xl font-bold">Transfers</h1>
      </div>

      <div className="space-y-6">
        <div className="bg-accent/50 rounded-lg p-4 space-y-2">
          <h2 className="font-semibold">How to make transfers:</h2>
          <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
            <li>Click on a player from your team to transfer out</li>
            <li>Select a new player of the same position to transfer in</li>
            <li>The transfer will be completed if you have available free transfers</li>
          </ol>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 flex items-center gap-4 max-w-lg">
              <Input
                placeholder="Search players..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <TransferFilters
                teams={players ? 
                  Array.from(new Set(players.map(p => p.team)))
                    .map(teamId => {
                      const playerFromTeam = players.find(p => p.team === teamId);
                      const teamNames: Record<number, string> = {
                        1: "Arsenal",
                        2: "Aston Villa",
                        3: "Bournemouth",
                        4: "Brentford",
                        5: "Brighton",
                        6: "Chelsea",
                        7: "Crystal Palace",
                        8: "Everton",
                        9: "Fulham",
                        10: "Liverpool",
                        11: "Luton",
                        12: "Manchester City",
                        13: "Manchester United",
                        14: "Newcastle",
                        15: "Nottingham Forest",
                        16: "Sheffield United",
                        17: "Tottenham",
                        18: "West Ham",
                        19: "Wolves",
                        20: "Burnley"
                      };
                      return {
                        id: teamId,
                        name: teamNames[teamId] || `Team ${teamId}`,
                        short_name: teamNames[teamId] || `Team ${teamId}`
                      };
                    })
                    .sort((a, b) => a.name.localeCompare(b.name)) 
                  : []}
                onFilterChange={setFilters}
              />
            </div>
            {selectedOut && (
              <Button
                variant="outline"
                onClick={() => setSelectedOut(null)}
              >
                Cancel Selection
              </Button>
            )}
          </div>

          {selectedOut ? (
            <p className="text-sm text-muted-foreground">
              Select a player to transfer in
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Select a player to transfer out
            </p>
          )}

          <PlayerTable 
            players={filteredPlayers}
            selectedPlayerId={selectedOut}
            onPlayerClick={(player) => {
              if (selectedOut) {
                if (selectedOut === player.id) {
                  setSelectedOut(null);
                } else {
                  transferMutation.mutate({
                    playerId: player.id,
                    outId: selectedOut,
                  });
                }
              } else {
                setSelectedOut(player.id);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
