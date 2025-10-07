import React, { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { PlayerTable } from "../components/PlayerTable";
import { HistoricalPlayerTable } from "../components/HistoricalPlayerTable";
import { fetchPlayers, fetchFixtures, fetchBootstrapStatic } from "../lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { TransferFilters, type FilterOptions } from "@/components/TransferFilters";
import { PriceChangeTracker } from "../components/PriceChangeTracker";
import { PlayerComparison } from "../components/PlayerComparison";
import { SeasonSelector } from "../components/SeasonSelector";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSeason } from "../contexts/SeasonContext";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Scale, Info, Calendar, History } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { type Player, type BootstrapTeam } from "../types/fpl";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function PlayersPage() {
  const { currentSeason, availableSeasons, setCurrentSeason, isLoading: isSeasonLoading } = useSeason();
  const [search, setSearch] = useState("");
  const [isComparisonMode, setIsComparisonMode] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [comparisonPlayer, setComparisonPlayer] = useState<Player | null>(null);
  const [showPriceDialog, setShowPriceDialog] = useState(false);
  const [showComparisonDialog, setShowComparisonDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("current"); // Add state for active tab
  const [filters, setFilters] = useState<FilterOptions>({
    team: 'ALL',
    position: 'ALL',
    quickFilter: undefined
  });

  // Effect to automatically switch to historical tab when historical season is selected
  // Only switch automatically when season changes, not when user manually switches tabs
  useEffect(() => {
    if (currentSeason && !currentSeason.isCurrent && activeTab === "current") {
      setActiveTab("historical");
    }
  }, [currentSeason?.isCurrent]); // Removed activeTab from dependencies

  // Fetch current season data (2024-25) for Current Season tab
  const { data: currentPlayers, isLoading: isLoadingCurrentPlayers } = useQuery({
    queryKey: ["/api/fpl/players", "2024-25"],
    queryFn: () => fetchPlayers("2024-25"),
    enabled: !isSeasonLoading
  });

  const { data: currentFixtures } = useQuery({
    queryKey: ["/api/fpl/fixtures", "2024-25"],
    queryFn: () => fetchFixtures("2024-25"),
    enabled: !isSeasonLoading
  });

  const { data: currentBootstrapData } = useQuery({
    queryKey: ["/api/fpl/bootstrap-static", "2024-25"],
    queryFn: () => fetchBootstrapStatic("2024-25"),
    enabled: !isSeasonLoading
  });

  // Fetch historical season data for Historical Data tab
  const { data: historicalPlayers, isLoading: isLoadingHistoricalPlayers } = useQuery({
    queryKey: ["/api/fpl/players", currentSeason?.id],
    queryFn: () => fetchPlayers(currentSeason?.id || "2023-24"),
    enabled: !isSeasonLoading && !currentSeason?.isCurrent && !!currentSeason?.id
  });

  const { data: historicalBootstrapData } = useQuery({
    queryKey: ["/api/fpl/bootstrap-static", currentSeason?.id],
    queryFn: () => fetchBootstrapStatic(currentSeason?.id || "2023-24"),
    enabled: !isSeasonLoading && !currentSeason?.isCurrent && !!currentSeason?.id
  });

  // Filter current season players
  const filteredCurrentPlayers = useMemo(() => {
    if (!currentPlayers || !currentBootstrapData?.teams) return [];
    
    return currentPlayers.filter(player => {
      const matchesSearch = player.web_name.toLowerCase().includes(search.toLowerCase());
      const matchesTeam = filters.team === 'ALL' || Number(filters.team) === player.team;
      const matchesPosition = filters.position === 'ALL' || Number(filters.position) === player.element_type;
      const matchesQuickFilter = !filters.quickFilter || 
        (filters.quickFilter === 'IN_FORM' && parseFloat(player.form) > 5) || 
        (filters.quickFilter === 'BEST_VALUE' && player.now_cost < 70);
      return matchesSearch && matchesTeam && matchesPosition && matchesQuickFilter;
    });
  }, [currentPlayers, currentBootstrapData?.teams, search, filters]);

  // Filter historical season players
  const filteredHistoricalPlayers = useMemo(() => {
    if (!historicalPlayers || !historicalBootstrapData?.teams) return [];
    
    return historicalPlayers.filter(player => {
      const matchesSearch = player.web_name.toLowerCase().includes(search.toLowerCase());
      const matchesTeam = filters.team === 'ALL' || Number(filters.team) === player.team;
      const matchesPosition = filters.position === 'ALL' || Number(filters.position) === player.element_type;
      return matchesSearch && matchesTeam && matchesPosition;
    });
  }, [historicalPlayers, historicalBootstrapData?.teams, search, filters]);

  if (isLoadingCurrentPlayers || isSeasonLoading) {
    return <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-96 w-full" />
    </div>;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-radiant-violet to-pink-500 bg-clip-text text-transparent">
                Players
              </h1>
            </div>
            <p className="text-lg text-slate-600 dark:text-slate-300 font-medium">
              Search and compare player statistics
            </p>
          </div>
          <div className="flex items-center gap-4">
          </div>
        </div>

        {/* Tab Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="current" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Current Season (2024-25)
            </TabsTrigger>
            <TabsTrigger value="historical" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              Historical Data {currentSeason && !currentSeason.isCurrent && `(${currentSeason.name})`}
            </TabsTrigger>
          </TabsList>

          {/* Current Season Tab */}
          <TabsContent value="current" className="space-y-6">
            <Card>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center">
                      <div className="w-full md:w-48 lg:w-56">
                        <div className="relative">
                          <Input
                            placeholder="Search by player name, team or position..."
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
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2">
                        <TooltipProvider>
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
                          teams={currentBootstrapData?.teams ? 
                            currentBootstrapData.teams
                              .filter((team: BootstrapTeam) => currentPlayers?.some(p => p.team === team.id))
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

                    <PlayerTable 
                      players={filteredCurrentPlayers}
                      fixtures={currentFixtures}
                      teams={currentBootstrapData?.teams}
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
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Historical Data Tab */}
          <TabsContent value="historical" className="space-y-6">
            <div className="flex items-center justify-end">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Season:</span>
                </div>
                
                <Select
                  value={currentSeason?.id || "2023-24"}
                  onValueChange={(seasonId) => {
                    const selectedSeason = availableSeasons.find(s => s.id === seasonId);
                    if (selectedSeason) {
                      setCurrentSeason(selectedSeason);
                    }
                  }}
                  disabled={isSeasonLoading}
                >
                  <SelectTrigger className="w-[160px] bg-background border-input hover:bg-accent hover:text-accent-foreground transition-colors">
                    <SelectValue>
                      <div className="flex items-center gap-1 whitespace-nowrap">
                        <span>{currentSeason?.name || "2023-24"}</span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  
                  <SelectContent>
                    {availableSeasons
                      .filter(season => !season.isCurrent) // Exclude current season
                      .map((season) => (
                      <SelectItem 
                        key={season.id} 
                        value={season.id}
                        className="cursor-pointer"
                      >
                        <div className="flex items-center justify-between w-full whitespace-nowrap">
                          <span>{season.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                            placeholder="Search historical players..."
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
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2">
                        <TransferFilters
                          teams={historicalBootstrapData?.teams ? 
                            historicalBootstrapData.teams
                              .filter((team: BootstrapTeam) => historicalPlayers?.some(p => p.team === team.id))
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

                    <HistoricalPlayerTable 
                      players={filteredHistoricalPlayers}
                      teams={historicalBootstrapData?.teams}
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
                          // For historical data, show comparison instead of price tracking
                          if (!comparisonPlayer) {
                            setComparisonPlayer(player);
                          } else {
                            setShowComparisonDialog(true);
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Price Analysis Dialog - Only for current season */}
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
  );
}