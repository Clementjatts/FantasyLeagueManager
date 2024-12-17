import { Player } from "../../types/fpl";
import { PlayerCard } from "../PlayerCard";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";
import { BasePitch } from "./BasePitch";

interface TransferPitchProps {
  players: Player[];
  substitutes: Player[];
  captainId?: number;
  viceCaptainId?: number;
  onPlayerClick?: (player: Player) => void;
  onSubstituteClick?: (player: Player) => void;
  fixtures?: any[];
  teams?: any[];
}

const getPriceChangeIndicator = (player: Player) => {
  const change = player.cost_change_event;
  if (!change) return null;
  
  return (
    <Badge 
      variant={change > 0 ? "success" : "destructive"} 
      className="absolute -top-2 right-0"
    >
      {change > 0 ? <ArrowUpIcon className="w-3 h-3" /> : <ArrowDownIcon className="w-3 h-3" />}
      £{Math.abs(change / 10).toFixed(1)}m
    </Badge>
  );
};

export function TransferPitch({ 
  players, 
  substitutes,
  captainId, 
  viceCaptainId,
  onPlayerClick,
  onSubstituteClick,
  fixtures = [],
  teams = []
}: TransferPitchProps) {
  return (
    <BasePitch
      players={players}
      substitutes={substitutes}
      renderPlayer={(player: Player, isSubstitute: boolean) => (
        <div className="relative pt-2">
          {!isSubstitute && getPriceChangeIndicator(player)}
          <PlayerCard
            player={player}
            onClick={() => isSubstitute ? onSubstituteClick?.(player) : onPlayerClick?.(player)}
            className={cn(
              "transition-transform hover:scale-105 text-center w-full cursor-pointer",
              isSubstitute && "opacity-80 hover:opacity-100",
              player.cost_change_event > 0 && "ring-2 ring-green-500/20",
              player.cost_change_event < 0 && "ring-2 ring-red-500/20"
            )}
            teams={teams}
            fixtures={fixtures}
            isCaptain={player.id === captainId}
            isViceCaptain={player.id === viceCaptainId}
            showTransferInfo={true}
          />
        </div>
      )}
    />
  );
}
