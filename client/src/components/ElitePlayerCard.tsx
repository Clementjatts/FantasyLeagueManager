import { Player } from "../types/fpl";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  TrendingUpIcon, 
  TargetIcon, 
  CoinsIcon,
  CrownIcon,
  StarIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface ElitePlayerCardProps {
  player: Player & { 
    position: number; 
    eliteOwnership: number;
    captaincyCount?: number;
    viceCaptaincyCount?: number;
  };
  team: { short_name: string; name: string };
  fixtures?: any[];
  teams?: any[];
  isCaptain?: boolean;
  isViceCaptain?: boolean;
  className?: string;
}

const getFormColor = (form: string) => {
  const formValue = parseFloat(form || "0");
  if (formValue >= 6) return "text-green-400";
  if (formValue >= 4) return "text-yellow-400";
  return "text-red-400";
};

const getEliteOwnershipColor = (eliteOwnership: number) => {
  if (eliteOwnership >= 80) return "text-green-400";
  if (eliteOwnership >= 60) return "text-yellow-400";
  if (eliteOwnership >= 40) return "text-orange-400";
  return "text-red-400";
};

const getEliteOwnershipGlow = (eliteOwnership: number) => {
  if (eliteOwnership >= 80) return "shadow-green-500/50";
  if (eliteOwnership >= 60) return "shadow-yellow-500/50";
  if (eliteOwnership >= 40) return "shadow-orange-500/50";
  return "shadow-red-500/50";
};

