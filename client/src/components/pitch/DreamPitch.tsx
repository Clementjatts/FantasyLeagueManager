import { Player } from "../../types/fpl";
import { TintedGlassPlayerCard } from "../TintedGlassPlayerCard";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { TrendingUpIcon, StarIcon, AlertCircle } from "lucide-react";
import { BasePitch } from "./BasePitch";

interface DreamPitchProps {
  players: Player[];
  substitutes: Player[];
  captainId?: number;
  viceCaptainId?: number;
  fixtures?: any[];
  teams?: any[];
  showOptimalReasons?: boolean;
}

const getFormColor = (form: string) => {
  const formValue = parseFloat(form || "0");
  if (formValue >= 6) return "from-green-500/90 to-green-600/90";
  if (formValue >= 4) return "from-yellow-500/90 to-yellow-600/90";
  return "from-red-500/90 to-red-600/90";
};

const getFormGlowColor = (form: string) => {
  const formValue = parseFloat(form || "0");
  if (formValue >= 6) return "bg-green-500/30";
  if (formValue >= 4) return "bg-yellow-500/30";
  return "bg-red-500/30";
};

const getAvailabilityStatus = (player: Player) => {
  const nextRoundChance = player.chance_of_playing_next_round;
  if (nextRoundChance === 0) return "Out";
  if (nextRoundChance && nextRoundChance < 100) return `${nextRoundChance}%`;
  if (player.status === 'u' || player.status === 'i' || player.status === 's') return "Out";
  if (player.news && player.news.toLowerCase().includes('suspended')) return "Suspended";
  return null;
};

const getPlayerIndicators = (player: Player, showOptimal: boolean) => {
  const form = player.form;
  const availabilityStatus = getAvailabilityStatus(player);

  return (
    <div className="absolute -top-1 right-2 z-10 flex gap-1">
      {/* Availability Status */}
      {availabilityStatus && (
        <div className="relative">
          <div className="absolute inset-0 rounded-full blur-sm bg-red-500/30" />
          <Badge 
            className="relative px-2 py-0.5 font-medium border-none shadow-lg bg-gradient-to-br from-red-500/90 to-red-600/90 backdrop-blur-sm text-white"
          >
            <span className="flex items-center gap-0.5">
              <AlertCircle className="w-3 h-3" />
              <span className="text-xs font-bold">
                {availabilityStatus}
              </span>
            </span>
          </Badge>
        </div>
      )}

      {/* Form Rating */}
      {form && parseFloat(form) > 0 && (
        <div className="relative">
          <div className={cn(
            "absolute inset-0 rounded-full blur-sm",
            getFormGlowColor(form)
          )} />

          <Badge 
            className={cn(
              "relative px-2 py-0.5 font-medium border-none shadow-lg",
              "bg-gradient-to-br backdrop-blur-sm text-white",
              getFormColor(form)
            )}
          >
            <span className="flex items-center gap-0.5">
              <TrendingUpIcon className="w-3 h-3" />
              <span className="text-xs font-bold">
                {parseFloat(form).toFixed(1)}
              </span>
            </span>
          </Badge>
        </div>
      )}

      {/* Optimal Player Indicator */}
      {showOptimal && player.is_optimal && (
        <div className="relative">
          <div className="absolute inset-0 rounded-full blur-sm bg-primary/30" />

          <Badge 
            className={cn(
              "relative px-2 py-0.5 font-medium border-none shadow-lg",
              "bg-gradient-to-br from-primary/90 to-primary-foreground/90 backdrop-blur-sm text-white"
            )}
          >
            <span className="flex items-center gap-0.5">
              <StarIcon className="w-3 h-3" />
              <span className="text-xs font-bold">
                Best
              </span>
            </span>
          </Badge>
        </div>
      )}
    </div>
  );
};

export function DreamPitch({ 
  players, 
  substitutes,
  captainId, 
  viceCaptainId,
  fixtures = [],
  teams = [],
  showOptimalReasons = false
}: DreamPitchProps) {
  return (
    <BasePitch
      players={players}
      substitutes={substitutes}
      renderPlayer={(player: Player, isSubstitute: boolean) => {
        const team = teams?.find((t: any) => t.id === player.team);
        if (!team) return null;

        return (
          <div className="relative pt-2">
            {getPlayerIndicators(player, showOptimalReasons)}
            <TintedGlassPlayerCard
              player={player}
              team={team}
              fixtures={fixtures}
              teams={teams}
              isCaptain={player.id === captainId}
              isViceCaptain={player.id === viceCaptainId}
              isNewPlayer={!player.isUserPlayer} // Show as new if not a user's original player
              className={cn(
                "w-[160px] h-[140px]",
                "transition-transform hover:scale-105 text-center cursor-pointer",
                isSubstitute && "opacity-80 hover:opacity-100"
              )}
            />
            {showOptimalReasons && player.optimal_reason && !isSubstitute && (
              <div className="absolute -bottom-6 left-0 right-0 text-xs text-center text-primary bg-background/90 p-1 rounded-md shadow-sm">
                {player.optimal_reason}
              </div>
            )}
          </div>
        );
      }}
    />
  );
}