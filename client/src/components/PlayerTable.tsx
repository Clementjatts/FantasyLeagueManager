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

interface PlayerTableProps {
  players: Player[];
  onPlayerClick: (player: Player) => void;
  selectedPlayerId?: number | null;
  fixtures?: any[];
  teams?: any[];
}

interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

export function PlayerTable({ players, onPlayerClick, selectedPlayerId, fixtures = [], teams = [] }: PlayerTableProps) {
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

  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(sortedPlayers.length / itemsPerPage);
  const currentPlayers = sortedPlayers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">
              <SortableHeader sortKey="web_name">Player</SortableHeader>
            </TableHead>
            <TableHead className="w-[150px]">
              <SortableHeader sortKey="team">Club</SortableHeader>
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
            <TableHead className="text-center">
              <SortableHeader sortKey="expected_goals">xG</SortableHeader>
            </TableHead>
            {/* Show clean sheets for DEF/GK */}
            <TableHead className="text-center">CS</TableHead>
            <TableHead className="text-center">
              <SortableHeader sortKey="selected_by_percent">Sel</SortableHeader>
            </TableHead>
            <TableHead className="text-center">NF</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {currentPlayers.map((player) => (
            <TableRow 
              key={player.id}
              className={cn(
                "cursor-pointer transition-colors hover:bg-muted/50",
                selectedPlayerId === player.id && "bg-primary/5 hover:bg-primary/10"
              )}
              onClick={() => onPlayerClick(player)}
            >
              <TableCell>
                <div className="flex items-center font-medium">
                  {player.web_name}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center text-muted-foreground">
                  {(() => {
                    const teamData: Record<number, { name: string, abbr: string }> = {
                      1: { name: "Arsenal", abbr: "ARS" },
                      2: { name: "Aston Villa", abbr: "AVL" },
                      3: { name: "Bournemouth", abbr: "BOU" },
                      4: { name: "Brentford", abbr: "BRE" },
                      5: { name: "Brighton", abbr: "BHA" },
                      6: { name: "Chelsea", abbr: "CHE" },
                      7: { name: "Crystal Palace", abbr: "CRY" },
                      8: { name: "Everton", abbr: "EVE" },
                      9: { name: "Fulham", abbr: "FUL" },
                      10: { name: "Liverpool", abbr: "LIV" },
                      11: { name: "Luton", abbr: "LUT" },
                      12: { name: "Man City", abbr: "MCI" },
                      13: { name: "Man United", abbr: "MUN" },
                      14: { name: "Newcastle", abbr: "NEW" },
                      15: { name: "Nott'm Forest", abbr: "NFO" },
                      16: { name: "Sheffield Utd", abbr: "SHU" },
                      17: { name: "Tottenham", abbr: "TOT" },
                      18: { name: "West Ham", abbr: "WHU" },
                      19: { name: "Wolves", abbr: "WOL" },
                      20: { name: "Burnley", abbr: "BUR" }
                    };
                    const team = teamData[player.team];
                    return (
                      <span 
                        title={team?.name}
                        className="font-medium"
                      >
                        {team?.abbr || `T${player.team}`}
                      </span>
                    );
                  })()}
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
                {((player.goals_scored || 0) * 0.8).toFixed(2)}
              </TableCell>
              <TableCell className="text-center font-medium">
                {(player.element_type === 1 || player.element_type === 2) ? 
                  player.clean_sheets : '-'}
              </TableCell>
              <TableCell className="text-center font-medium">
                {parseFloat(player.selected_by_percent).toFixed(1)}
              </TableCell>
              <TableCell className="text-center min-w-[200px]">
                {(() => {
                  const fixtures = getNextFixtures(player.team);
                  if (!fixtures.length) return "-";
                  
                  return (
                    <div className="flex items-center justify-center gap-3">
                      {fixtures.map((fixture, idx) => (
                        <span key={idx} className={getDifficultyColor(fixture.difficulty)}>
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
        >
          Next
        </Button>
      </div>

      {/* Abbreviations Legend */}
      <div className="space-y-6">
        <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Abbreviations Guide</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { abbr: "Pos", full: "Position" },
            { abbr: "PPG", full: "Points Per Game" },
            { abbr: "G", full: "Goals" },
            { abbr: "A", full: "Assists" },
            { abbr: "CS", full: "Clean Sheets" },
            { abbr: "Sel", full: "Selected By Percentage" },
            { abbr: "NF", full: "Next Fixture" },
            { abbr: "xG", full: "Expected Goals" },
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