import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { PlayerTable } from "../components/PlayerTable";
import { fetchPlayers, fetchFixtures, fetchBootstrapStatic } from "../lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TransferFilters, type FilterOptions } from "@/components/TransferFilters";
import { PriceChangeTracker } from "../components/PriceChangeTracker";
import { PlayerComparison } from "../components/PlayerComparison";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Scale } from "lucide-react";
import { type Player, type BootstrapTeam } from "../types/fpl";
import { ErrorBoundary } from 'react-error-boundary';
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Error Fallback component
function ErrorFallback({ error, resetErrorBoundary }: { error: Error, resetErrorBoundary: () => void }) {
  return (
    <div className="p-4 rounded-lg border border-red-200 bg-red-50">
      <h2 className="text-lg font-semibold text-red-800">Something went wrong:</h2>
      <pre className="text-sm text-red-600 mt-2">{error.message}</pre>
      <Button onClick={resetErrorBoundary} className="mt-4">Try again</Button>
    </div>
  );
}

export default function PlayersPage() {
  const [search, setSearch] = useState("");
  const [isComparisonMode, setIsComparisonMode] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [comparisonPlayer, setComparisonPlayer] = useState<Player | null>(null);
  const [showPriceDialog, setShowPriceDialog] = useState(false);
  const [showComparisonDialog, setShowComparisonDialog] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    team: 'ALL',
    position: 'ALL',
    quickFilter: undefined
  });

  const { toast } = useToast();

  const { data: players, isLoading: isLoadingPlayers, error: playersError } = useQuery({
    queryKey: ["/api/fpl/players"],
    queryFn: fetchPlayers,
    onError: (error: Error) => {
      toast({
        title: "Error loading players",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const { data: fixtures, isLoading: isLoadingFixtures } = useQuery({
    queryKey: ["/api/fpl/fixtures"],
    queryFn: fetchFixtures,
    onError: (error: Error) => {
      toast({
        title: "Error loading fixtures",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const { data: bootstrapData, isLoading: isLoadingBootstrap } = useQuery({
    queryKey: ["/api/fpl/bootstrap-static"],
    queryFn: fetchBootstrapStatic,
    onError: (error: Error) => {
      toast({
        title: "Error loading game data",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const filteredPlayers = useMemo(() => {
    if (!players || !bootstrapData?.teams) return [];

    return players.filter(player => {
      const matchesSearch = player.web_name.toLowerCase().includes(search.toLowerCase());
      const matchesTeam = filters.team === 'ALL' || Number(filters.team) === player.team;
      const matchesPosition = filters.position === 'ALL' || Number(filters.position) === player.element_type;
      const matchesQuickFilter = !filters.quickFilter || 
        (filters.quickFilter === 'TOP_SCORERS' && player.total_points > 100) || 
        (filters.quickFilter === 'IN_FORM' && parseFloat(player.form) > 5) || 
        (filters.quickFilter === 'BEST_VALUE' && player.now_cost < 70);
      return matchesSearch && matchesTeam && matchesPosition && matchesQuickFilter;
    });
  }, [players, bootstrapData?.teams, search, filters]);

  const isLoading = isLoadingPlayers || isLoadingFixtures || isLoadingBootstrap;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (playersError) {
    return (
      <div className="p-4 rounded-lg border border-red-200 bg-red-50">
        <h2 className="text-lg font-semibold text-red-800">Error loading players</h2>
        <pre className="text-sm text-red-600 mt-2">{(playersError as Error).message}</pre>
      </div>
    );
  }

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-500 via-primary to-blue-500 bg-clip-text text-transparent">
                  Players
                </h1>
              </div>
              <p className="text-lg text-muted-foreground">
                Search and compare player statistics
              </p>
            </div>
          </div>

          <Card>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center">
                    <div className="w-full md:w-48 lg:w-56">
                      <div className="relative">
                        <Input
                          placeholder="Search by player name..."
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          className="w-full pl-10 pr-4 h-12 bg-background/50 backdrop-blur-sm"
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
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className={`gap-2 ${filters.quickFilter === 'TOP_SCORERS' ? 'bg-primary/10' : ''}`}
                              onClick={() => setFilters(prev => ({
                                ...prev,
                                quickFilter: prev.quickFilter === 'TOP_SCORERS' ? undefined : 'TOP_SCORERS'
                              }))}
                            >
                              Top Scorers
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Players with over 100 total points</p>
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className={`gap-2 ${filters.quickFilter === 'IN_FORM' ? 'bg-primary/10' : ''}`}
                              onClick={() => setFilters(prev => ({
                                ...prev,
                                quickFilter: prev.quickFilter === 'IN_FORM' ? undefined : 'IN_FORM'
                              }))}
                            >
                              In Form
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Players with form rating above 5.0</p>
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className={`gap-2 ${filters.quickFilter === 'BEST_VALUE' ? 'bg-primary/10' : ''}`}
                              onClick={() => setFilters(prev => ({
                                ...prev,
                                quickFilter: prev.quickFilter === 'BEST_VALUE' ? undefined : 'BEST_VALUE'
                              }))}
                            >
                              Best Value
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Players costing less than £7.0m</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TransferFilters
                        teams={bootstrapData?.teams ?
                          bootstrapData.teams
                            .filter((team: BootstrapTeam) => players?.some(p => p.team === team.id))
                            .sort((a: BootstrapTeam, b: BootstrapTeam) => a.name.localeCompare(b.name))
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

                  <ErrorBoundary FallbackComponent={ErrorFallback}>
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
                          } else {
                            setSelectedPlayer(player);
                            setShowComparisonDialog(true);
                          }
                        } else {
                          setSelectedPlayer(player);
                          setShowPriceDialog(true);
                        }
                      }}
                    />
                  </ErrorBoundary>

                  <Dialog open={showPriceDialog} onOpenChange={setShowPriceDialog}>
                    <DialogContent className="max-w-3xl">
                      {selectedPlayer && (
                        <PriceChangeTracker player={selectedPlayer} />
                      )}
                    </DialogContent>
                  </Dialog>

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
            </CardContent>
          </Card>
        </div>
      </div>
    </ErrorBoundary>
  );
}