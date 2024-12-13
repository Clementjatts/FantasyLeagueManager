import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PlayerCard } from "../components/PlayerCard";
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
    position: 'ALL',
    team: 'ALL',
    minPrice: 0,
    maxPrice: 15,
    minForm: 0,
    sortBy: 'points',
    sortOrder: 'desc',
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: team, isLoading: isLoadingTeam } = useQuery({
    queryKey: ["/api/fpl/my-team/1"],
    queryFn: () => fetchMyTeam(1)
  });

  const { data: players, isLoading: isLoadingPlayers } = useQuery({
    queryKey: ["/api/fpl/players"],
    queryFn: fetchPlayers
  });

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
        const matchesPosition = filters.position === 'ALL' || player.element_type.toString() === filters.position;
        const matchesTeam = filters.team === 'ALL' || player.team.toString() === filters.team;
        const matchesPrice = player.now_cost / 10 >= filters.minPrice && player.now_cost / 10 <= filters.maxPrice;
        const matchesForm = parseFloat(player.form) >= filters.minForm;
        
        return matchesSearch && matchesPosition && matchesTeam && matchesPrice && matchesForm;
      })
      .sort((a, b) => {
        let valueA, valueB;
        
        switch (filters.sortBy) {
          case 'price':
            valueA = a.now_cost;
            valueB = b.now_cost;
            break;
          case 'form':
            valueA = parseFloat(a.form);
            valueB = parseFloat(b.form);
            break;
          case 'points':
            valueA = a.total_points;
            valueB = b.total_points;
            break;
          case 'selected':
            valueA = parseFloat(a.selected_by_percent);
            valueB = parseFloat(b.selected_by_percent);
            break;
          default:
            valueA = a.total_points;
            valueB = b.total_points;
        }
        
        return filters.sortOrder === 'asc' ? valueA - valueB : valueB - valueA;
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
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Transfers</h1>
        <div className="flex gap-6">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Team Value</p>
            <p className="text-lg font-semibold">£{teamValue.toFixed(1)}m</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Money in Bank</p>
            <p className="text-lg font-semibold">£{bankValue.toFixed(1)}m</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Free Transfers</p>
            <p className="text-lg font-semibold">{freeTransfers}</p>
          </div>
        </div>
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
            <Input
              placeholder="Search players..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
            {selectedOut && (
              <Button
                variant="outline"
                onClick={() => setSelectedOut(null)}
              >
                Cancel Selection
              </Button>
            )}
          </div>
          
          <TransferFilters
            teams={team?.teams || []}
            onFilterChange={setFilters}
          />
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

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPlayers?.map(player => (
            <div key={player.id} className="relative">
              <PlayerCard
                player={player}
                onClick={() => {
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
                className={selectedOut === player.id ? "ring-2 ring-primary" : ""}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
