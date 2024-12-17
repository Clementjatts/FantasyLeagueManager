import { Player } from "../types/fpl";
import { PlayerCard } from "./PlayerCard";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";
import { TeamPitch } from "./TeamPitch";

interface TransferTeamPitchProps {
  players: Player[];
  substitutes: Player[];
  captainId?: number;
  viceCaptainId?: number;
  onPlayerClick?: (player: Player) => void;
  onSubstituteClick?: (player: Player) => void;
  fixtures?: any[];
  teams?: any[];
}

export function TransferTeamPitch({ 
  players, 
  substitutes,
  captainId, 
  viceCaptainId,
  onPlayerClick,
  onSubstituteClick,
  fixtures = [],
  teams = []
}: TransferTeamPitchProps) {
  // Calculate price changes and transfer metrics
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
  const playersList = players || [];
  const substitutesList = substitutes || [];
  
  const getFormation = (players: Player[]) => {
    const def = players.filter(p => p.element_type === 2).length;
    const mid = players.filter(p => p.element_type === 3).length;
    const fwd = players.filter(p => p.element_type === 4).length;
    return `${def}-${mid}-${fwd}`;
  };

  const formation = getFormation(playersList);
  
  const positions = {
    1: playersList.filter(p => p.element_type === 1),  // GK
    2: playersList.filter(p => p.element_type === 2),  // DEF
    3: playersList.filter(p => p.element_type === 3),  // MID
    4: playersList.filter(p => p.element_type === 4),  // FWD
  };

  return (
    <div className="relative w-full bg-gradient-to-b from-green-800 to-green-900 rounded-lg p-4 md:p-8 shadow-xl">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik01MCAwdjEwME0wIDUwaDEwMCIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiIGZpbGw9Im5vbmUiLz48L3N2Zz4=')] opacity-20"/>
      <div className="space-y-8">
        <TeamPitch
          players={players}
          substitutes={substitutes}
          captainId={captainId}
          viceCaptainId={viceCaptainId}
          onPlayerClick={onPlayerClick}
          onSubstituteClick={onSubstituteClick}
          renderPlayerCard={(player: Player, isSubstitute: boolean): React.ReactNode => (
            <div className="relative">
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
                fixtures={fixtures}
                teams={teams}
                isCaptain={player.id === captainId}
                isViceCaptain={player.id === viceCaptainId}
                showTransferInfo={true}
              />
            </div>
          )}
        />
      </div>
    </div>
  );
}
