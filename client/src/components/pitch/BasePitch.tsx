import { Player } from "../../types/fpl";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

export interface BasePitchProps {
  players: Player[];
  substitutes: Player[];
  className?: string;
  renderPlayer: (player: Player, isSubstitute: boolean) => React.ReactNode;
}

export function BasePitch({ 
  players, 
  substitutes,
  className,
  renderPlayer
}: BasePitchProps) {
  // Ensure both arrays are defined before combining
  const playersList = players || [];
  const substitutesList = substitutes || [];
  
  // Create position groups
  const positions = {
    1: playersList.filter(p => p.element_type === 1),  // GK
    2: playersList.filter(p => p.element_type === 2),  // DEF
    3: playersList.filter(p => p.element_type === 3),  // MID
    4: playersList.filter(p => p.element_type === 4),  // FWD
  };

  return (
    <div className={cn(
      "relative w-full bg-gradient-to-b from-green-800 to-green-900 rounded-lg p-4 md:p-8 shadow-xl",
      className
    )}>
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik01MCAwdjEwME0wIDUwaDEwMCIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiIGZpbGw9Im5vbmUiLz48L3N2Zz4=')] opacity-20"/>
      <div className="space-y-8">
        {/* Starting XI */}
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
                    {renderPlayer(player, false)}
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 w-full">
          {substitutesList.map((player) => (
            <div key={player.id} className="flex flex-col items-center">
              <div className="relative w-[120px]">
                {renderPlayer(player, true)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
