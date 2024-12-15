import * as React from "react";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { type Player } from "../types/fpl";
import { Star, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";


interface PlayerTableProps {
  players: Player[];
  onPlayerClick: (player: Player) => void;
  selectedPlayerId?: number | null;
  highlightedPlayer?: Player | null;
  fixtures?: any[];
  teams?: any[];
}

interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

export function PlayerTable({ 
  players, 
  onPlayerClick, 
  selectedPlayerId, 
  highlightedPlayer,
  fixtures = [], 
  teams = [] 
}: PlayerTableProps) {
  const [selectedTeam, setSelectedTeam] = React.useState<number | null>(null);

  const filteredPlayers = React.useMemo(() => {
    return selectedTeam
      ? players.filter(player => player.team === selectedTeam)
      : players;
  }, [players, selectedTeam]);

  const getNextFixtures = (teamId: number) => {
    if (!fixtures || !teams) return [];
    
    const upcomingFixtures = fixtures
      .filter(f => 
        (f.team_h === teamId || f.team_a === teamId) && !f.finished
      )
      .slice(0, 3);
    
    return upcomingFixtures.map(fixture => {
      const isHome = fixture.team_h === teamId;
      const oppositionId = isHome ? fixture.team_a : fixture.team_h;
      const opposition = teams.find(t => t.id === oppositionId);
      
      return {
        opposition: opposition?.short_name || `Team ${oppositionId}`,
        difficulty: isHome ? fixture.team_h_difficulty : fixture.team_a_difficulty,
        isHome
      };
    });
  };

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 2) return "text-green-600";
    if (difficulty >= 4) return "text-red-600";
    return "text-orange-600";
  };

  const [sortConfig, setSortConfig] = React.useState<SortConfig>({
    key: 'total_points',
    direction: 'desc'
  });

  const handleSort = (key: string) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const sortedPlayers = React.useMemo(() => {
    return [...filteredPlayers].sort((a, b) => {
      let aValue = a[sortConfig.key as keyof Player];
      let bValue = b[sortConfig.key as keyof Player];
      
      // Handle special cases for numeric strings
      if (typeof aValue === 'string' && !isNaN(Number(aValue))) {
        aValue = Number(aValue);
        bValue = Number(bValue as string);
      }
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredPlayers, sortConfig]);

  const getPositionName = (element_type: number) => {
    switch (element_type) {
      case 1: return 'GK';
      case 2: return 'DEF';
      case 3: return 'MID';
      case 4: return 'FWD';
      default: return 'N/A';
    }
  };

  const SortableHeader = ({ 
    children, 
    sortKey 
  }: { 
    children: React.ReactNode;
    sortKey: string;
  }) => (
    <div 
      className="flex items-center gap-1 cursor-pointer"
      onClick={() => handleSort(sortKey)}
    >
      {children}
      <ArrowUpDown className="w-4 h-4" />
    </div>
  );

  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(sortedPlayers.length / itemsPerPage);
  const currentPlayers = sortedPlayers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const [search, setSearch] = React.useState("");

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="flex items-center gap-4 mb-4">
        <div className="relative flex-1">
          <Input
            placeholder="Search players..."
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
      <div className="overflow-x-auto"> {/* Added horizontal scrolling */}
        <Table>
            <TableHeader>
              <TableRow className="border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent hover:from-primary/10">
                <TableHead className="sticky left-0 bg-background w-[250px]">
                  <SortableHeader sortKey="web_name">Player Info</SortableHeader>
                </TableHead>
                <TableHead className="text-center">
                  <SortableHeader sortKey="element_type">Pos</SortableHeader>
                </TableHead>
                <TableHead className="text-center">
                  <SortableHeader sortKey="now_cost">Price</SortableHeader>
                </TableHead>
                <TableHead className="text-center">
                  <SortableHeader sortKey="form">Form</SortableHeader>
                </TableHead>
                <TableHead className="text-center">
                  <SortableHeader sortKey="total_points">Points</SortableHeader>
                </TableHead>
                <TableHead className="text-center">
                  <SortableHeader sortKey="points_per_game">PPG</SortableHeader>
                </TableHead>
                <TableHead className="text-center">
                  <SortableHeader sortKey="minutes">Mins</SortableHeader>
                </TableHead>
                <TableHead className="text-center">
                  <SortableHeader sortKey="goals_scored">G</SortableHeader>
                </TableHead>
                <TableHead className="text-center">
                  <SortableHeader sortKey="assists">A</SortableHeader>
                </TableHead>
                <TableHead className="text-center">
                  <SortableHeader sortKey="expected_goals">xG</SortableHeader>
                </TableHead>
                <TableHead className="text-center">
                  <SortableHeader sortKey="expected_assists">xA</SortableHeader>
                </TableHead>
                <TableHead className="text-center">
                  <SortableHeader sortKey="expected_goal_involvements">xGI</SortableHeader>
                </TableHead>
                <TableHead className="text-center">
                  <SortableHeader sortKey="bonus">Bonus</SortableHeader>
                </TableHead>
                <TableHead className="text-center">
                  <SortableHeader sortKey="bps">BPS</SortableHeader>
                </TableHead>
                <TableHead className="text-center">
                  <SortableHeader sortKey="influence">ICT Inf</SortableHeader>
                </TableHead>
                <TableHead className="text-center">
                  <SortableHeader sortKey="creativity">ICT Cre</SortableHeader>
                </TableHead>
                <TableHead className="text-center">
                  <SortableHeader sortKey="threat">ICT Thr</SortableHeader>
                </TableHead>
                <TableHead className="text-center">
                  <SortableHeader sortKey="ict_index">ICT</SortableHeader>
                </TableHead>
                <TableHead className="text-center">
                  <SortableHeader sortKey="clean_sheets">CS</SortableHeader>
                </TableHead>
                <TableHead className="text-center">
                  <SortableHeader sortKey="goals_conceded">GC</SortableHeader>
                </TableHead>
                <TableHead className="text-center">
                  <SortableHeader sortKey="saves">Saves</SortableHeader>
                </TableHead>
                <TableHead className="text-center">
                  <SortableHeader sortKey="penalties_saved">PS</SortableHeader>
                </TableHead>
                <TableHead className="text-center">
                  <SortableHeader sortKey="penalties_missed">PM</SortableHeader>
                </TableHead>
                <TableHead className="text-center">
                  <SortableHeader sortKey="yellow_cards">YC</SortableHeader>
                </TableHead>
                <TableHead className="text-center">
                  <SortableHeader sortKey="red_cards">RC</SortableHeader>
                </TableHead>
                <TableHead className="text-center">
                  <SortableHeader sortKey="selected_by_percent">Sel%</SortableHeader>
                </TableHead>
                <TableHead className="text-center sticky right-0 bg-background">NF</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentPlayers.map((player) => (
                <TableRow 
                  key={player.id}
                  className={cn(
                    "cursor-pointer transition-all duration-200 hover:bg-primary/5 hover:backdrop-blur-lg group",
                    selectedPlayerId === player.id && "bg-primary/10 hover:bg-primary/15",
                    highlightedPlayer?.id === player.id && "bg-blue-500/10 hover:bg-blue-500/15 ring-1 ring-blue-500/30"
                  )}
                  onClick={() => onPlayerClick(player)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground/90 group-hover:text-primary transition-colors">
                          {player.web_name}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {(() => {
                            const teamData: Record<number, { name: string, abbr: string }> = {
                              3: { name: "Arsenal", abbr: "ARS" },
                              7: { name: "Aston Villa", abbr: "AVL" },
                              91: { name: "Bournemouth", abbr: "BOU" },
                              94: { name: "Brentford", abbr: "BRE" },
                              36: { name: "Brighton", abbr: "BHA" },
                              21: { name: "Burnley", abbr: "BUR" },
                              8: { name: "Chelsea", abbr: "CHE" },
                              31: { name: "Crystal Palace", abbr: "CRY" },
                              11: { name: "Everton", abbr: "EVE" },
                              13: { name: "Fulham", abbr: "FUL" },
                              14: { name: "Liverpool", abbr: "LIV" },
                              23: { name: "Luton", abbr: "LUT" },
                              43: { name: "Man City", abbr: "MCI" },
                              1: { name: "Man United", abbr: "MUN" },
                              34: { name: "Newcastle", abbr: "NEW" },
                              17: { name: "Nott'm Forest", abbr: "NFO" },
                              49: { name: "Sheffield Utd", abbr: "SHU" },
                              33: { name: "Tottenham", abbr: "TOT" },
                              25: { name: "West Ham", abbr: "WHU" },
                              39: { name: "Wolves", abbr: "WOL" }
                            };
                            
                            // Use the teams prop if available, otherwise fallback to static mapping
                            if (teams && teams.length > 0) {
                              const team = teams.find(t => t.id === player.team);
                              return team ? team.name : `Unknown Team (${player.team})`;
                            }
                            
                            // Fallback to static mapping
                            const team = teamData[player.team];
                            return team ? team.name : `Unknown Team (${player.team})`;
                          })()}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "mx-auto font-medium transition-all duration-200",
                        player.element_type === 1 && "bg-yellow-500/10 text-yellow-700 border-yellow-200/50",
                        player.element_type === 2 && "bg-blue-500/10 text-blue-700 border-blue-200/50",
                        player.element_type === 3 && "bg-green-500/10 text-green-700 border-green-200/50",
                        player.element_type === 4 && "bg-red-500/10 text-red-700 border-red-200/50"
                      )}
                    >
                      {getPositionName(player.element_type)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center font-medium">
                    <span className="bg-primary/5 px-2 py-1 rounded-md">
                      £{(player.now_cost / 10).toFixed(1)}m
                    </span>
                  </TableCell>
                  <TableCell className="text-center font-medium">{player.form}</TableCell>
                  <TableCell className="text-center">
                    <span className="font-semibold text-primary">{player.total_points}</span>
                  </TableCell>
                  <TableCell className="text-center font-medium">{player.points_per_game}</TableCell>
                  <TableCell className="text-center font-medium">{player.minutes}</TableCell>
                  <TableCell className="text-center">
                    <span className="font-semibold text-green-600">{player.goals_scored}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-semibold text-blue-600">{player.assists}</span>
                  </TableCell>
                  <TableCell className="text-center font-medium">
                    {player.expected_goals?.toFixed(2) || '0.00'}
                  </TableCell>
                  <TableCell className="text-center font-medium">
                    {player.expected_assists?.toFixed(2) || '0.00'}
                  </TableCell>
                  <TableCell className="text-center font-medium">
                    {player.expected_goal_involvements?.toFixed(2) || '0.00'}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-semibold text-yellow-600">{player.bonus}</span>
                  </TableCell>
                  <TableCell className="text-center font-medium">{player.bps}</TableCell>
                  <TableCell className="text-center font-medium">{parseFloat(player.influence).toFixed(1)}</TableCell>
                  <TableCell className="text-center font-medium">{parseFloat(player.creativity).toFixed(1)}</TableCell>
                  <TableCell className="text-center font-medium">{parseFloat(player.threat).toFixed(1)}</TableCell>
                  <TableCell className="text-center font-medium">{parseFloat(player.ict_index).toFixed(1)}</TableCell>
                  <TableCell className="text-center font-medium">{player.clean_sheets}</TableCell>
                  <TableCell className="text-center font-medium">{player.goals_conceded}</TableCell>
                  <TableCell className="text-center font-medium">{player.saves}</TableCell>
                  <TableCell className="text-center font-medium">{player.penalties_saved}</TableCell>
                  <TableCell className="text-center font-medium">{player.penalties_missed}</TableCell>
                  <TableCell className="text-center">
                    <span className="font-medium text-yellow-600">{player.yellow_cards}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-medium text-red-600">{player.red_cards}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="bg-primary/5 px-2 py-1 rounded-md">
                      {parseFloat(player.selected_by_percent).toFixed(1)}%
                    </span>
                  </TableCell>
                  <TableCell className="text-center sticky right-0 bg-background min-w-[200px]">
                    {(() => {
                      const fixtures = getNextFixtures(player.team);
                      if (!fixtures.length) return "-";
                      
                      return (
                        <div className="flex items-center justify-center gap-3">
                          {fixtures.map((fixture, idx) => (
                            <span 
                              key={idx} 
                              className={cn(
                                "px-2 py-1 rounded-md transition-all duration-200",
                                fixture.difficulty <= 2 && "bg-green-500/10 text-green-700",
                                fixture.difficulty === 3 && "bg-yellow-500/10 text-yellow-700",
                                fixture.difficulty >= 4 && "bg-red-500/10 text-red-700"
                              )}
                            >
                              {fixture.opposition} ({fixture.isHome ? 'H' : 'A'})
                            </span>
                          ))}
                        </div>
                      );
                    })()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
      </div>
      
      {/* Pagination Controls */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="transition-all duration-200 hover:bg-primary/10 hover:border-primary/50"
        >
          Previous
        </Button>
        <span className="text-sm text-muted-foreground">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          variant="outline"
          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          className="transition-all duration-200 hover:bg-primary/10 hover:border-primary/50"
        >
          Next
        </Button>
      </div>

      {/* Abbreviations Legend */}
      <div className="space-y-6">
        <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Abbreviations Guide
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { abbr: "Pos", full: "Position" },
            { abbr: "PPG", full: "Points Per Game" },
            { abbr: "G", full: "Goals" },
            { abbr: "A", full: "Assists" },
            { abbr: "CS", full: "Clean Sheets" },
            { abbr: "Sel%", full: "Selected By Percentage" },
            { abbr: "NF", full: "Next Fixture" },
            { abbr: "xG", full: "Expected Goals" },
            { abbr: "xA", full: "Expected Assists" },
            { abbr: "xGI", full: "Expected Goal Involvement" },
            { abbr: "BPS", full: "Bonus Points System" },
            { abbr: "ICT", full: "Influence, Creativity, Threat" },
            { abbr: "GC", full: "Goals Conceded" },
            { abbr: "PS", full: "Penalties Saved" },
            { abbr: "PM", full: "Penalties Missed" },
            { abbr: "YC", full: "Yellow Cards" },
            { abbr: "RC", full: "Red Cards" },

          ].map(({ abbr, full }) => (
            <div 
              key={abbr}
              className="bg-gradient-to-br from-card to-card/80 rounded-lg p-4 border border-border/40 shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 hover:bg-gradient-to-br hover:from-primary/5 hover:to-primary/10"
            >
              <div className="font-bold text-lg text-primary/90">{abbr}</div>
              <div className="text-sm text-muted-foreground mt-1">{full}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}