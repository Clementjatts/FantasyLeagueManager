import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { PlayerTable } from "../components/PlayerTable";
import { fetchPlayers, makeTransfer, fetchMyTeam, fetchFixtures } from "../lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { TransferFilters, type FilterOptions } from "@/components/TransferFilters";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TransferStrategy } from "@/components/TransferStrategy";

export default function TransfersPage() {
  const [search, setSearch] = useState("");
  const [location] = useLocation();
  const searchParams = new URLSearchParams(location.split('?')[1] || '');
  const initialPlayerId = searchParams.get('playerId');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedOut, setSelectedOut] = useState<number | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    team: 'ALL',
    position: 'ALL'
  });

  // Fetch data
  const { data: team, isLoading: isLoadingTeam } = useQuery({
    queryKey: ["/api/fpl/my-team/1"],
    queryFn: () => fetchMyTeam(1)
  });

  const { data: players, isLoading: isLoadingPlayers } = useQuery({
    queryKey: ["/api/fpl/players"],
    queryFn: fetchPlayers
  });

  const { data: fixtures, isLoading: isLoadingFixtures } = useQuery({
    queryKey: ["/api/fpl/fixtures"],
    queryFn: fetchFixtures
  });

  // Handle transfer mutations
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

  // Initialize selected player and filters when data is available
  useEffect(() => {
    if (players && initialPlayerId && !selectedOut) {
      const playerId = Number(initialPlayerId);
      if (!isNaN(playerId)) {
        const player = players.find(p => p.id === playerId);
        if (player) {
          console.log('Setting selected player:', player.web_name);
          setSelectedOut(playerId);
          setFilters({
            team: player.team.toString(),
            position: player.element_type.toString()
          });
        }
      }
    }
  }, [players, initialPlayerId, selectedOut]);

  // Reset filters when selection is cleared
  useEffect(() => {
    if (!selectedOut) {
      setFilters({
        team: 'ALL',
        position: 'ALL'
      });
    }
  }, [selectedOut]);

  // Filter players based on search and filters
  const filteredPlayers = useMemo(() => {
    if (!players) return [];
    
    return players.filter(player => {
      const matchesSearch = player.web_name.toLowerCase().includes(search.toLowerCase());
      const matchesTeam = filters.team === 'ALL' || player.team.toString() === filters.team;
      const matchesPosition = filters.position === 'ALL' || player.element_type.toString() === filters.position;
      return matchesSearch && matchesTeam && matchesPosition;
    });
  }, [players, search, filters]);

  const teamValue = (team?.transfers?.value || 0) / 10;
  const bankValue = (team?.transfers?.bank || 0) / 10;
  const freeTransfers = team?.transfers?.limit || 0;

  if (isLoadingPlayers || isLoadingTeam || isLoadingFixtures) {
    return (
      <div className="p-6">
        <div className="grid gap-6">
          <Skeleton className="h-[400px]" />
          <Skeleton className="h-[200px]" />
        </div>
      </div>
    );
  }

  if (!players || !team) {
    return (
      <div className="p-6">
        <Alert>
          <AlertDescription>
            Failed to load data. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6">
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

            <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
              <div className="space-y-4">
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

              <div className="space-y-6">
                <TransferStrategy
                  team={team}
                  players={players}
                  fixtures={fixtures || []}
                  teams={players ? 
                    Array.from(new Set(players.map(p => p.team)))
                      .map(teamId => {
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
                    : []}
                  freeTransfers={team?.transfers?.limit ?? 0}
                  teamValue={(team?.last_deadline_value || 0) / 10}
                  bankBalance={(team?.last_deadline_bank || 0) / 10}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}