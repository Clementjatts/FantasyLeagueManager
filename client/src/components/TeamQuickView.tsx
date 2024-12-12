import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { type Pick, type Player } from "../types/fpl";
import { useQuery } from "@tanstack/react-query";
import { fetchPlayers } from "../lib/api";
import { Separator } from "@/components/ui/separator";

interface TeamQuickViewProps {
  picks: Pick[];
}

const positionMap: Record<number, string> = {
  1: "GK",
  2: "DEF",
  3: "MID",
  4: "FWD"
};

export function TeamQuickView({ picks }: TeamQuickViewProps) {
  const { data: players } = useQuery({
    queryKey: ["/api/fpl/players"],
    queryFn: fetchPlayers,
  });

  if (!players) return null;

  const getPlayer = (id: number) => {
    return players.find(p => p.id === id);
  };

  const starters = picks
    .filter(p => p.position <= 11)
    .sort((a, b) => a.position - b.position);

  const bench = picks
    .filter(p => p.position > 11)
    .sort((a, b) => a.position - b.position);

  const PlayerCard = ({ pick }: { pick: Pick }) => {
    const player = getPlayer(pick.element);
    if (!player) return null;

    return (
      <div
        className={cn(
          "flex flex-col gap-1 px-3 py-2 rounded-lg",
          "bg-gradient-to-br from-background/80 to-muted/50",
          "border border-border/50",
          pick.is_captain && "ring-2 ring-primary ring-offset-1",
          "transition-all duration-200 hover:scale-105 hover:shadow-md",
          "group"
        )}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium truncate">
            {player.web_name}
            {pick.is_captain && (
              <span className="ml-1 text-primary font-semibold">(C)</span>
            )}
            {pick.is_vice_captain && (
              <span className="ml-1 text-muted-foreground font-semibold">(V)</span>
            )}
          </span>
          <span className="text-xs text-muted-foreground">
            {positionMap[player.element_type]}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>£{(player.now_cost / 10).toFixed(1)}m</span>
          <span className="opacity-60 group-hover:opacity-100 transition-opacity">
            {player.team}
          </span>
        </div>
      </div>
    );
  };

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
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {starters.map((pick) => (
            <PlayerCard key={pick.element} pick={pick} />
          ))}
        </div>
        
        <Separator className="my-2" />
        
        <div>
          <div className="text-sm font-medium text-muted-foreground mb-2">Bench</div>
          <div className="grid grid-cols-4 gap-2">
            {bench.map((pick) => (
              <PlayerCard key={pick.element} pick={pick} />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
