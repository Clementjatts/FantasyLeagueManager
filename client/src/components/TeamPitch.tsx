import { Player } from "../types/fpl";
import { PlayerCard } from "./PlayerCard";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

interface TeamPitchProps {
  players: Player[];
  captainId?: number;
  viceCaptainId?: number;
  onPlayerClick?: (player: Player) => void;
  onSubstituteClick?: (player: Player) => void;
}

export function TeamPitch({ 
  players, 
  captainId, 
  viceCaptainId, 
  onPlayerClick,
  onSubstituteClick 
}: TeamPitchProps) {
  // Split players into starting 11 and substitutes
  const starters = players.filter(p => p.position <= 11);
  const substitutes = players.filter(p => p.position > 11);

  const positions = {
    1: starters.filter(p => p.element_type === 1), // GK
    2: starters.filter(p => p.element_type === 2), // DEF
    3: starters.filter(p => p.element_type === 3), // MID
    4: starters.filter(p => p.element_type === 4), // FWD
  };

  return (
    <div className="space-y-6">
      <div className="relative bg-gradient-to-b from-green-800 to-green-900 rounded-lg p-8 shadow-xl">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik01MCAwdjEwME0wIDUwaDEwMCIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiIGZpbGw9Im5vbmUiLz48L3N2Zz4=')] opacity-20"/>
        <div className="relative grid gap-12">
          {Object.entries(positions).map(([type, players]) => (
            <div 
              key={type}
              className="grid gap-4 justify-items-center"
              style={{
                gridTemplateColumns: `repeat(${players.length}, minmax(0, 1fr))`
              }}
            >
              {players.map(player => (
                <div key={player.id} className="w-full max-w-[200px]">
                  <PlayerCard
                    player={player}
                    isCaptain={player.id === captainId}
                    isViceCaptain={player.id === viceCaptainId}
                    onClick={() => onPlayerClick?.(player)}
                    className="transition-transform hover:scale-105"
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center space-x-2 mb-4">
          <h3 className="text-lg font-semibold">Substitutes</h3>
          <Separator className="flex-1" />
        </div>
        <div className="grid grid-cols-4 gap-4">
          {substitutes.map((player, index) => (
            <div key={player.id} className="relative">
              <div className="absolute -top-3 -left-3 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                {index + 1}
              </div>
              <PlayerCard
                player={player}
                isCaptain={player.id === captainId}
                isViceCaptain={player.id === viceCaptainId}
                onClick={() => onSubstituteClick?.(player)}
                className="transition-transform hover:scale-105"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
