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

interface PlayerTableProps {
  players: Player[];
  onPlayerClick: (player: Player) => void;
  selectedPlayerId?: number;
}

interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

export function PlayerTable({ players, onPlayerClick, selectedPlayerId }: PlayerTableProps) {
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
    return [...players].sort((a, b) => {
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

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[250px]">
              <SortableHeader sortKey="web_name">Player</SortableHeader>
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
              <SortableHeader sortKey="bonus">Bonus</SortableHeader>
            </TableHead>
            {/* Show clean sheets for DEF/GK */}
            <TableHead className="text-center">CS</TableHead>
            <TableHead className="text-center">
              <SortableHeader sortKey="selected_by_percent">Sel %</SortableHeader>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedPlayers.map((player) => (
            <TableRow 
              key={player.id}
              className={cn(
                "cursor-pointer transition-colors hover:bg-muted/50",
                selectedPlayerId === player.id && "bg-primary/5 hover:bg-primary/10"
              )}
              onClick={() => onPlayerClick(player)}
            >
              <TableCell>
                <div className="flex items-center gap-2">
                  {player.is_captain && <Star className="w-4 h-4 text-yellow-500" />}
                  <div>
                    <div>{player.web_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {player.team_name}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-center">
                <Badge variant="outline" className="mx-auto">
                  {getPositionName(player.element_type)}
                </Badge>
              </TableCell>
              <TableCell className="text-center font-medium">£{(player.now_cost / 10).toFixed(1)}m</TableCell>
              <TableCell className="text-center font-medium">{player.form}</TableCell>
              <TableCell className="text-center font-medium">{player.total_points}</TableCell>
              <TableCell className="text-center font-medium">{player.points_per_game}</TableCell>
              <TableCell className="text-center font-medium">{player.minutes}</TableCell>
              <TableCell className="text-center font-medium">{player.goals_scored}</TableCell>
              <TableCell className="text-center font-medium">{player.assists}</TableCell>
              <TableCell className="text-center font-medium">{player.bonus}</TableCell>
              <TableCell className="text-center font-medium">
                {(player.element_type === 1 || player.element_type === 2) ? 
                  player.clean_sheets : '-'}
              </TableCell>
              <TableCell className="text-center font-medium">
                {parseFloat(player.selected_by_percent).toFixed(1)}%
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}