import { Player } from "../types/fpl";
import { PlayerCard } from "./PlayerCard";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

interface TeamPitchProps {
  players: Player[];
  substitutes: Player[];
  captainId?: number;
  viceCaptainId?: number;
  onPlayerClick?: (player: Player) => void;
  onSubstituteClick?: (player: Player) => void;
  fixtures?: any[];
  teams?: any[];
  showOptimalReasons?: boolean;
}

export function TeamPitch({ 
  players, 
  substitutes,
  captainId, 
  viceCaptainId, 
  onPlayerClick,
  onSubstituteClick,
  fixtures = [],
  teams = [],
  showOptimalReasons = false
}: TeamPitchProps) {
  // Ensure both arrays are defined before combining
  const playersList = players || [];
  const substitutesList = substitutes || [];
  
  // Get formation from players list (e.g., "4-4-2")
  const getFormation = (players: Player[]) => {
    const def = players.filter(p => p.element_type === 2).length;
    const mid = players.filter(p => p.element_type === 3).length;
    const fwd = players.filter(p => p.element_type === 4).length;
    return `${def}-${mid}-${fwd}`;
  };

  const formation = getFormation(playersList);
  
  // Create position groups with formation-based ordering
  const positions = {
    1: playersList.filter(p => p.element_type === 1),  // GK
    2: playersList.filter(p => p.element_type === 2),  // DEF
    3: playersList.filter(p => p.element_type === 3),  // MID
    4: playersList.filter(p => p.element_type === 4),  // FWD
  };

  return (
    <div className="relative bg-gradient-to-b from-green-800 to-green-900 rounded-lg p-8 shadow-xl">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik01MCAwdjEwME0wIDUwaDEwMCIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiIGZpbGw9Im5vbmUiLz48L3N2Zz4=')] opacity-20"/>
      <div className="space-y-6">
        {/* Starting XI */}
        <div className="relative grid gap-12">
          {Object.entries(positions).map(([type, playersInPosition]) => (
            <div 
              key={type}
              className="grid gap-4 justify-items-center"
              style={{
                gridTemplateColumns: `repeat(${playersInPosition.filter(p => players.includes(p)).length}, minmax(0, 1fr))`
              }}
            >
              {playersInPosition
                .filter(p => players.includes(p))
                .map((player) => (
                  <div key={player.id} className="w-full max-w-[200px] flex flex-col items-center">
                    <div className="relative w-full flex justify-center pt-4">
                      <div className="relative">
                        <PlayerCard
                          player={player}
                          onClick={() => onPlayerClick?.(player)}
                          className="transition-transform hover:scale-105 text-center"
                          fixtures={fixtures}
                          teams={teams}
                          isCaptain={player.id === captainId}
                          isViceCaptain={player.id === viceCaptainId}
                        />
                        {showOptimalReasons && player.optimal_reason && (
                          <div className="absolute -bottom-6 left-0 right-0 text-xs text-center text-primary bg-background/90 p-1 rounded-md shadow-sm">
                            {player.optimal_reason}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          ))}
        </div>

        {/* Separator with label */}
        <div className="relative">
          <Separator className="my-6 bg-white/20" />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-2 text-white/80 bg-green-900 text-sm">
            Substitutes
          </span>
        </div>

        {/* Substitutes Section */}
        <div className="grid grid-cols-4 gap-4">
          {substitutes.map((player) => (
            <div key={player.id} className="flex flex-col items-center">
              <div className="relative w-full flex justify-center pt-4">
                <PlayerCard
                  player={player}
                  onClick={() => onSubstituteClick?.(player)}
                  className="transition-transform hover:scale-105 opacity-80 hover:opacity-100 text-center"
                  fixtures={fixtures}
                  teams={teams}
                  isCaptain={player.id === captainId}
                  isViceCaptain={player.id === viceCaptainId}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
