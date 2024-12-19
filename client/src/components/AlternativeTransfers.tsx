import { useState } from "react";
import { type Player } from "../types/fpl";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { InfoIcon, TrendingUp, TrendingDown, Clock, Target } from "lucide-react";

interface AlternativeTransfersProps {
  currentPlayers: Player[];
  allPlayers: Player[];
  budget: number;
  fixtures: any[];
  teams: any[];
  freeTransfers: number;
}

const ITEMS_PER_PAGE = 5;

const AlternativeTransfers: React.FC<AlternativeTransfersProps> = ({
  currentPlayers,
  allPlayers,
  budget,
  fixtures,
  teams,
  freeTransfers,
}) => {
  const [currentPage, setCurrentPage] = useState(0);

  const currentPlayerIds = currentPlayers.map((player) => player.id);

  const alternativeOptions = allPlayers
    .filter((player) => !currentPlayerIds.includes(player.id) && parseFloat(player.form) > 5 && player.minutes > 450)
    .sort((a, b) => parseFloat(b.form) - parseFloat(a.form))
    .slice(5, 15);

  const totalPages = Math.ceil(alternativeOptions.length / ITEMS_PER_PAGE);
  const currentOptions = alternativeOptions.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE
  );

  const nextPage = () => {
    setCurrentPage((prev) => (prev + 1) % totalPages);
  };

  const prevPage = () => {
    setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages);
  };

  const getNextFixtures = (player: Player) => {
    if (!fixtures || !teams) return "";
    
    return fixtures
      ?.filter(f => f.team_h === player.team || f.team_a === player.team)
      .slice(0, 3)
      .map(f => {
        const isHome = f.team_h === player.team;
        const opponent = teams[isHome ? f.team_a - 1 : f.team_h - 1]?.short_name;
        const difficulty = isHome ? f.team_h_difficulty : f.team_a_difficulty;
        console.log('Fixture:', { 
          team: player.team,
          opponent,
          isHome,
          difficulty,
          raw: f
        });
        return `${isHome ? 'H' : 'A'} ${opponent} (${difficulty || '-'})`;
      })
      .join(', ');
  };

  const getFormTrend = (player: Player) => {
    // Convert form to a numeric value for comparison
    const currentForm = parseFloat(player.form);
    // Form trend can be determined by points per game or recent performance
    const pointsPerGame = parseFloat(player.points_per_game);
    return currentForm > pointsPerGame ? "↑" : "↓";
  };

  if (!teams || !fixtures) {
    return (
      <div className="h-full flex flex-col bg-card rounded-lg p-6 shadow-lg border border-border">
        <h3 className="text-lg font-bold bg-gradient-to-r from-primary to-primary/80 text-transparent bg-clip-text">
          Alternative Transfer Options
        </h3>
        <div className="flex-grow flex items-center justify-center">
          <p className="text-muted-foreground">Loading transfer options...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-card rounded-lg p-6 shadow-lg border border-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold bg-gradient-to-r from-primary to-primary/80 text-transparent bg-clip-text">
          Alternative Transfer Options
        </h3>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <InfoIcon className="h-5 w-5 text-primary/80 hover:text-primary" />
            </TooltipTrigger>
            <TooltipContent className="w-80 p-4">
              <p>Alternative transfer suggestions based on form, fixtures, and potential. Shows next 3 fixtures, form trends, and key statistics.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="flex-grow space-y-3">
        {currentOptions.map((player, idx) => {
          const formTrend = getFormTrend(player);
          const nextFixtures = getNextFixtures(player);
          
          return (
            <div
              key={player.id}
              className="bg-muted/50 rounded-lg p-4 hover:bg-muted/70 transition-all cursor-pointer border border-border/50 hover:border-primary/30"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-sm font-medium">
                    {currentPage * ITEMS_PER_PAGE + idx + 1}
                  </span>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-foreground">{player.web_name}</h3>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                              {teams[player.team - 1]?.short_name}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Team: {teams[player.team - 1]?.name}</p>
                            <p>Next Fixtures: {nextFixtures}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-muted-foreground text-sm">£{(player.now_cost / 10).toFixed(1)}m</span>
                      <span className="text-muted-foreground/60">•</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              <span className="text-muted-foreground text-sm">{Math.round(player.minutes / 90)} games</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Minutes Played: {player.minutes}</p>
                            <p>Games Completed: {Math.round(player.minutes / 90)}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <div className="flex items-center space-x-2">
                          <span className="text-primary font-semibold">Form: {player.form}</span>
                          {formTrend === "↑" ? (
                            <TrendingUp className="h-4 w-4 text-green-400" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-destructive" />
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Form Trend: {formTrend}</p>
                        <p>Points Per Game: {player.points_per_game}</p>
                        <p>Total Points: {player.total_points}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <div className="mt-1 flex items-center justify-end space-x-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <div className="flex items-center space-x-1">
                            <Target className="h-3 w-3 text-muted-foreground" />
                            <span className="text-muted-foreground text-sm">{player.selected_by_percent}% owned</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Selected by {player.selected_by_percent}% of managers</p>
                          <p>Price Change: {(player.cost_change_start / 10).toFixed(1)}m</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </div>

              <div className="mt-3 space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Next: {nextFixtures}</span>
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    player.status === "a" 
                      ? "bg-green-500/20 text-green-400"
                      : "bg-destructive/20 text-destructive"
                  }`}>
                    {player.status === "a" ? "Available" : "Doubtful"}
                  </span>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="w-full">
                      <div className="w-full space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Form</span>
                          <span>{player.form}/10</span>
                        </div>
                        <Progress value={parseFloat(player.form) * 10} className="h-1.5" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Form Score: {player.form}/10</p>
                      <p>Goals: {player.goals_scored}</p>
                      <p>Assists: {player.assists}</p>
                      <p>Clean Sheets: {player.clean_sheets}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="flex justify-between items-center mt-4 pt-4 border-t border-border/50">
        <Button
          variant="ghost"
          size="sm"
          onClick={prevPage}
          disabled={currentPage === 0}
          className="text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-50"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>
        <span className="text-muted-foreground">
          Page {currentPage + 1} of {totalPages}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={nextPage}
          disabled={currentPage === totalPages - 1}
          className="text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-50"
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
};

export default AlternativeTransfers;
