import { Player } from "../../types/fpl";
import { PlayerCard } from "../PlayerCard";
import { cn } from "@/lib/utils";
import { BasePitch } from "./BasePitch";

interface LivePitchProps {
  players: Player[];
  substitutes: Player[];
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
  showLiveStats
}: LivePitchProps) {
  const totalPoints = players.reduce((sum, p) => sum + (p.event_points || 0), 0);
  const playersPlayed = players.filter(p => p.minutes > 0).length;
  const playersToPlay = players.length - playersPlayed;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-background/80 backdrop-blur-sm rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-primary">{totalPoints}</div>
          <div className="text-sm text-muted-foreground">Total Points</div>
        </div>
        <div className="bg-background/80 backdrop-blur-sm rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-500">{playersPlayed}</div>
          <div className="text-sm text-muted-foreground">Players Played</div>
        </div>
        <div className="bg-background/80 backdrop-blur-sm rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-yellow-500">{playersToPlay}</div>
          <div className="text-sm text-muted-foreground">Yet to Play</div>
        </div>
      </div>

      <BasePitch
        players={players}
        substitutes={substitutes}
        renderPlayer={(player: Player, isSubstitute: boolean) => (
          <PlayerCard
            player={player}
            className={cn(
              "transition-transform hover:scale-105 text-center w-full",
              isSubstitute && "opacity-80 hover:opacity-100"
            )}
            teams={teams}
            fixtures={fixtures}
            isCaptain={player.id === captainId}
            isViceCaptain={player.id === viceCaptainId}
            showLiveStats={showLiveStats}
          />
        )}
      />
    </div>
  );
}
