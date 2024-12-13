import { Player } from "../types/fpl";
import { PlayerCard } from "./PlayerCard";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

interface TeamPitchProps {
  players: Player[];
  substitutes: Player[]; // Added substitutes prop
  captainId?: number;
  viceCaptainId?: number;
  onPlayerClick?: (player: Player) => void;
  onSubstituteClick?: (player: Player) => void;
  fixtures?: any[];
  teams?: any[];
}

export function TeamPitch({ 
  players, 
  substitutes,
  captainId, 
  viceCaptainId, 
  onPlayerClick,
  onSubstituteClick,
  fixtures = [],
  teams = []
}: TeamPitchProps) {
  // Ensure both arrays are defined before combining
  const playersList = players || [];
  const substitutesList = substitutes || [];
  
  // Create position groups with both players and substitutes
  const positions = {
    1: [...playersList, ...substitutesList].filter(p => p.element_type === 1),  // GK
    2: [...playersList, ...substitutesList].filter(p => p.element_type === 2),  // DEF
    3: [...playersList, ...substitutesList].filter(p => p.element_type === 3),  // MID
    4: [...playersList, ...substitutesList].filter(p => p.element_type === 4),  // FWD
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
                  <div key={player.id} className="w-full max-w-[200px] relative">
                    {player.id === captainId && (
                      <div className="absolute -top-3 -right-3 w-8 h-8 bg-yellow-500 text-background rounded-full flex items-center justify-center text-sm font-bold shadow-lg border-2 border-background z-10">
                        C
                      </div>
                    )}
                    {player.id === viceCaptainId && (
                      <div className="absolute -top-3 -right-3 w-8 h-8 bg-blue-500 text-background rounded-full flex items-center justify-center text-sm font-bold shadow-lg border-2 border-background z-10">
                        V
                      </div>
                    )}
                    <PlayerCard
                      player={player}
                      isCaptain={player.id === captainId}
                      isViceCaptain={player.id === viceCaptainId}
                      onClick={() => onPlayerClick?.(player)}
                      className="transition-transform hover:scale-105"
                      fixtures={fixtures}
                      teams={teams}
                    />
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
          {substitutes.map((player, index) => (
            <div key={player.id} className="relative">
              <div className="absolute -top-2 -left-2 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-base font-bold shadow-lg border-2 border-background z-10">
                {index + 1}
              </div>
              {player.id === captainId && (
                <div className="absolute -top-3 -right-3 w-8 h-8 bg-yellow-500 text-background rounded-full flex items-center justify-center text-sm font-bold shadow-lg border-2 border-background z-10">
                  C
                </div>
              )}
              {player.id === viceCaptainId && (
                <div className="absolute -top-3 -right-3 w-8 h-8 bg-blue-500 text-background rounded-full flex items-center justify-center text-sm font-bold shadow-lg border-2 border-background z-10">
                  V
                </div>
              )}
              <PlayerCard
                player={player}
                onClick={() => onSubstituteClick?.(player)}
                className="transition-transform hover:scale-105 opacity-80 hover:opacity-100"
                fixtures={fixtures}
                teams={teams}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}