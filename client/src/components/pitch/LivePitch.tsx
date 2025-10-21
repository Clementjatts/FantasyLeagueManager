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
      <div className="relative overflow-hidden rounded-2xl bg-black/40 backdrop-blur-xl border border-white/5">
        {/* Ambient background effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5" />
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        
        {/* Glowing orbs */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
        
        {/* Content Grid */}
        <div className="relative grid grid-cols-2 md:grid-cols-4 divide-x divide-white/10 bg-black/75 backdrop-blur-xl rounded-lg border border-white/10 shadow-2xl">
          {/* Total Points */}
          <div className="p-4 group relative overflow-hidden hover:bg-white/5 transition-colors">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative space-y-2">
              <div className="flex items-center gap-2 text-white/80">
                <Trophy className="w-4 h-4" />
                <span className="text-sm font-medium">Total Points</span>
              </div>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-bold bg-gradient-to-br from-primary/90 to-primary bg-clip-text text-transparent">
                  {totalPoints}
                </div>
                <div className="text-sm text-white/40">pts</div>
              </div>
              <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary/50 to-primary transition-all duration-500"
                  style={{ width: `${(totalPoints / (averagePoints * 2)) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Average Points */}
          <div className="p-4 group relative overflow-hidden hover:bg-white/5 transition-colors">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative space-y-2">
              <div className="flex items-center gap-2 text-white/80">
                <Activity className="w-4 h-4" />
                <span className="text-sm font-medium">Average</span>
              </div>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-bold text-white">
                  {averagePoints.toFixed(1)}
                </div>
                <div className="text-sm text-white/40">pts/player</div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Target className="w-3 h-3 text-primary" />
                <span className="text-white/40">Target: {(averagePoints * 1.2).toFixed(1)}</span>
              </div>
            </div>
          </div>

          {/* Players Status */}
          <div className="p-4 group relative overflow-hidden hover:bg-white/5 transition-colors">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative space-y-2">
              <div className="flex items-center gap-2 text-white/80">
                <Users className="w-4 h-4" />
                <span className="text-sm font-medium">Players Status</span>
              </div>
              <div className="flex items-baseline gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-lg font-semibold text-white">{allPlayersPlayed}</span>
                  </div>
                  <div className="text-xs text-white/40">Played</div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-500" />
                    <span className="text-lg font-semibold text-white">{allPlayersToPlay}</span>
                  </div>
                  <div className="text-xs text-white/40">To Play</div>
                </div>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-500"
                  style={{ width: `${playedPercentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Top Performer */}
          <div className="p-4 group relative overflow-hidden hover:bg-white/5 transition-colors">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative space-y-2">
              <div className="flex items-center gap-2 text-white/80">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-medium">Top Performer</span>
              </div>
              <div className="space-y-1">
                <div className="text-xl font-bold text-white truncate">
                  {topPerformer?.web_name}
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="secondary" 
                    className="bg-primary/20 hover:bg-primary/30 transition-colors border-0 text-white"
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
