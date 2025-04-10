import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Rocket } from "lucide-react";
import { cn } from "@/lib/utils";
import { type Chip } from "../types/fpl";

interface ChipsStatusProps {
  chips: Chip[];
}

const ALL_CHIPS = [
  { name: "wildcard", label: "Wildcard" },
  { name: "freehit", label: "Free Hit" },
  { name: "bboost", label: "Bench Boost" },
  { name: "3xc", label: "Triple Captain" },
  { name: "manager", label: "Assistant Manager" },
];

export function ChipsStatus({ chips }: ChipsStatusProps) {
  return (
    <Card className="border-2 border-primary/20">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Rocket className="w-5 h-5 text-primary" />
              <div className="absolute inset-0 text-primary blur-sm opacity-50 animate-pulse" />
            </div>
            <CardTitle>Chips Status</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {ALL_CHIPS.map((chip) => {
            const isUsed = chips.some(c => c.name === chip.name);
            const usedChip = chips.find(c => c.name === chip.name);
            return (
              <div
                key={chip.name}
                className={cn(
                  "group relative overflow-hidden",
                  "rounded-xl border",
                  "bg-gradient-to-br from-background via-card to-muted/30",
                  isUsed ? "border-border/40" : "border-primary/20",
                  "transition duration-300",
                  "hover:shadow-md hover:shadow-primary/5",
                  !isUsed && "hover:border-primary/40"
                )}
              >
                {!isUsed && (
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-primary/2 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
                <div className="relative p-3 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={cn(
                        "font-medium text-sm truncate",
                        !isUsed && "group-hover:text-primary transition-colors"
                      )}>
                        {chip.label}
                      </span>
                    </div>
                    <Badge
                      variant={isUsed ? "secondary" : "default"}
                      className={cn(
                        "shrink-0 px-2 text-xs font-medium",
                        isUsed 
                          ? "bg-muted/80 text-muted-foreground" 
                          : "bg-primary/10 text-primary"
                      )}
                    >
                      {isUsed ? "Used" : "Available"}
                    </Badge>
                  </div>
                  {isUsed && usedChip && (
                    <div className="text-xs text-muted-foreground/80">
                      Used in Gameweek {usedChip.event}
                    </div>
                  )}
                  {!isUsed && (
                    <div className="absolute top-0 right-0 w-16 h-16">
                      <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-primary/40 animate-ping" />
                      <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-primary/80" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
