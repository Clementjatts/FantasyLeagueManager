import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { fetchPlayers, fetchBootstrapStatic } from "@/lib/api";

export function PlayersToWatch() {
  const { data: players } = useQuery({ queryKey: ["/api/fpl/players"], queryFn: fetchPlayers });
  const { data: bootstrap } = useQuery({ queryKey: ["/api/fpl/bootstrap-static"], queryFn: fetchBootstrapStatic });

  const top = (players || [])
    .filter((p: any) => p && typeof p.form === "number")
    .sort((a: any, b: any) => (b.form || 0) - (a.form || 0))
    .slice(0, 4);

  const teamName = (teamId: number) => bootstrap?.teams?.find((t: any) => t.id === teamId)?.short_name || "";

  return (
    <Card className="group border border-glass-border bg-glass-bg backdrop-blur-xl shadow-glass">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Players to Watch</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {top.map((p: any) => (
          <div
            key={p.id}
            className="flex items-center justify-between rounded-xl border border-glass-border/60 bg-primary/5 px-3 py-2 group-hover:border-primary/30 transition-colors"
          >
            <div className="min-w-0">
              <div className="font-semibold truncate">{p.web_name}</div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {teamName(p.team)} • {positionLabel(p.element_type)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Form</div>
              <div className="text-xl font-extrabold tabular-nums">{Number(p.form || 0).toFixed(1)}</div>
            </div>
          </div>
        ))}
        {top.length === 0 && (
          <div className="text-sm text-muted-foreground">No standout players to display right now.</div>
        )}
      </CardContent>
    </Card>
  );
}

function positionLabel(elementType: number) {
  switch (elementType) {
    case 1: return "GKP";
    case 2: return "DEF";
    case 3: return "MID";
    case 4: return "FWD";
    default: return "";
  }
}


