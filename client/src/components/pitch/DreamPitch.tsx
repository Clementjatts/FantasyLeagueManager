import { Player } from "../../types/fpl";
import { PlayerCard } from "../PlayerCard";
import { cn } from "@/lib/utils";
import { BasePitch } from "./BasePitch";

interface DreamPitchProps {
  players: Player[];
  substitutes: Player[];
  captainId?: number;
  viceCaptainId?: number;
  fixtures?: any[];
  teams?: any[];
  showOptimalReasons?: boolean;
}

export function DreamPitch({ 
  players, 
  substitutes,
  captainId, 
  viceCaptainId,
  fixtures = [],
  teams = [],
  showOptimalReasons = false
}: DreamPitchProps) {
  return (
    <BasePitch
      players={players}
      substitutes={substitutes}
      renderPlayer={(player: Player, isSubstitute: boolean) => (
        <div className="relative pt-2">
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
            displayContext="dream"
          />
          {showOptimalReasons && player.optimal_reason && !isSubstitute && (
            <div className="absolute -bottom-6 left-0 right-0 text-xs text-center text-primary bg-background/90 p-1 rounded-md shadow-sm">
              {player.optimal_reason}
            </div>
          )}
        </div>
      )}
    />
  );
}
