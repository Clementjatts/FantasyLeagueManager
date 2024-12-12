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
    <div className="relative bg-green-800 rounded-lg p-8">
      <div className="grid gap-8">
        {Object.entries(positions).map(([type, players]) => (
          <div 
            key={type}
            className="grid gap-4"
            style={{
              gridTemplateColumns: `repeat(${players.length}, minmax(0, 1fr))`
            }}
          >
            {players.map(player => (
              <PlayerCard
                key={player.id}
                player={player}
                isCaptain={player.id === captainId}
                isViceCaptain={player.id === viceCaptainId}
                onClick={() => onPlayerClick?.(player)}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
