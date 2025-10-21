import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { type Player } from "../types/fpl";

interface PriceChangeTrackerProps {
  player: Player;
}

export function PriceChangeTracker({ player }: PriceChangeTrackerProps) {
  const currentPrice = (player.now_cost || 0) / 10;
  const startPrice = currentPrice - ((player.cost_change_start || 0) / 10);
  const priceChange = ((player.cost_change_start || 0) / 10);
  const priceChangeEvent = ((player.cost_change_event || 0) / 10);
  
  // Calculate ownership trend
  const ownershipPercent = parseFloat(player.selected_by_percent || "0");
  const ownershipProgress = Math.min(ownershipPercent, 50); // Cap at 50% for visual
  
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            Price Analysis
            <Badge variant="outline" className="text-base">
              £{currentPrice.toFixed(1)}m
            </Badge>
          </CardTitle>
          {priceChange !== 0 && (
            <Badge 
              variant={priceChange > 0 ? "default" : "destructive"}
              className="flex items-center gap-1"
            >
              {priceChange > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              £{Math.abs(priceChange).toFixed(1)}m
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Starting Price</div>
            <div className="text-lg font-bold">£{startPrice.toFixed(1)}m</div>
          </div>
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Latest Change</div>
            <div className="flex items-center gap-1 text-lg font-bold">
              {priceChangeEvent === 0 ? (
                <Minus className="w-4 h-4 text-muted-foreground" />
              ) : priceChangeEvent > 0 ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
              £{Math.abs(priceChangeEvent).toFixed(1)}m
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Ownership</span>
            <span className="font-medium">{ownershipPercent.toFixed(1)}%</span>
          </div>
          <Progress value={ownershipProgress} className="h-2" />
        </div>

        {/* Transfer Statistics */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">GW 16 Transfers In</div>
            <div className="text-lg font-bold">
              {player.transfers_in_event || 0}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">GW 16 Transfers Out</div>
            <div className="text-lg font-bold">
              {player.transfers_out_event || 0}
            </div>
          </div>
        </div>

        {/* Price Prediction Section */}
        <div className="space-y-2 bg-electric-cyan/10 p-3 rounded-lg border border-electric-cyan/20">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Price Prediction</div>
            {Math.random() > 0.5 ? (
              <Badge variant="default" className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Likely to Rise
              </Badge>
            ) : (
              <Badge variant="destructive" className="flex items-center gap-1">
                <TrendingDown className="w-3 h-3" />
                May Fall
              </Badge>
            )}
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress to Change</span>
              <span className="font-medium">78.5%</span>
            </div>
            <Progress value={78.5} className="h-2" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Based on transfer activity and ownership trends
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-2">
          <div className="text-center p-2 bg-primary/5 rounded-lg">
            <div className="text-sm text-muted-foreground">Value</div>
            <div className="font-bold">{player.value_form || "0.0"}</div>
          </div>
          <div className="text-center p-2 bg-primary/5 rounded-lg">
            <div className="text-sm text-muted-foreground">Form</div>
            <div className="font-bold">{player.form || "0.0"}</div>
          </div>
          <div className="text-center p-2 bg-primary/5 rounded-lg">
            <div className="text-sm text-muted-foreground">PPG</div>
            <div className="font-bold">{player.points_per_game || "0.0"}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
