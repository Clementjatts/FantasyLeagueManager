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

  // Organize players by position type
  const gk = starters.filter(p => p.element_type === 1).sort((a, b) => a.position - b.position);
  const def = starters.filter(p => p.element_type === 2).sort((a, b) => a.position - b.position);
  const mid = starters.filter(p => p.element_type === 3).sort((a, b) => a.position - b.position);
  const fwd = starters.filter(p => p.element_type === 4).sort((a, b) => a.position - b.position);

  // Ensure we have valid formation (1-3-5-2, 1-4-4-2, 1-4-3-3, etc.)
  const positions = {
    1: gk.slice(0, 1),      // 1 goalkeeper
    2: def.slice(0, 5),     // 3-5 defenders
    3: mid.slice(0, 5),     // 3-5 midfielders
    4: fwd.slice(0, 3),     // 1-3 forwards
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
        <div className="space-y-2 mb-4">
          <div className="flex items-center space-x-2">
            <h3 className="text-xl font-bold">Substitutes</h3>
            <Separator className="flex-1" />
          </div>
          <p className="text-sm text-muted-foreground">Numbers indicate substitution order (1-4)</p>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {substitutes.map((player, index) => (
            <div key={player.id} className="relative">
              <div className="absolute -top-2 -left-2 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-base font-bold shadow-lg border-2 border-background">
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
