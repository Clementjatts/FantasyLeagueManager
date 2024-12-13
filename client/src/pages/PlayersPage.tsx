import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { PlayerTable } from "../components/PlayerTable";
import { fetchPlayers, fetchFixtures, fetchBootstrapStatic } from "../lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { TransferFilters, type FilterOptions } from "@/components/TransferFilters";
import { PriceChangeTracker } from "../components/PriceChangeTracker";
import { PlayerComparison } from "../components/PlayerComparison";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { BarChartHorizontal, Scale } from "lucide-react";
import { type Player } from "../types/fpl";
import { Badge } from "@/components/ui/badge";

export default function PlayersPage() {
  const [search, setSearch] = useState("");
  const { toast } = useToast();
  const [isComparisonMode, setIsComparisonMode] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [comparisonPlayer, setComparisonPlayer] = useState<Player | null>(null);
  const [showPriceDialog, setShowPriceDialog] = useState(false);
  const [showComparisonDialog, setShowComparisonDialog] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    team: 'ALL',
    position: 'ALL'
  });

  // Fetch data
  const { data: players, isLoading: isLoadingPlayers } = useQuery({
    queryKey: ["/api/fpl/players"],
    queryFn: fetchPlayers
  });

  const { data: fixtures } = useQuery({
    queryKey: ["/api/fpl/fixtures"],
    queryFn: fetchFixtures
  });

  const { data: bootstrapData } = useQuery({
    queryKey: ["/api/fpl/bootstrap-static"],
    queryFn: fetchBootstrapStatic
  });


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

  //These variables are not used anymore
  //const teamValue = (team?.transfers?.value || 0) / 10;
  //const bankValue = (team?.transfers?.bank || 0) / 10;
  //const freeTransfers = team?.transfers?.limit || 0;

  if (isLoadingPlayers) {
    return <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-96 w-full" />
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <h1 className="text-3xl font-bold">Players</h1>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 flex items-center gap-4 max-w-3xl">
              <div className="relative flex-1">
                <Input
                  placeholder="Search players"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 h-12 bg-background/50 backdrop-blur-sm border-muted 
                    focus:border-primary/50 focus:ring-2 focus:ring-primary/20 
                    transition-all duration-200 ease-in-out text-base"
                />
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              </div>
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
              <Button
                variant={isComparisonMode ? "default" : "outline"}
                size="sm"
                className="gap-2"
                onClick={() => {
                  setIsComparisonMode(!isComparisonMode);
                  setComparisonPlayer(null);
                  setShowComparisonDialog(false);
                }}
              >
                <Scale className="w-4 h-4" />
                {isComparisonMode ? "Cancel Comparison" : "Compare Players"}
              </Button>
            </div>
          </div>

          <PlayerTable 
            players={filteredPlayers}
            fixtures={fixtures}
            teams={bootstrapData?.teams}
            selectedPlayerId={selectedPlayer?.id}
            highlightedPlayer={comparisonPlayer}
            onPlayerClick={(player) => {
              if (isComparisonMode) {
                if (!comparisonPlayer) {
                  setComparisonPlayer(player);
                } else if (player.element_type === comparisonPlayer.element_type) {
                  setSelectedPlayer(player);
                  setShowComparisonDialog(true);
                } else {
                  toast({
                    title: "Position Mismatch",
                    description: "Please select players from the same position to compare",
                    variant: "destructive"
                  });
                }
              } else {
                setSelectedPlayer(player);
                setShowPriceDialog(true);
              }
            }}
            />

          {/* Price Analysis Dialog */}
          <Dialog open={showPriceDialog} onOpenChange={setShowPriceDialog}>
            <DialogContent className="max-w-3xl">
              {selectedPlayer && (
                <PriceChangeTracker player={selectedPlayer} />
              )}
            </DialogContent>
          </Dialog>

          {/* Player Comparison Dialog */}
          <Dialog open={showComparisonDialog} onOpenChange={setShowComparisonDialog}>
            <DialogContent className="max-w-4xl">
              {selectedPlayer && comparisonPlayer && (
                <>
                  <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                    <Scale className="w-5 h-5 text-primary" />
                    Player Comparison
                  </DialogTitle>
                  <DialogDescription className="space-y-4">
                    <div className="flex items-center justify-center gap-6 pt-4">
                      <div className="text-center">
                        <div className="font-semibold text-xl text-primary">{comparisonPlayer.web_name}</div>
                      </div>
                      <div className="text-2xl font-bold text-muted-foreground">VS</div>
                      <div className="text-center">
                        <div className="font-semibold text-xl text-primary">{selectedPlayer.web_name}</div>
                      </div>
                    </div>
                  </DialogDescription>
                  <PlayerComparison 
                    player={selectedPlayer}
                    comparedPlayer={comparisonPlayer}
                  />
                </>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}