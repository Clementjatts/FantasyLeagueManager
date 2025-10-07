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
import { predictPlayerPoints } from "@/lib/fpl-utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PlayerTableProps {
  players: Player[];
  onPlayerClick: (player: Player) => void;
  selectedPlayerId?: number | null;
  highlightedPlayer?: Player | null;
  fixtures?: any[];
  teams?: any[];
}

interface SortConfig {
  key: keyof Player | 'position' | 'predicted_points';
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
  const [sortConfig, setSortConfig] = React.useState<SortConfig>({
    key: 'total_points',
    direction: 'desc'
  });
  
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 50;

  const handleSort = (key: keyof Player | 'position' | 'predicted_points') => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const sortedPlayers = React.useMemo(() => {
    return [...players].map(player => ({
      ...player,
      predicted_points: fixtures ? predictPlayerPoints(player, fixtures) : 0
    })).sort((a, b) => {
      let aValue = a[sortConfig.key as keyof (Player & { predicted_points: number })];
      let bValue = b[sortConfig.key as keyof (Player & { predicted_points: number })];
      
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
  }, [players, sortConfig, fixtures]);

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
    sortKey: keyof Player | 'position' | 'predicted_points';
    tooltip?: string;
  }) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className="flex w-full items-center justify-center gap-1 cursor-pointer"
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
              <TableHead className="sticky left-0 bg-background w-[250px] text-center">
                <SortableHeader sortKey="web_name" tooltip="Player name and club">Player</SortableHeader>
              </TableHead>
              <TableHead className="text-center">
                <SortableHeader sortKey="element_type" tooltip="Position (GK, DEF, MID, FWD)">Pos</SortableHeader>
              </TableHead>
              <TableHead className="text-center">
                <SortableHeader sortKey="now_cost" tooltip="Current price in £m">Price</SortableHeader>
              </TableHead>
              <TableHead className="text-center">
                <SortableHeader sortKey="form" tooltip="Recent form (FPL form metric)">Form</SortableHeader>
              </TableHead>
              <TableHead className="text-center">
                <SortableHeader sortKey="predicted_points" tooltip="Expected points for upcoming GW (model)">xP</SortableHeader>
              </TableHead>
              <TableHead className="text-center">
                <SortableHeader sortKey="total_points" tooltip="Total points this season">Points</SortableHeader>
              </TableHead>
              <TableHead className="text-center">
                <SortableHeader sortKey="points_per_game" tooltip="Points per game">PPG</SortableHeader>
              </TableHead>
              <TableHead className="text-center">
                <SortableHeader sortKey="minutes" tooltip="Minutes played">Mins</SortableHeader>
              </TableHead>
              <TableHead className="text-center">
                <SortableHeader sortKey="goals_scored" tooltip="Goals scored">G</SortableHeader>
              </TableHead>
              <TableHead className="text-center">
                <SortableHeader sortKey="assists" tooltip="Assists">A</SortableHeader>
              </TableHead>
              <TableHead className="text-center">
                <SortableHeader sortKey="status" tooltip="Availability status">Status</SortableHeader>
              </TableHead>
              <TableHead className="text-center">
                <SortableHeader sortKey="bonus" tooltip="Bonus points earned">Bonus</SortableHeader>
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
                <SortableHeader sortKey="expected_goals_per_90" tooltip="Expected goals per 90 minutes">xG/90</SortableHeader>
              </TableHead>
              <TableHead className="text-center">
                <SortableHeader sortKey="expected_assists_per_90" tooltip="Expected assists per 90 minutes">xA/90</SortableHeader>
              </TableHead>
              <TableHead className="text-center">
                <SortableHeader sortKey="points_per_game_rank" tooltip="Rank by points per game">Rank</SortableHeader>
              </TableHead>
              <TableHead className="text-center">
                <SortableHeader sortKey="set_piece_threat" tooltip="Set piece involvement/threat">SP</SortableHeader>
              </TableHead>
              <TableHead className="text-center sticky right-0 bg-background">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>Next Fixtures</div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <span>Next fixtures (full team names)</span>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
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
                  <span className="bg-primary/5 px-2 py-1 rounded-md">
                    £{player.now_cost && typeof player.now_cost === 'number' ? (player.now_cost / 10).toFixed(1) : '0.0'}m
                  </span>
                </TableCell>
                <TableCell className="text-center font-medium">{player.form}</TableCell>
                <TableCell className="text-center">
                  <span className="font-medium text-primary">
                    {fixtures ? predictPlayerPoints(player, fixtures).toFixed(1) : '-'}
                  </span>
                </TableCell>
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
                <TableCell className="text-center">
                  <Badge 
                    variant={player.status === 'a' ? 'default' : 'destructive'}
                    className="mx-auto font-medium"
                  >
                    {player.status === 'a' ? 'Available' : 'Injured'}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <span className="font-semibold text-yellow-600">{player.bonus}</span>
                </TableCell>
                <TableCell className="text-center font-medium">{player.bps}</TableCell>
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
                    {player.selected_by_percent && !isNaN(parseFloat(player.selected_by_percent)) ? parseFloat(player.selected_by_percent).toFixed(1) : '0.0'}%
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
                    {player.expected_goals_per_90 && typeof player.expected_goals_per_90 === 'number' ? player.expected_goals_per_90.toFixed(2) : '-'}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <span className="font-medium text-blue-600">
                    {player.expected_assists_per_90 && typeof player.expected_assists_per_90 === 'number' ? player.expected_assists_per_90.toFixed(2) : '-'}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <span className="bg-primary/5 px-2 py-1 rounded-md text-xs">
                    {player.points_per_game_rank ? `#${player.points_per_game_rank}` : '-'}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <span className="font-medium text-purple-600">
                    {player.set_piece_threat && typeof player.set_piece_threat === 'number' ? player.set_piece_threat.toFixed(1) : '-'}
                  </span>
                </TableCell>
                <TableCell className="text-center sticky right-0 bg-background min-w-[200px]">
                  {(() => {
                    const nextFixtures = fixtures
                      .filter(f => 
                        (f.team_h === player.team || f.team_a === player.team) && 
                        !f.finished && 
                        f.event // Only include fixtures with valid event (gameweek)
                      )
                      .sort((a, b) => (a.event || 0) - (b.event || 0)) // Sort by gameweek
                      .slice(0, 5) // Show next 5 fixtures
                      .map(fixture => {
                        const isHome = fixture.team_h === player.team;
                        const oppositionId = isHome ? fixture.team_a : fixture.team_h;
                        const opposition = teams.find(t => t.id === oppositionId);
                        const difficulty = isHome ? fixture.team_h_difficulty : fixture.team_a_difficulty;
                        
                        return {
                          opposition: opposition?.short_name || `Team ${oppositionId}`,
                          difficulty,
                          isHome,
                          event: fixture.event
                        };
                      });

                    if (!nextFixtures.length) return "-";
                    
                    return (
                      <div className="flex items-center justify-center gap-2">
                        {nextFixtures.map((fixture, idx) => (
                          <span 
                            key={`${player.id}-${fixture.event}-${idx}`}
                            className={cn(
                              "px-2 py-1 rounded-md text-xs font-medium",
                              "transition-colors duration-200",
                              fixture.difficulty === 5 && "bg-red-500/20 text-red-700",
                              fixture.difficulty === 4 && "bg-orange-500/20 text-orange-700",
                              fixture.difficulty === 3 && "bg-yellow-500/20 text-yellow-700",
                              fixture.difficulty === 2 && "bg-green-500/20 text-green-700",
                              fixture.difficulty === 1 && "bg-emerald-500/20 text-emerald-700",
                            )}
                            title={`${fixture.isHome ? 'vs' : '@'} ${fixture.opposition} (GW${fixture.event})`}
                          >
                            {fixture.isHome ? fixture.opposition : `${fixture.opposition}(A)`}
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


    </div>
  );
}