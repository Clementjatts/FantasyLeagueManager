import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PlayerCard } from "../components/PlayerCard";
import { fetchPlayers, makeTransfer } from "../lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function TransfersPage() {
  const [search, setSearch] = useState("");
  const [selectedOut, setSelectedOut] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: players } = useQuery({
    queryKey: ["/api/fpl/players"],
  });

  const transferMutation = useMutation({
    mutationFn: (params: { playerId: number; outId: number }) =>
      makeTransfer(params.playerId, params.outId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fpl/my-team"] });
      toast({
        title: "Transfer successful",
        description: "Your team has been updated",
      });
    },
  });

  const filteredPlayers = players?.filter(player =>
    player.web_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Transfers</h1>

      <div className="space-y-4">
        <Input
          placeholder="Search players..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPlayers?.map(player => (
            <div key={player.id} className="relative">
              <PlayerCard
                player={player}
                onClick={() => {
                  if (selectedOut) {
                    transferMutation.mutate({
                      playerId: player.id,
                      outId: selectedOut,
                    });
                    setSelectedOut(null);
                  } else {
                    setSelectedOut(player.id);
                  }
                }}
              />
              {selectedOut === player.id && (
                <Button
                  variant="ghost"
                  className="absolute top-2 right-2"
                  onClick={() => setSelectedOut(null)}
                >
                  Cancel
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
