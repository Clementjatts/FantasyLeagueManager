import { Player } from "../types/fpl";
import { PlayerCard } from "./PlayerCard";
import { cn } from "@/lib/utils";
import { TeamPitch } from "./TeamPitch";

interface DreamTeamPitchProps {
  players: Player[];
  substitutes: Player[];
  captainId?: number;
  viceCaptainId?: number;
  fixtures?: any[];
  teams?: any[];
  showOptimalReasons?: boolean;
}

export function DreamTeamPitch({ 
  players, 
  substitutes,
  captainId, 
  viceCaptainId,
  fixtures = [],
  teams = [],
  showOptimalReasons = false
}: DreamTeamPitchProps) {
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
          renderPlayerCard={(player: Player, isSubstitute: boolean): React.ReactNode => (
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
      </div>
    </div>
  );
}
