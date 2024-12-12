import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { type Pick, type Player } from "../types/fpl";
import { useQuery } from "@tanstack/react-query";
import { fetchPlayers } from "../lib/api";

interface TeamQuickViewProps {
  picks: Pick[];
}

export function TeamQuickView({ picks }: TeamQuickViewProps) {
  const { data: players } = useQuery({
    queryKey: ["/api/fpl/players"],
    queryFn: fetchPlayers,
  });

  if (!players) return null;

  const getPlayerName = (id: number) => {
    const player = players.find(p => p.id === id);
    return player?.web_name || "Unknown";
  };

  const starters = picks.filter(p => p.position <= 11)
    .sort((a, b) => a.position - b.position);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <CardTitle>Current Team</CardTitle>
          </div>
          <Link href="/team">
            <Button variant="ghost" className="gap-2">
              View Full Team
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          {starters.slice(0, 11).map((pick) => (
            <div
              key={pick.element}
              className={cn(
                "text-sm font-medium px-2 py-1 rounded-md text-center",
                "bg-gradient-to-br from-background/80 to-muted/50",
                "border border-border/50 shadow-sm",
                pick.is_captain && "ring-2 ring-primary ring-offset-1",
                "transition-all duration-200 hover:scale-105"
              )}
            >
              <div className="truncate">
                {getPlayerName(pick.element)}
              </div>
              {pick.is_captain && (
                <div className="text-xs text-primary font-semibold">(C)</div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
