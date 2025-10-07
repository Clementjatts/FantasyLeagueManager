import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { type Player, type BootstrapTeam } from "@/types/fpl";

function positionLabel(pos?: number) {
  switch (pos) {
    case 1: return "GKP";
    case 2: return "DEF";
    case 3: return "MID";
    case 4: return "FWD";
    default: return "";
  }
}

export function HistoricalPlayerSummary({ player, team }: { player: Player; team?: BootstrapTeam }) {
  const primaryStats = [
    { label: "Total Points", value: player.total_points },
    { label: "Minutes", value: player.minutes },
    { label: "ICT Index", value: Number(player.ict_index || 0).toFixed(1) },
  ];

  const attacking = [
    { label: "Goals", value: player.goals_scored },
    { label: "Assists", value: player.assists },
    { label: "Bonus", value: player.bonus },
  ];

  const advanced = [
    { label: "xG", value: Number((player as any).expected_goals || 0).toFixed(2) },
    { label: "xA", value: Number((player as any).expected_assists || 0).toFixed(2) },
    { label: "xGI", value: (
      Number((player as any).expected_goals || 0) + Number((player as any).expected_assists || 0)
    ).toFixed(2) },
  ];

  return (
    <Card className="border border-glass-border bg-glass-bg backdrop-blur-xl shadow-glass">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-radiant-violet to-pink-500 flex items-center justify-center text-white font-bold">
              {player.web_name?.charAt(0) || "P"}
            </div>
            <div className="min-w-0">
              <CardTitle className="text-lg truncate">{player.web_name}</CardTitle>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{team?.name || "Unknown Team"}</span>
                <span>•</span>
                <span>{positionLabel(player.element_type)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-primary/10">Hist. Season</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* headline stats */}
        <div className="grid grid-cols-3 gap-3">
          {primaryStats.map((s) => (
            <div key={s.label} className="rounded-xl border border-glass-border/60 bg-primary/5 px-3 py-2 text-center">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{s.label}</div>
              <div className="text-2xl font-extrabold tabular-nums">{s.value}</div>
            </div>
          ))}
        </div>

        {/* breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">Attacking Contribution</div>
            <div className="grid grid-cols-3 gap-3">
              {attacking.map(s => (
                <div key={s.label} className="rounded-xl border border-glass-border/60 bg-primary/5 px-3 py-2 text-center">
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{s.label}</div>
                  <div className="text-xl font-bold tabular-nums">{s.value}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">Advanced Metrics</div>
            <div className="grid grid-cols-3 gap-3">
              {advanced.map(s => (
                <div key={s.label} className="rounded-xl border border-glass-border/60 bg-primary/5 px-3 py-2 text-center">
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{s.label}</div>
                  <div className="text-xl font-bold tabular-nums">{s.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


