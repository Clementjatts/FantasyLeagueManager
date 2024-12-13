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
    <div className="space-y-6">
      <div className="relative bg-gradient-to-b from-green-800 to-green-900 rounded-lg p-8 shadow-xl">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik01MCAwdjEwME0wIDUwaDEwMCIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiIGZpbGw9Im5vbmUiLz48L3N2Zz4=')] opacity-20"/>
        <div className="relative grid gap-12">
          {Object.entries(positions).map(([type, playersInPosition]) => (
            <div 
              key={type}
              className="grid gap-4 justify-items-center"
              style={{
                gridTemplateColumns: `repeat(${playersInPosition.length}, minmax(0, 1fr))`
              }}
            >
              {playersInPosition.map((player, index) => (
                <div key={player.id} className="w-full max-w-[200px] relative">
                  {players.indexOf(player) === -1 && ( // Check if it's a substitute
                    <div className="absolute -top-2 -left-2 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-base font-bold shadow-lg border-2 border-background">
                      {substitutes.indexOf(player) + 1}
                    </div>
                  )}
                  <PlayerCard
                    player={player}
                    isCaptain={player.id === captainId}
                    isViceCaptain={player.id === viceCaptainId}
                    onClick={players.includes(player) ? () => onPlayerClick?.(player) : () => onSubstituteClick?.(player)}
                    className={cn(
                      "transition-transform hover:scale-105",
                      !players.includes(player) && "opacity-80 hover:opacity-100"
                    )}
                    fixtures={fixtures}
                    teams={teams}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}