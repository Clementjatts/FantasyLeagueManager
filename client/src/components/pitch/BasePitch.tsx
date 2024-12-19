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
  const playersList = players || [];
  const substitutesList = substitutes || [];
  
  const positions = {
    1: playersList.filter(p => p.element_type === 1),  // GK
    2: playersList.filter(p => p.element_type === 2),  // DEF
    3: playersList.filter(p => p.element_type === 3),  // MID
    4: playersList.filter(p => p.element_type === 4),  // FWD
  };

  return (
    <div className={cn(
      "relative w-full rounded-xl overflow-hidden shadow-2xl",
      "bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))]",
      "from-green-900 via-green-950 to-green-900",
      className
    )}>
      {/* Pitch Pattern */}
      <div className="absolute inset-0">
        {/* Vertical lines */}
        <div className="absolute inset-0 flex justify-between px-[5%]">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-px h-full bg-white/10" />
          ))}
        </div>
        {/* Horizontal lines */}
        <div className="absolute inset-0 flex flex-col justify-between py-[5%]">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-full h-px bg-white/10" />
          ))}
        </div>
        {/* Center circle */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="w-32 h-32 rounded-full border border-white/10" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white/20" />
        </div>
        {/* Goal areas */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-16 border border-white/10" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-16 border border-white/10" />
      </div>

      {/* Content */}
      <div className="relative p-6 md:p-8 space-y-8">
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

        {/* Separator with enhanced styling */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent h-px" />
          <div className="relative flex justify-center">
            <span className="px-4 py-1 text-sm text-white/90 bg-green-950 rounded-full border border-white/10 shadow-lg backdrop-blur-sm">
              Substitutes
            </span>
          </div>
        </div>

        {/* Substitutes Section with enhanced layout */}
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
