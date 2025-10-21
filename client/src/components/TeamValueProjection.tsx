import React from 'react';
import { type Player } from "../types/fpl";
import { cn } from "@/lib/utils";
import { ArrowLeftRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TeamValueProjectionProps {
  players: Player[];
  nextGameweek: number;
  freeTransfers: number;
}

interface RiskPlayer {
  name: string;
  risk: number;
}

interface GrowthPlayer {
  name: string;
  potential: number;
}

const TeamValueProjection: React.FC<TeamValueProjectionProps> = ({ players, nextGameweek, freeTransfers }) => {
  const calculateProjectedValue = () => {
    let totalProjectedValue = 0;
    let riskPlayers: RiskPlayer[] = [];
    let growthPlayers: GrowthPlayer[] = [];

    players.forEach(player => {
      const price = player.now_cost / 10;
      const form = parseFloat(player.form || '0');
      const ownership = parseFloat(player.selected_by_percent || '0');
      const priceChange = player.cost_change_event || 0;
      
      let projectedChange = 0;
      
      if (form > 6 && ownership > 20) {
        projectedChange += 0.2;
      } else if (form > 4 && ownership > 15) {
        projectedChange += 0.1;
      }
      
      if (priceChange > 0) {
        projectedChange += 0.1;
      } else if (priceChange < 0) {
        projectedChange -= 0.1;
      }
      
      if (form > 5 && ownership < 10) {
        growthPlayers.push({
          name: player.web_name,
          potential: projectedChange + 0.2
        });
      }
      
      if (form < 3 && ownership > 20) {
        riskPlayers.push({
          name: player.web_name,
          risk: -0.2
        });
      }
      
      totalProjectedValue += price + projectedChange;
    });

    return {
      totalProjectedValue: totalProjectedValue.toFixed(1),
      currentValue: (players.reduce((acc, p) => acc + p.now_cost / 10, 0)).toFixed(1),
      riskPlayers,
      growthPlayers
    };
  };

  const projection = calculateProjectedValue();
  const valueDifference = parseFloat(projection.totalProjectedValue) - parseFloat(projection.currentValue);

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-bold bg-gradient-to-r from-primary to-primary/80 text-transparent bg-clip-text">
          Squad Value Forecast
        </CardTitle>
        <span className={cn(
          "px-2.5 py-0.5 rounded-full text-sm font-semibold",
          valueDifference > 0 
            ? 'bg-primary/10 text-primary' 
            : valueDifference < 0 
              ? 'bg-destructive/10 text-destructive'
              : 'bg-electric-cyan/20 text-electric-cyan'
        )}>
          {valueDifference > 0 ? '+' : ''}{valueDifference.toFixed(1)}m
        </span>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-electric-cyan/10 rounded-lg p-3 border border-electric-cyan/20">
            <p className="text-sm text-muted-foreground mb-1">Current Value</p>
            <p className="text-2xl font-bold text-foreground">£{projection.currentValue}m</p>
          </div>
          <div className="bg-electric-cyan/10 rounded-lg p-3 border border-electric-cyan/20">
            <p className="text-sm text-muted-foreground mb-1">Projected Value</p>
            <p className="text-2xl font-bold text-foreground">£{projection.totalProjectedValue}m</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {projection.growthPlayers.length > 0 && (
            <div className="bg-primary/5 rounded-lg p-3 border border-primary/10">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-primary">Growth Potential</p>
                <span className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary">
                  {projection.growthPlayers.length}
                </span>
              </div>
              <ul className="space-y-2">
                {projection.growthPlayers.slice(0, 3).map((player, idx) => (
                  <li key={idx} className="flex justify-between items-center text-sm">
                    <span className="text-foreground">{player.name}</span>
                    <span className="text-primary font-medium">+£{player.potential.toFixed(1)}m</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-3">
            {projection.riskPlayers.length > 0 && (
              <div className="bg-destructive/5 rounded-lg p-3 border border-destructive/10">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-destructive">Price Drop Risk</p>
                  <span className="px-2 py-0.5 rounded-full text-xs bg-destructive/10 text-destructive">
                    {projection.riskPlayers.length}
                  </span>
                </div>
                <ul className="space-y-2">
                  {projection.riskPlayers.slice(0, 3).map((player, idx) => (
                    <li key={idx} className="flex justify-between items-center text-sm">
                      <span className="text-foreground">{player.name}</span>
                      <span className="text-destructive font-medium">{player.risk.toFixed(1)}m</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Free Transfers Section */}
            <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg p-3 border border-primary/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-primary/10">
                    <ArrowLeftRight className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Free Transfers</p>
                    <p className="text-lg font-semibold text-foreground">
                      {freeTransfers} for GW{nextGameweek}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 border border-primary/20">
                  <span className="text-xl font-bold text-primary">{freeTransfers}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TeamValueProjection;
