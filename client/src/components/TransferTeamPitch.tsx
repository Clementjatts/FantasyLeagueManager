import { Player } from "../types/fpl";
import { PlayerCard } from "./PlayerCard";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

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
        {/* Starting XI with Transfer Focus */}
        <div className="relative grid gap-8">
          {Object.entries(positions).map(([type, playersInPosition]) => (
            <div 
              key={type}
              className="grid gap-x-4 md:gap-x-8 lg:gap-x-12 justify-items-center mx-auto w-full"
              style={{
                gridTemplateColumns: `repeat(${playersInPosition.length}, minmax(120px, 1fr))`,
                justifyContent: 'space-between'
              }}
            >
              {playersInPosition.map((player) => (
                <div key={player.id} className="flex flex-col items-center">
                  <div className="relative w-[120px]">
                    <PlayerCard
                      player={player}
                      onClick={() => onPlayerClick?.(player)}
                      className="transition-transform hover:scale-105 text-center w-full cursor-pointer"
                      fixtures={fixtures}
                      teams={teams}
                      isCaptain={player.id === captainId}
                      isViceCaptain={player.id === viceCaptainId}
                      showTransferInfo={true}
                    />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="relative">
          <Separator className="my-6 bg-white/20" />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-2 text-white/80 bg-green-900 text-sm">
            Substitutes
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 w-full">
          {substitutesList.map((player) => (
            <div key={player.id} className="flex flex-col items-center">
              <div className="relative w-[120px]">
                <PlayerCard
                  player={player}
                  onClick={() => onSubstituteClick?.(player)}
                  className="transition-transform hover:scale-105 opacity-80 hover:opacity-100 text-center cursor-pointer"
                  fixtures={fixtures}
                  teams={teams}
                  isCaptain={player.id === captainId}
                  isViceCaptain={player.id === viceCaptainId}
                  showTransferInfo={true}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
