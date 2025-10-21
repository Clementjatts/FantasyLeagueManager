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
  currentCaptainId: number | null;
  currentViceCaptainId: number | null;
}

export default function CaptainSuggestions({
  allPlayers,
  fixtures,
  teams,
  currentCaptainId,
  currentViceCaptainId,
}: CaptainSuggestionsProps) {
  const suggestions = React.useMemo(() => {
    return allPlayers
      .filter(player => {
        // Enhanced filtering criteria
        const chanceOfPlaying = player.chance_of_playing_next_round || 100;
        const minutes = player.minutes || 0;
        const epNext = parseFloat(player.ep_next || '0');
        
        return chanceOfPlaying > 50 &&           // Exclude major doubts
               minutes > 180 &&                  // At least 2 full matches
               epNext > 3.0;                     // Filter for players expected to score reasonably
      })
      .map(player => {
        // Get next 3 fixtures for better analysis
        const nextThreeFixtures = getNextFixtures(player.team, fixtures, 3)
          .map(fixture => ({
            opponent: teams.find(t => 
              t.id === (fixture.team_h === player.team ? fixture.team_a : fixture.team_h)
            )?.short_name || '',
            difficulty: fixture.team_h === player.team ? fixture.team_h_difficulty : fixture.team_a_difficulty,
            isHome: fixture.team_h === player.team
          }));

        // 1. Calculate Base Score (50% weight) - anchored by ep_next
        const baseScore = parseFloat(player.ep_next || '0') * 5;

        // 2. Calculate Form & Potential Score (50% weight)
        const form = parseFloat(player.form || '0');
        const ictIndex = parseFloat(player.ict_index || '0');
        const formAndPotentialScore = (form * 2.5) + (ictIndex * 0.25);

        // 3. Calculate Modifiers
        // Fixture Score - analyze next 3 fixtures
        const avgDifficulty = nextThreeFixtures.length > 0 
          ? nextThreeFixtures.reduce((acc, f) => acc + f.difficulty, 0) / nextThreeFixtures.length 
          : 3;
        const fixtureModifier = 1 + ((3 - avgDifficulty) * 0.1);

        // Explosiveness Score - reward players who deliver big hauls
        const dreamteamCount = player.dreamteam_count || 0;
        const bonusPoints = player.bonus || 0;
        const totalPoints = player.total_points || 1;
        const explosivenessModifier = 1 + (dreamteamCount * 0.05) + ((bonusPoints / totalPoints) * 0.5);

        // Risk Penalty - penalize players not guaranteed to start
        const riskModifier = (player.chance_of_playing_next_round || 100) / 100;

        // Combined modifier
        const finalModifier = fixtureModifier * explosivenessModifier * riskModifier;

        // 4. Final Haul Potential Score
        const haulPotential = (baseScore + formAndPotentialScore) * finalModifier;

        // 5. Generate Dynamic Reason
        let reason = `Strong pick with form of ${form} and ${player.ep_next} xP.`;
        if (avgDifficulty <= 2) reason += " Excellent upcoming fixtures.";
        if (explosivenessModifier > 1.2) reason += " High potential for a big score.";
        if (ictIndex > 100) reason += " High involvement in team's play.";
        if (dreamteamCount > 2) reason += " Consistent dream team performer.";

        return {
          id: player.id,
          name: player.web_name,
          position: ['GKP', 'DEF', 'MID', 'FWD'][player.element_type - 1],
          form,
          haulPotential,
          reason,
          fixtures: nextThreeFixtures,
          epNext: player.ep_next,
          ictIndex: ictIndex.toFixed(1),
          stats: {
            goals: player.goals_scored || 0,
            assists: player.assists || 0,
            cleanSheets: player.clean_sheets || 0,
            bonus: bonusPoints,
            minutes: player.minutes || 0,
            dreamteamCount,
            expectedGoals: player.expected_goals_per_90 || 0,
            expectedAssists: player.expected_assists_per_90 || 0,
          }
        };
      })
      .sort((a, b) => b.haulPotential - a.haulPotential)
      .slice(0, 3);
  }, [allPlayers, fixtures, teams]);

  return (
    <Card className="border-yellow-200/50 bg-gradient-to-br from-yellow-50/80 to-white/80 backdrop-blur-sm shadow-glass-glow">
      <CardContent className="pt-6">
        <div className="grid grid-cols-3 gap-4">
          {suggestions.map((player, index) => (
            <div key={player.id} className="group relative">
              <div 
                className={cn(
                  "flex flex-col p-4 rounded-lg bg-glass-bg backdrop-blur-sm shadow-glass hover:shadow-glass-glow transition-all border border-glass-border",
                  player.id === currentCaptainId ? "border-bright-amber/50 bg-bright-amber/10 shadow-aurora" : 
                  player.id === currentViceCaptainId ? "border-bright-amber/30 bg-bright-amber/5" :
                  "hover:border-bright-amber/20"
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
                      {player.position} • Form: {player.form} • xP: {player.epNext} • ICT: {player.ictIndex}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {/* Dynamic Reason - Fixed height for 2 lines */}
                  <div className="text-xs text-muted-foreground bg-slate-50 p-2 rounded border h-20 flex flex-col justify-center">
                    <p className="font-medium text-slate-700 mb-1">Why this pick:</p>
                    <p className="line-clamp-2 leading-relaxed">{player.reason}</p>
                  </div>

                  {/* Badges section - Fixed height for 2 lines */}
                  <div className="h-16 flex flex-wrap gap-2 content-start">
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
                    {player.stats.dreamteamCount > 0 && (
                      <Badge variant="success" className="bg-neon-green text-deep-slate">
                        <Crown className="h-3 w-3 mr-1" />
                        {player.stats.dreamteamCount} DT
                      </Badge>
                    )}
                    {player.stats.expectedGoals > 0 && (
                      <Badge variant="secondary" className="bg-orange-50 text-orange-700 border-orange-200">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        xG: {player.stats.expectedGoals.toFixed(1)}
                      </Badge>
                    )}
                    {player.stats.expectedAssists > 0 && (
                      <Badge variant="secondary" className="bg-cyan-50 text-cyan-700 border-cyan-200">
                        <Zap className="h-3 w-3 mr-1" />
                        xA: {player.stats.expectedAssists.toFixed(1)}
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
                  <div className="flex-1 mr-3">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Haul Potential</span>
                      <span>{player.haulPotential.toFixed(1)}</span>
                    </div>
                    <Progress value={Math.min(player.haulPotential * 2, 100)} className="h-2" />
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {player.id === currentCaptainId && (
                      <Badge 
                        variant="outline" 
                        className="bg-yellow-100 text-yellow-700 border-yellow-300"
                      >
                        Current Captain
                      </Badge>
                    )}
                    {player.id === currentViceCaptainId && (
                      <Badge 
                        variant="outline" 
                        className="bg-blue-100 text-blue-700 border-blue-300"
                      >
                        Vice Captain
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