export function ElitePlayerCard({ 
  player, 
  team, 
  fixtures = [], 
  teams = [],
  isCaptain = false,
  isViceCaptain = false,
  className 
}: ElitePlayerCardProps) {
  const eliteOwnership = player.eliteOwnership || 0;
  const form = parseFloat(player.form || "0");
  const epNext = parseFloat(player.ep_next || "0");
  const price = (player.now_cost / 10).toFixed(1);
  const [isOpen, setIsOpen] = useState(false);

  // Position-specific glow colors
  const positionGlowColors = {
    1: 'hsl(54 96% 48%)', // GK - Yellow
    2: 'hsl(204 96% 48%)', // DEF - Blue
    3: 'hsl(145 96% 48%)', // MID - Green
    4: 'hsl(5 96% 48%)', // FWD - Red
  };

  const glowColor = positionGlowColors[player.element_type as keyof typeof positionGlowColors];
  
  // Get next 3 fixtures
  const nextFixtures = fixtures
    .filter(f => f.team_h === player.team || f.team_a === player.team)
    .filter(f => !f.finished) // Only show upcoming fixtures
    .slice(0, 3);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
          <Card 
            className={cn(
              "elite-card relative w-[160px] h-[140px] cursor-pointer transition-all duration-300",
              "bg-slate-900 border border-slate-700 shadow-lg shadow-black/20",
              "hover:shadow-primary/30 hover:scale-[1.03] hover:border-slate-600",
              "group overflow-hidden",
              className
            )}
            style={{ '--glow-color': glowColor } as React.CSSProperties}
          >
            
            {/* Captain/Vice-Captain indicators - Top Middle */}
            {(isCaptain || isViceCaptain) && (
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 z-20">
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold",
                  "bg-gradient-to-br backdrop-blur-sm shadow-lg",
                  isCaptain 
                    ? "from-yellow-500/90 to-yellow-600/90" 
                    : "from-gray-500/90 to-gray-600/90"
                )}>
                  {isCaptain ? <CrownIcon className="w-3 h-3" /> : <StarIcon className="w-3 h-3" />}
                </div>
              </div>
            )}

            {/* Header - Player name and team */}
            <div className="relative z-10 p-2 pb-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-xs font-bold text-primary">
                      {team.short_name}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-slate-400 font-medium">
                  {player.element_type === 1 ? 'GK' : 
                   player.element_type === 2 ? 'DEF' : 
                   player.element_type === 3 ? 'MID' : 'FWD'}
                </div>
              </div>
              <h3 className="text-sm font-semibold text-white truncate mt-1">
                {player.web_name}
              </h3>
            </div>

            {/* Body - Elite Ownership % (Hero Stat) */}
            <div className="relative z-10 px-2 py-2 text-center">
              <div className="space-y-1">
                <div className={cn(
                  "text-2xl font-bold",
                  getEliteOwnershipColor(eliteOwnership)
                )}>
                  {eliteOwnership.toFixed(1)}%
                </div>
                <div className="text-xs text-slate-400">
                  Elite Ownership
                </div>
              </div>
            </div>

            {/* Footer - Key indicators */}
            <div className="relative z-10 px-2 pb-3">
              <div className="flex items-center justify-between text-xs">
                {/* Form */}
                <div className="flex items-center gap-1">
                  <TrendingUpIcon className={cn("w-3 h-3", getFormColor(player.form))} />
                  <span className={cn("font-medium", getFormColor(player.form))}>
                    {form.toFixed(1)}
                  </span>
                </div>

                {/* Expected Points */}
                <div className="flex items-center gap-1">
                  <TargetIcon className="w-3 h-3 text-blue-400" />
                  <span className="font-medium text-blue-400">
                    {epNext.toFixed(1)}
                  </span>
                </div>

                {/* Price */}
                <div className="flex items-center gap-1">
                  <CoinsIcon className="w-3 h-3 text-yellow-400" />
                  <span className="font-medium text-yellow-400">
                    £{price}m
                  </span>
                </div>
              </div>
            </div>

            {/* Enhanced hover glow effect */}
            <div className={cn(
              "absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300",
              "bg-gradient-to-br from-white/30 to-transparent pointer-events-none"
            )} />
          </Card>
      </DialogTrigger>
      
      {/* Comprehensive Dialog */}
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto bg-slate-900 border-slate-700 text-white">
          <div className="space-y-3">
            {/* Player Info */}
            <div className="space-y-1">
              <h4 className="font-semibold text-lg">{player.web_name}</h4>
              <p className="text-sm text-slate-400">
                {player.first_name} {player.second_name} • {team.name} • {player.element_type === 1 ? 'Goalkeeper' : 
                 player.element_type === 2 ? 'Defender' : 
                 player.element_type === 3 ? 'Midfielder' : 'Forward'}
              </p>
            </div>

            {/* Market Stats */}
            <div className="space-y-2">
              <h5 className="font-medium text-sm">Market Stats</h5>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Price:</span>
                  <span className="font-medium text-white">£{price}m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Overall Ownership:</span>
                  <span className="font-medium text-white">{parseFloat(player.selected_by_percent || "0").toFixed(1)}%</span>
                </div>
                <div className="flex justify-between col-span-2">
                  <span className="text-slate-400">Elite Ownership:</span>
                  <span className={cn("font-medium", getEliteOwnershipColor(eliteOwnership))}>
                    {eliteOwnership.toFixed(1)}%
                  </span>
                </div>
                <div className="col-span-2 text-xs text-slate-500">
                  Percentage of top 1k managers who own this player
                </div>
              </div>
            </div>

            {/* Performance Stats */}
            <div className="space-y-2">
              <h5 className="font-medium text-sm">Performance Stats</h5>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Points:</span>
                  <span className="font-medium text-white">{player.total_points}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Bonus Points:</span>
                  <span className="font-medium text-white">{player.bonus}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">ICT Index:</span>
                  <span className="font-medium text-white">{parseFloat(player.ict_index || "0").toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">PPG:</span>
                  <span className="font-medium text-white">{parseFloat(player.points_per_game || "0").toFixed(1)}</span>
                </div>
              </div>
            </div>

            {/* Predictive Stats */}
            <div className="space-y-2">
              <h5 className="font-medium text-sm">Predictive Stats</h5>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Expected Points:</span>
                  <span className="font-medium text-white">{epNext.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">xG per 90:</span>
                  <span className="font-medium text-white">{parseFloat(player.expected_goals_per_90 || "0").toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">xA per 90:</span>
                  <span className="font-medium text-white">{parseFloat(player.expected_assists_per_90 || "0").toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Form:</span>
                  <span className={cn("font-medium", getFormColor(player.form))}>
                    {form.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>

            {/* Captaincy Stats */}
            <div className="space-y-2">
              <h5 className="font-medium text-sm">Elite Captaincy</h5>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Captain:</span>
                  <span className="font-medium text-yellow-400">{player.captaincyCount || 0} managers</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Vice-Captain:</span>
                  <span className="font-medium text-gray-400">{player.viceCaptaincyCount || 0} managers</span>
                </div>
              </div>
            </div>

            {/* Upcoming Fixtures */}
            {nextFixtures.length > 0 && (
              <div className="space-y-2">
                <h5 className="font-medium text-sm">Next 3 Fixtures</h5>
                <div className="space-y-1">
                  {nextFixtures.map((fixture, index) => {
                    const isHome = fixture.team_h === player.team;
                    const opponentTeamId = isHome ? fixture.team_a : fixture.team_h;
                    const opponentTeam = teams.find(t => t.id === opponentTeamId);
                    const opponent = opponentTeam ? opponentTeam.name : 'Unknown';
                    const difficulty = isHome ? fixture.team_h_difficulty : fixture.team_a_difficulty;
                    
                    return (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <span className="text-slate-400">
                          {isHome ? 'vs' : '@'} {opponent}
                        </span>
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-xs",
                            difficulty <= 2 ? "border-green-500 text-green-500" :
                            difficulty <= 3 ? "border-yellow-500 text-yellow-500" :
                            "border-red-500 text-red-500"
                          )}
                        >
                          FDR {difficulty}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
      </DialogContent>
    </Dialog>
  );
}
