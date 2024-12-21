import { TrendingUp, TrendingDown, ArrowUpRight } from "lucide-react";
import { StatCard } from "./StatCard";
import type { Team } from "../types/fpl";

interface TeamStatsProps {
  team: Team;
}

export function TeamStats({ team }: TeamStatsProps) {
  const valueChange = team.stats.value - team.last_deadline_value;
  const valueChangeDisplay = (
    valueChange > 0 ? (
      <div className="flex items-center gap-1 text-green-500 text-xs">
        <TrendingUp className="w-3 h-3" />
        +£{(valueChange / 10).toFixed(1)}m
      </div>
    ) : (
      <div className="flex items-center gap-1 text-red-500 text-xs">
        <TrendingDown className="w-3 h-3" />
        -£{(Math.abs(valueChange) / 10).toFixed(1)}m
      </div>
    )
  );

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard
        label="Team Value"
        value={`£${(team.stats.value / 10).toFixed(1)}m`}
        subValue={valueChangeDisplay}
        tooltip="Total value of your team including bank balance"
      />
      <StatCard
        label="Bank"
        value={`£${(team.transfers.bank / 10).toFixed(1)}m`}
        subValue="Available for transfers"
        tooltip="Money available for transfers"
      />
      <StatCard
        label="Free Transfers"
        value={team.transfers.limit}
        subValue="No hit cost"
        tooltip="Number of transfers you can make without taking points hits"
      />
      <StatCard
        label="Recent Points"
        value={team.stats.event_points}
        subValue={
          <div className="flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" />
            vs {team.stats.average_entry_score} avg
          </div>
        }
        tooltip="Points scored in the current gameweek"
      />
    </div>
  );
}
