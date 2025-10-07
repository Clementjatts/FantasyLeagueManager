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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
    sortKey,
    tooltip
  }: { 
    children: React.ReactNode;
    sortKey: keyof Player | 'position';
    tooltip?: string;
  }) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className="flex w-full items-center justify-center gap-1 cursor-pointer hover:text-primary transition-colors"
            onClick={() => handleSort(sortKey)}
          >
            {children}
            <ArrowUpDown className="w-4 h-4" />
          </div>
        </TooltipTrigger>
        {tooltip && (
          <TooltipContent>
            <span>{tooltip}</span>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
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
            <TableRow className="border-b border-border/40 bg-gradient-to-r from-primary/5 to-transparent hover:from-primary/10 divide-x divide-border/30">
              <TableHead className="sticky left-0 bg-background w-[200px] text-center">
                <SortableHeader sortKey="web_name" tooltip="Player name and club">Player</SortableHeader>
              </TableHead>
              <TableHead className="text-center">
                <SortableHeader sortKey="element_type" tooltip="Position (GK, DEF, MID, FWD)">Pos</SortableHeader>
              </TableHead>
              <TableHead className="text-center">
                <SortableHeader sortKey="now_cost" tooltip="End of season price">EP</SortableHeader>
              </TableHead>
              <TableHead className="text-center">
                <SortableHeader sortKey="total_points" tooltip="Total points">TP</SortableHeader>
              </TableHead>
              <TableHead className="text-center">
                <SortableHeader sortKey="points_per_game" tooltip="Points per game">PPG</SortableHeader>
              </TableHead>
              <TableHead className="text-center">
                <SortableHeader sortKey="minutes" tooltip="Minutes played">Minutes</SortableHeader>
              </TableHead>
              <TableHead className="text-center">
                <SortableHeader sortKey="goals_scored" tooltip="Goals scored">Goals</SortableHeader>
              </TableHead>
              <TableHead className="text-center">
                <SortableHeader sortKey="assists" tooltip="Assists">Assists</SortableHeader>
              </TableHead>
              <TableHead className="text-center">
                <SortableHeader sortKey="bonus" tooltip="Bonus points">Bonus</SortableHeader>
              </TableHead>
              <TableHead className="text-center">
                <SortableHeader sortKey="bps" tooltip="Bonus point system score">BPS</SortableHeader>
              </TableHead>
              <TableHead className="text-center">
                <SortableHeader sortKey="clean_sheets" tooltip="Clean sheets">CS</SortableHeader>
              </TableHead>
              <TableHead className="text-center">
                <SortableHeader sortKey="goals_conceded" tooltip="Goals conceded">GC</SortableHeader>
              </TableHead>
              <TableHead className="text-center">
                <SortableHeader sortKey="saves" tooltip="Saves (GK)">Saves</SortableHeader>
              </TableHead>
              <TableHead className="text-center">
                <SortableHeader sortKey="penalties_saved" tooltip="Penalties saved (GK)">PS</SortableHeader>
              </TableHead>
              <TableHead className="text-center">
                <SortableHeader sortKey="penalties_missed" tooltip="Penalties missed">PM</SortableHeader>
              </TableHead>
              <TableHead className="text-center">
                <SortableHeader sortKey="yellow_cards" tooltip="Yellow cards">YC</SortableHeader>
              </TableHead>
              <TableHead className="text-center">
                <SortableHeader sortKey="red_cards" tooltip="Red cards">RC</SortableHeader>
              </TableHead>
              <TableHead className="text-center">
                <SortableHeader sortKey="selected_by_percent" tooltip="Selected by percentage">Sel%</SortableHeader>
              </TableHead>
              <TableHead className="text-center">
                <SortableHeader sortKey="transfers_in_event" tooltip="Transfers in (this GW)">TI</SortableHeader>
              </TableHead>
              <TableHead className="text-center">
                <SortableHeader sortKey="transfers_out_event" tooltip="Transfers out (this GW)">TO</SortableHeader>
              </TableHead>
              <TableHead className="text-center">
                <SortableHeader sortKey="expected_goals" tooltip="Expected goals">xG</SortableHeader>
              </TableHead>
              <TableHead className="text-center">
                <SortableHeader sortKey="expected_assists" tooltip="Expected assists">xA</SortableHeader>
              </TableHead>
              <TableHead className="text-center">
                <SortableHeader sortKey="ict_index" tooltip="Influence, Creativity, Threat index">ICT</SortableHeader>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentPlayers.map((player) => (
              <TableRow 
                key={player.id}
                className={cn(
                  "cursor-pointer transition-all duration-200 hover:bg-primary/5 hover:backdrop-blur-lg group border-b border-border/20 divide-x divide-border/20",
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
                  <span className="bg-primary/5 px-2 py-1 rounded-md inline-block">
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


    </div>
  );
}
