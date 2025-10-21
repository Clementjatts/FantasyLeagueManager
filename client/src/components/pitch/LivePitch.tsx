import { Player } from "../../types/fpl";
import { TintedGlassPlayerCard } from "../TintedGlassPlayerCard";
import { cn } from "@/lib/utils";
import { BasePitch } from "./BasePitch";
import { Badge } from "@/components/ui/badge";
import { Trophy, Users, Clock, Sparkles, TrendingUp, Activity, Target, Zap } from "lucide-react";

const positionMap: Record<number, string> = {
  1: "GK",
  2: "DEF",
  3: "MID",
  4: "FWD"
};

interface LivePitchProps {
  players: (Player & { is_captain?: boolean; is_vice_captain?: boolean; multiplier?: number })[];
  substitutes: (Player & { is_captain?: boolean; is_vice_captain?: boolean; multiplier?: number })[];
  captainId?: number;
  viceCaptainId?: number;
  teams?: any[];
  fixtures?: any[];
  showLiveStats?: boolean;
}

export function LivePitch({ 
  players, 
  substitutes,
  captainId, 
  viceCaptainId,
  teams = [],
  fixtures = [],
  showLiveStats = true
}: LivePitchProps) {
  const totalPoints = players.reduce((sum, p) => {
    const points = p.event_points || 0;
    const multiplier = p.multiplier || (p.is_captain ? 2 : 1);
    return sum + points * multiplier;
  }, 0);
  const allPlayersPlayed = [...players, ...substitutes].filter(p => p.minutes > 0).length;
  const allPlayersToPlay = players.length + substitutes.length - allPlayersPlayed;
  const averagePoints = totalPoints / players.length;
  const topPerformer = [...players].sort((a, b) => (b.event_points || 0) - (a.event_points || 0))[0];
  const playedPercentage = (allPlayersPlayed / (players.length + substitutes.length)) * 100;

  return (
    <div className="space-y-6">
      {/* Enhanced Stats Overview */}
      <div className="relative overflow-hidden rounded-2xl glass-card border-primary/20 shadow-colorhunt">
        {/* Ambient background effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-teal/5" />
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        
        {/* Glowing orbs */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-teal/10 rounded-full blur-3xl" />
        
        {/* Content Grid */}
        <div className="relative grid grid-cols-2 md:grid-cols-4 divide-x divide-primary/20 bg-gradient-to-br from-white/90 via-white/80 to-white/70 backdrop-blur-xl rounded-lg border border-primary/20 shadow-glass-card">
          {/* Total Points */}
          <div className="p-4 group relative overflow-hidden hover:bg-primary/5 transition-colors">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative space-y-2">
              <div className="flex items-center gap-2 text-dark-navy/80">
                <Trophy className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Total Points</span>
              </div>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-bold colorhunt-gradient bg-clip-text text-transparent">
                  {totalPoints}
                </div>
                <div className="text-sm text-dark-navy/60">pts</div>
              </div>
              <div className="h-1 w-full bg-primary/10 rounded-full overflow-hidden">
                <div 
                  className="h-full colorhunt-gradient transition-all duration-500"
                  style={{ width: `${(totalPoints / (averagePoints * 2)) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Average Points */}
          <div className="p-4 group relative overflow-hidden hover:bg-teal/5 transition-colors">
            <div className="absolute inset-0 bg-gradient-to-br from-teal/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative space-y-2">
              <div className="flex items-center gap-2 text-dark-navy/80">
                <Activity className="w-4 h-4 text-teal" />
                <span className="text-sm font-medium">Average</span>
              </div>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-bold text-teal">
                  {averagePoints.toFixed(1)}
                </div>
                <div className="text-sm text-dark-navy/60">pts/player</div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Target className="w-3 h-3 text-teal" />
                <span className="text-dark-navy/60">Target: {(averagePoints * 1.2).toFixed(1)}</span>
              </div>
            </div>
          </div>

          {/* Players Status */}
          <div className="p-4 group relative overflow-hidden hover:bg-medium-blue/5 transition-colors">
            <div className="absolute inset-0 bg-gradient-to-br from-medium-blue/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative space-y-2">
              <div className="flex items-center gap-2 text-dark-navy/80">
                <Users className="w-4 h-4 text-medium-blue" />
                <span className="text-sm font-medium">Players Status</span>
              </div>
              <div className="flex items-baseline gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-teal" />
                    <span className="text-lg font-semibold text-dark-navy">{allPlayersPlayed}</span>
                  </div>
                  <div className="text-xs text-dark-navy/60">Played</div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-lg font-semibold text-dark-navy">{allPlayersToPlay}</span>
                  </div>
                  <div className="text-xs text-dark-navy/60">To Play</div>
                </div>
              </div>
              <div className="h-1.5 w-full bg-medium-blue/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-teal to-primary transition-all duration-500"
                  style={{ width: `${playedPercentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Top Performer */}
          <div className="p-4 group relative overflow-hidden hover:bg-primary/5 transition-colors">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative space-y-2">
              <div className="flex items-center gap-2 text-dark-navy/80">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Top Performer</span>
              </div>
              <div className="space-y-1">
                <div className="text-xl font-bold text-dark-navy truncate">
                  {topPerformer?.web_name}
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="outline" 
                    className="bg-primary/10 hover:bg-primary/20 transition-colors border-primary/30 text-primary"
                  >
                    {positionMap[topPerformer?.element_type || 1]}
                  </Badge>
                  <span className="text-lg font-semibold text-primary">
                    {topPerformer?.event_points || 0} pts
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <BasePitch
        players={players}
        substitutes={substitutes}
        renderPlayer={(player: Player & { is_captain?: boolean; is_vice_captain?: boolean; multiplier?: number }, isSubstitute: boolean) => {
          const teamInfo = teams?.find(t => t.id === player.team) || { short_name: 'UNK', name: 'Unknown' };
          return (
            <div className="relative w-[180px]">
              <TintedGlassPlayerCard
                player={{
                  ...player,
                  position: player.position || 1
                }}
                team={teamInfo}
                className={cn(
                  "w-[180px] h-[150px]",
                  "transition-all duration-300",
                  isSubstitute && "opacity-80 hover:opacity-100"
                )}
                teams={teams}
                fixtures={fixtures}
                isCaptain={player.id === captainId}
                isViceCaptain={player.id === viceCaptainId}
                showGameweekPoints={true}
              />
            </div>
          );
        }}
      />
    </div>
  );
}
