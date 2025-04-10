import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Coins, TrendingUp, AlertTriangle } from "lucide-react";
import { Player, Team, Fixture } from "../types/fpl";

interface SimpleTeam {
  id: number;
  name: string;
  short_name: string;
}

interface TransferStrategyProps {
  team: Team;
  players: Player[];
  fixtures: Fixture[];
  teams: SimpleTeam[];
  freeTransfers: number;
  teamValue: number;
  bankBalance: number;
}

export function TransferStrategy({ team, players, fixtures, teams, freeTransfers, teamValue, bankBalance }: TransferStrategyProps) {
  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Transfer Summary</CardTitle>
          <TrendingUp className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <CardDescription>Free Transfers</CardDescription>
              <span className="text-sm font-medium">{freeTransfers}</span>
            </div>
            <div className="flex items-center justify-between">
              <CardDescription>Team Value</CardDescription>
              <span className="text-sm font-medium">£{teamValue.toFixed(1)}m</span>
            </div>
            <div className="flex items-center justify-between">
              <CardDescription>Bank Balance</CardDescription>
              <span className="text-sm font-medium">£{bankBalance.toFixed(1)}m</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Transfer Tips</CardTitle>
          <AlertTriangle className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {freeTransfers === 0 && (
              <p className="text-sm text-red-500">
                You have no free transfers. Making a transfer will cost you 4 points.
              </p>
            )}
            {freeTransfers === 1 && (
              <p className="text-sm text-yellow-500">
                You have 1 free transfer. Use it wisely!
              </p>
            )}
            {freeTransfers > 1 && (
              <p className="text-sm text-green-500">
                You have {freeTransfers} free transfers available.
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              Consider fixture difficulty and player form when making transfers.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Market Trends</CardTitle>
          <Coins className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {players
              .sort((a, b) => parseFloat(b.form) - parseFloat(a.form))
              .slice(0, 3)
              .map((player) => {
                const playerTeam = teams.find((t) => t.id === player.team);
                return (
                  <div key={player.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">{player.web_name}</span>
                      <span className="text-xs text-muted-foreground">
                        {playerTeam?.short_name}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-green-500">Form: {player.form}</span>
                      <span className="text-xs text-muted-foreground">
                        £{(player.now_cost / 10).toFixed(1)}m
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
