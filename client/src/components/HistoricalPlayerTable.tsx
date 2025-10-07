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
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HistoricalPlayerTableProps {
  players: Player[];
  onPlayerClick: (player: Player) => void;
  selectedPlayerId?: number | null;
  highlightedPlayer?: Player | null;
  teams?: any[];
}

interface SortConfig {
  key: keyof Player | 'position';
  direction: 'asc' | 'desc';
}

export function HistoricalPlayerTable({ 
  players, 
  onPlayerClick, 
  selectedPlayerId, 
  highlightedPlayer,
  teams = [] 
}: HistoricalPlayerTableProps) {
  const [sortConfig, setSortConfig] = React.useState<SortConfig>({
    key: 'total_points',
    direction: 'desc'
  });
  
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 50; // Show more players for historical data

  const handleSort = (key: keyof Player | 'position') => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const sortedPlayers = React.useMemo(() => {
    return [...players].sort((a, b) => {
      let aValue = a[sortConfig.key as keyof Player];
      let bValue = b[sortConfig.key as keyof Player];
      
      // Handle special cases for numeric strings
      if (typeof aValue === 'string' && !isNaN(Number(aValue))) {
        aValue = Number(aValue);
        bValue = Number(bValue as string);
      }
      
      if (!aValue) return 1;
      if (!bValue) return -1;
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [players, sortConfig]);

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
    sortKey: keyof Player | 'position';
  }) => (
    <div 
      className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors"
      onClick={() => handleSort(sortKey)}
    >
      {children}
      <ArrowUpDown className="w-4 h-4" />
    </div>
  );

  const totalPages = Math.ceil(sortedPlayers.length / itemsPerPage);
  const currentPlayers = sortedPlayers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto"> 
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent hover:from-primary/10">
              <TableHead className="sticky left-0 bg-background w-[200px]">
                <SortableHeader sortKey="web_name">Player</SortableHeader>
              </TableHead>
              <TableHead className="text-center">
                <SortableHeader sortKey="element_type">Pos</SortableHeader>
              </TableHead>
              <TableHead className="text-center">
                <SortableHeader sortKey="now_cost">End Price</SortableHeader>
              </TableHead>
              <TableHead className="text-center">
                <SortableHeader sortKey="total_points">Total Points</SortableHeader>
              </TableHead>
              <TableHead className="text-center">
                <SortableHeader sortKey="points_per_game">PPG</SortableHeader>
              </TableHead>
              <TableHead className="text-center">
                <SortableHeader sortKey="minutes">Minutes</SortableHeader>
              </TableHead>
              <TableHead className="text-center">
                <SortableHeader sortKey="goals_scored">Goals</SortableHeader>
              </TableHead>
              <TableHead className="text-center">
                <SortableHeader sortKey="assists">Assists</SortableHeader>
              </TableHead>
              <TableHead className="text-center">
                <SortableHeader sortKey="bonus">Bonus</SortableHeader>
              </TableHead>
              <TableHead className="text-center">
                <SortableHeader sortKey="bps">BPS</SortableHeader>
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
              <TableHead className="text-center">
                <SortableHeader sortKey="transfers_in_event">TI</SortableHeader>
              </TableHead>
              <TableHead className="text-center">
                <SortableHeader sortKey="transfers_out_event">TO</SortableHeader>
              </TableHead>
              <TableHead className="text-center">
                <SortableHeader sortKey="expected_goals">xG</SortableHeader>
              </TableHead>
              <TableHead className="text-center">
                <SortableHeader sortKey="expected_assists">xA</SortableHeader>
              </TableHead>
              <TableHead className="text-center">
                <SortableHeader sortKey="ict_index">ICT</SortableHeader>
              </TableHead>
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
                          if (teams && teams.length > 0) {
                            const team = teams.find(t => t.id === player.team);
                            return team ? team.name : `Unknown Team (${player.team})`;
                          }
                          return `Team ${player.team}`;
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
                <TableCell className="text-center">
                  <span className="font-semibold text-primary text-lg">{player.total_points}</span>
                </TableCell>
                <TableCell className="text-center font-medium">{player.points_per_game}</TableCell>
                <TableCell className="text-center font-medium">{player.minutes.toLocaleString()}</TableCell>
                <TableCell className="text-center">
                  <span className="font-semibold text-green-600">{player.goals_scored}</span>
                </TableCell>
                <TableCell className="text-center">
                  <span className="font-semibold text-blue-600">{player.assists}</span>
                </TableCell>
                <TableCell className="text-center">
                  <span className="font-semibold text-yellow-600">{player.bonus}</span>
                </TableCell>
                <TableCell className="text-center font-medium">{player.bps.toLocaleString()}</TableCell>
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
                <TableCell className="text-center">
                  {player.transfers_in_event ? (
                    <span className="text-green-600 font-medium">
                      +{player.transfers_in_event.toLocaleString()}
                    </span>
                  ) : '-'}
                </TableCell>
                <TableCell className="text-center">
                  {player.transfers_out_event ? (
                    <span className="text-red-600 font-medium">
                      -{player.transfers_out_event.toLocaleString()}
                    </span>
                  ) : '-'}
                </TableCell>
                <TableCell className="text-center">
                  <span className="font-medium text-green-600">
                    {player.expected_goals && typeof player.expected_goals === 'number' ? player.expected_goals.toFixed(1) : '-'}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <span className="font-medium text-blue-600">
                    {player.expected_assists && typeof player.expected_assists === 'number' ? player.expected_assists.toFixed(1) : '-'}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <span className="font-medium text-purple-600">
                    {player.ict_index && !isNaN(parseFloat(player.ict_index)) ? parseFloat(player.ict_index).toFixed(1) : '-'}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
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
          Page {currentPage} of {totalPages} ({sortedPlayers.length} players)
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

      <div className="space-y-4">
        <h3 className="text-lg font-semibold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Historical Data Guide
        </h3>
        <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-8 gap-2">
          {[
            { abbr: "Pos", full: "Position" },
            { abbr: "PPG", full: "Points Per Game" },
            { abbr: "CS", full: "Clean Sheets" },
            { abbr: "Sel%", full: "Selected By %" },
            { abbr: "BPS", full: "Bonus Points" },
            { abbr: "GC", full: "Goals Conceded" },
            { abbr: "PS", full: "Penalties Saved" },
            { abbr: "PM", full: "Penalties Missed" },
            { abbr: "YC", full: "Yellow Cards" },
            { abbr: "RC", full: "Red Cards" },
            { abbr: "TI", full: "Transfers In" },
            { abbr: "TO", full: "Transfers Out" },
            { abbr: "xG", full: "Expected Goals" },
            { abbr: "xA", full: "Expected Assists" },
            { abbr: "ICT", full: "ICT Index" },
            { abbr: "End Price", full: "End of Season Price" },
          ].map(({ abbr, full }) => (
            <div 
              key={abbr}
              className="bg-gradient-to-br from-card to-card/80 rounded-md p-2 border border-border/40 shadow-sm hover:shadow-md transition-all hover:bg-gradient-to-br hover:from-primary/5 hover:to-primary/10"
            >
              <div className="font-semibold text-sm text-primary/90">{abbr}</div>
              <div className="text-xs text-muted-foreground">{full}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
