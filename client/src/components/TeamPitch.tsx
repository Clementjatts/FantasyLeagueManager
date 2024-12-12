import { Player } from "../types/fpl";
import { PlayerCard } from "./PlayerCard";

interface TeamPitchProps {
  players: Player[];
  captainId?: number;
  viceCaptainId?: number;
  onPlayerClick?: (player: Player) => void;
}

export function TeamPitch({ players, captainId, viceCaptainId, onPlayerClick }: TeamPitchProps) {
  const positions = {
    1: players.filter(p => p.element_type === 1), // GK
    2: players.filter(p => p.element_type === 2), // DEF
    3: players.filter(p => p.element_type === 3), // MID
    4: players.filter(p => p.element_type === 4), // FWD
  };

  return (
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
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
