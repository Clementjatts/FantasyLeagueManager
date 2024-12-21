import { Player } from "../../types/fpl";
import { PlayerCard } from "../PlayerCard";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ArrowUpIcon, ArrowDownIcon, TrendingUpIcon } from "lucide-react";
import { BasePitch } from "./BasePitch";

interface TopManagersPitchProps {
  players: Player[];
  substitutes: Player[];
  fixtures?: any[];
  teams?: any[];
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

const getPlayerIndicators = (player: Player) => {
  const priceChange = player.cost_change_event;
  const form = player.form;
  const isPositive = priceChange > 0;
  
  return (
    <div className="absolute -top-1 right-2 z-10 flex gap-1">
      {/* Form Rating */}
      {form && parseFloat(form) > 0 && (
        <div className="relative">
          {/* Glow effect */}
          <div className={cn(
            "absolute inset-0 rounded-full blur-sm",
            getFormGlowColor(form)
          )} />
          
          {/* Badge */}
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
      
      {/* Price Change */}
      {priceChange !== 0 && (
        <div className="relative">
          {/* Glow effect */}
          <div className={cn(
            "absolute inset-0 rounded-full blur-sm",
            isPositive ? "bg-green-500/30" : "bg-red-500/30"
          )} />
          
          {/* Badge */}
          <Badge 
            className={cn(
              "relative px-2 py-0.5 font-medium border-none shadow-lg",
              "bg-gradient-to-br backdrop-blur-sm text-white",
              isPositive 
                ? "from-green-500/90 to-green-600/90" 
                : "from-red-500/90 to-red-600/90"
            )}
          >
            <span className="flex items-center gap-0.5">
              {isPositive ? <ArrowUpIcon className="w-3 h-3" /> : <ArrowDownIcon className="w-3 h-3" />}
              <span className="text-xs font-bold">
                £{Math.abs(priceChange / 10).toFixed(1)}m
              </span>
            </span>
          </Badge>
        </div>
      )}
    </div>
  );
};

export function TopManagersPitch({ 
  players, 
  substitutes,
  fixtures,
  teams
}: TopManagersPitchProps) {
  return (
    <BasePitch
      players={players}
      substitutes={substitutes}
      renderPlayer={(player) => (
        <PlayerCard
          key={player.id}
          player={player}
          fixtures={fixtures}
          teams={teams}
          className="w-[160px] h-[120px]"
          displayContext="transfer"
          showTransferInfo={false}
          showLiveStats={false}
          showOptimalStats={false}
        >
          {getPlayerIndicators(player)}
        </PlayerCard>
      )}
    />
  );
}
