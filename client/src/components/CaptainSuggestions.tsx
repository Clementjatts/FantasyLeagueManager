import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Crown,
  Star,
  TrendingUp,
  Target,
  Shield,
  Zap,
  ChevronRight,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { getNextFixtures } from "@/lib/fpl-utils";

interface CaptainSuggestionsProps {
  allPlayers: any[];
  fixtures: any[];
  teams: any[];
  onSelectCaptain: (playerId: number) => void;
  currentCaptainId: number | null;
  currentViceCaptainId: number | null;
}

export default function CaptainSuggestions({
  allPlayers,
  fixtures,
  teams,
  onSelectCaptain,
  currentCaptainId,
  currentViceCaptainId,
}: CaptainSuggestionsProps) {
  const suggestions = React.useMemo(() => {
    return allPlayers
      .filter(player => {
        const form = parseFloat(player.form || '0');
        const minutes = player.minutes || 0;
        const isAvailable = player.chance_of_playing_next_round !== 0;
        const hasPlayingTime = minutes > 450; // At least 5 full matches
        return form >= 4 && isAvailable && hasPlayingTime;
      })
      .map(player => {
        const nextFixtures = getNextFixtures(player.team, fixtures)
          .map(fixture => ({
            opponent: teams.find(t => 
              t.id === (fixture.team_h === player.team ? fixture.team_a : fixture.team_h)
            )?.short_name || '',
            difficulty: fixture.team_h === player.team ? fixture.team_h_difficulty : fixture.team_a_difficulty,
            isHome: fixture.team_h === player.team
          }));

        const form = parseFloat(player.form || '0');
        const minutes = player.minutes || 0;
        const totalPoints = player.total_points || 0;
        const pointsPerGame = totalPoints / (minutes / 90);
        const homeAdvantage = nextFixtures[0]?.isHome ? 1.1 : 1.0;
        const bonusPoints = player.bonus || 0;
        const bonusPerGame = bonusPoints / (minutes / 90);
        
        // Calculate fixture difficulty impact
        const fixtureDifficultyMultiplier = 
          nextFixtures[0]?.difficulty <= 2 ? 1.3 :
          nextFixtures[0]?.difficulty === 3 ? 1.0 :
          nextFixtures[0]?.difficulty === 4 ? 0.8 :
          0.6;

        // Position-based multiplier
        const positionMultiplier = 
          player.element_type === 1 ? 0.8 :  // GKP
          player.element_type === 2 ? 0.9 :  // DEF
          player.element_type === 3 ? 1.1 :  // MID
          1.2;                               // FWD

        // Calculate expected points considering all factors
        const expectedPoints = (
          (form * 0.3) +              // 30% weight to current form
          (pointsPerGame * 0.3) +     // 30% weight to points per game
          (bonusPerGame * 0.2)        // 20% weight to bonus points tendency
        ) * fixtureDifficultyMultiplier * positionMultiplier * homeAdvantage;

        return {
          id: player.id,
          name: player.web_name,
          position: ['GKP', 'DEF', 'MID', 'FWD'][player.element_type - 1],
          form,
          expectedPoints,
          fixtures: nextFixtures,
          pointsPerGame: pointsPerGame.toFixed(1),
          stats: {
            goals: player.goals_scored || 0,
            assists: player.assists || 0,
            cleanSheets: player.clean_sheets || 0,
            bonus: bonusPoints,
            minutes,
          }
        };
      })
      .sort((a, b) => b.expectedPoints - a.expectedPoints)
      .slice(0, 5);
  }, [allPlayers, fixtures, teams]);

  return (
    <Card className="border-yellow-200 bg-gradient-to-br from-yellow-50 to-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-yellow-500" />
          Captain Picks
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          {suggestions.map((player, index) => (
            <div key={player.id} className="group relative">
              <div 
                className={cn(
                  "flex flex-col p-4 rounded-lg bg-white shadow-sm hover:shadow-md transition-all border",
                  player.id === currentCaptainId ? "border-yellow-300 bg-yellow-50/50" : 
                  player.id === currentViceCaptainId ? "border-yellow-200 bg-yellow-50/30" :
                  "border-yellow-100"
                )}
              >
                <div className="flex items-center gap-3 mb-3">
                  {index === 0 ? (
                    <Crown className="h-4 w-4 text-yellow-500" />
                  ) : (
                    <Star className="h-4 w-4 text-yellow-500" />
                  )}
                  <div>
                    <p className="font-medium">{player.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {player.position} • Form: {player.form} • PPG: {player.pointsPerGame}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {player.stats.goals > 0 && (
                      <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                        <Target className="h-3 w-3 mr-1" />
                        {player.stats.goals} Goals
                      </Badge>
                    )}
                    {player.stats.assists > 0 && (
                      <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                        <Zap className="h-3 w-3 mr-1" />
                        {player.stats.assists} Assists
                      </Badge>
                    )}
                    {player.stats.cleanSheets > 0 && (
                      <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-purple-200">
                        <Shield className="h-3 w-3 mr-1" />
                        {player.stats.cleanSheets} CS
                      </Badge>
                    )}
                    {player.stats.bonus > 0 && (
                      <Badge variant="secondary" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                        <Star className="h-3 w-3 mr-1" />
                        {player.stats.bonus} Bonus
                      </Badge>
                    )}
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    <p className="font-medium mb-1">Next Fixtures:</p>
                    <div className="flex gap-1">
                      {player.fixtures.map((fixture, idx) => (
                        <Badge 
                          key={idx}
                          variant={fixture.difficulty <= 2 ? "success" : fixture.difficulty >= 4 ? "destructive" : "secondary"}
                          className="h-5"
                        >
                          {fixture.opponent}
                          {fixture.isHome ? " (H)" : " (A)"}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="mt-3 flex items-center justify-between">
                  <Progress value={player.form * 10} className="flex-1 mr-3" />
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "cursor-pointer",
                      player.id === currentCaptainId 
                        ? "bg-yellow-100 text-yellow-700 border-yellow-300" 
                        : "hover:bg-yellow-50"
                    )}
                    onClick={() => onSelectCaptain(player.id)}
                  >
                    {player.id === currentCaptainId ? "Captain" : "Set Captain"}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
