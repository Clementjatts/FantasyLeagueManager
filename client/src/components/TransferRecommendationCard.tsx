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
      <Card className="bg-gradient-to-br from-emerald-500/10 via-primary/5 to-blue-500/10 backdrop-blur-xl border border-emerald-500/20 shadow-lg hover:shadow-emerald-500/20 transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-emerald-400 to-green-500 rounded-xl flex items-center justify-center">
              <TrendingUpIcon className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-800 mb-1">Optimal Transfer Plan - GW{gameweek}</h3>
              <p className="text-sm text-slate-600">
                Your squad is already optimized. No transfers recommended.
              </p>
            </div>
            <div className="text-2xl">🎯</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getTeam = (teamId: number) => teams.find(t => t.id === teamId) || { short_name: 'UNK', name: 'Unknown' };

  return (
    <Card className="bg-gradient-to-br from-emerald-500/10 via-primary/5 to-blue-500/10 backdrop-blur-xl border border-emerald-500/20 shadow-lg hover:shadow-emerald-500/20 transition-all duration-300">
      <CardContent className="p-6">
        {/* Header with Metrics */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-green-500 rounded-lg flex items-center justify-center">
              <TrendingUpIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-800">Optimal Transfer Plan - GW{gameweek}</h3>
              <p className="text-sm text-slate-600">{recommendedTransfers.length} transfer{recommendedTransfers.length !== 1 ? 's' : ''} recommended</p>
            </div>
          </div>
          
          {/* Compact Metrics */}
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className={cn(
                "text-2xl font-bold",
                pointsDelta > 0 ? "text-emerald-600" : "text-red-500"
              )}>
                {pointsDelta > 0 ? '+' : ''}{pointsDelta.toFixed(1)}
              </div>
              <div className="text-xs text-slate-500">Points Gain</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-500">
                -{transferCost}
              </div>
              <div className="text-xs text-slate-500">Cost</div>
            </div>
          </div>
        </div>

        {/* Transfer Details - Expanded Layout */}
        <div className="space-y-4">
          {recommendedTransfers.map((transfer, index) => (
            <div key={index} className="flex items-center gap-6 p-6 bg-white/50 rounded-xl border border-emerald-200/50 hover:bg-white/70 transition-all duration-200">
              {/* Outgoing Player */}
              <div className="flex-1">
                <div className="text-sm text-slate-500 mb-3 font-medium">TRANSFER OUT</div>
                <TintedGlassPlayerCard
                  player={transfer.out}
                  team={getTeam(transfer.out.team)}
                  teams={teams}
                  fixtures={fixtures}
                  className="w-[180px] h-[150px]"
                />
              </div>

              {/* Arrow with Cost */}
              <div className="flex flex-col items-center px-4">
                <ArrowRightIcon className="w-8 h-8 text-emerald-600 mb-2" />
                {transferCost > 0 && index === 0 && (
                  <div className="text-sm text-red-500 font-medium bg-red-50 px-2 py-1 rounded">
                    -{transferCost} pts
                  </div>
                )}
              </div>

              {/* Incoming Player */}
              <div className="flex-1">
                <div className="text-sm text-slate-500 mb-3 font-medium">TRANSFER IN</div>
                <TintedGlassPlayerCard
                  player={transfer.in}
                  team={getTeam(transfer.in.team)}
                  teams={teams}
                  fixtures={fixtures}
                  isNewPlayer={true}
                  className="w-[180px] h-[150px]"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Compact Summary */}
        <div className="mt-4 p-3 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 rounded-lg border border-emerald-200/50">
          <div className="flex items-center gap-2">
            <CoinsIcon className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-medium text-slate-700">Net Benefit:</span>
            <span className={cn(
              "text-sm font-semibold",
              pointsDelta > 0 ? "text-emerald-600" : "text-red-500"
            )}>
              {pointsDelta > 0 ? '+' : ''}{pointsDelta.toFixed(1)} points
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
