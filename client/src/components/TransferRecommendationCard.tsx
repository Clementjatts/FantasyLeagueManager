import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TintedGlassPlayerCard } from "./TintedGlassPlayerCard";
import { ArrowRightIcon, TrendingUpIcon, UsersIcon, CoinsIcon } from "lucide-react";
import { Player } from "../types/fpl";
import { cn } from "@/lib/utils";

interface TransferRecommendation {
  out: Player;
  in: Player;
}

interface TransferRecommendationCardProps {
  recommendedTransfers: TransferRecommendation[];
  pointsDelta: number;
  transferCost: number;
  gameweek: number;
  teams: any[];
  fixtures: any[];
}

export function TransferRecommendationCard({
  recommendedTransfers,
  pointsDelta,
  transferCost,
  gameweek,
  teams,
  fixtures
}: TransferRecommendationCardProps) {
  if (recommendedTransfers.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-slate-900/70 to-slate-900/40 backdrop-blur-xl border border-white/20">
        <CardHeader>
          <CardTitle className="text-slate-100 flex items-center gap-2">
            <TrendingUpIcon className="w-5 h-5 text-green-400" />
            Optimal Transfer Plan for Gameweek {gameweek}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold text-slate-100 mb-2">Hold Your Transfers</h3>
            <p className="text-slate-400">
              Your current squad is already optimized for Gameweek {gameweek}. 
              No transfers are recommended at this time.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getTeam = (teamId: number) => teams.find(t => t.id === teamId) || { short_name: 'UNK', name: 'Unknown' };

  return (
    <Card className="bg-gradient-to-br from-slate-900/70 to-slate-900/40 backdrop-blur-xl border border-white/20">
      <CardHeader>
        <CardTitle className="text-slate-100 flex items-center gap-2">
          <TrendingUpIcon className="w-5 h-5 text-green-400" />
          Optimal Transfer Plan for Gameweek {gameweek}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className={cn(
              "text-3xl font-bold mb-1",
              pointsDelta > 0 ? "text-green-400" : "text-red-400"
            )}>
              {pointsDelta > 0 ? '+' : ''}{pointsDelta.toFixed(1)}
            </div>
            <div className="text-sm text-slate-400">Projected Points Gain</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-slate-100 mb-1">
              {recommendedTransfers.length}
            </div>
            <div className="text-sm text-slate-400">Transfers</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-400 mb-1">
              -{transferCost}
            </div>
            <div className="text-sm text-slate-400">Transfer Cost</div>
          </div>
        </div>

        {/* Transfer Details */}
        <div className="space-y-4">
          <h4 className="font-semibold text-slate-100 flex items-center gap-2">
            <UsersIcon className="w-4 h-4" />
            Transfer Details
          </h4>
          
          {recommendedTransfers.map((transfer, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
              {/* Outgoing Player */}
              <div className="flex-1">
                <div className="text-sm text-slate-400 mb-2">Transfer Out</div>
                <TintedGlassPlayerCard
                  player={transfer.out}
                  team={getTeam(transfer.out.team)}
                  teams={teams}
                  fixtures={fixtures}
                  className="w-[120px] h-[100px]"
                />
              </div>

              {/* Arrow */}
              <div className="flex flex-col items-center mx-4">
                <ArrowRightIcon className="w-6 h-6 text-primary mb-2" />
                <div className="text-xs text-slate-400">
                  {transferCost > 0 && index === 0 && `-${transferCost} pts`}
                </div>
              </div>

              {/* Incoming Player */}
              <div className="flex-1">
                <div className="text-sm text-slate-400 mb-2">Transfer In</div>
                <TintedGlassPlayerCard
                  player={transfer.in}
                  team={getTeam(transfer.in.team)}
                  teams={teams}
                  fixtures={fixtures}
                  isNewPlayer={true}
                  className="w-[120px] h-[100px]"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="p-4 bg-gradient-to-r from-primary/10 to-blue-500/10 rounded-lg border border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <CoinsIcon className="w-4 h-4 text-primary" />
            <span className="font-semibold text-slate-100">Net Benefit</span>
          </div>
          <p className="text-sm text-slate-400">
            These transfers are projected to gain you <span className={cn(
              "font-semibold",
              pointsDelta > 0 ? "text-green-400" : "text-red-400"
            )}>{pointsDelta > 0 ? '+' : ''}{pointsDelta.toFixed(1)} points</span> after accounting for the {transferCost}-point transfer cost.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
