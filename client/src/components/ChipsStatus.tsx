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
];

export function ChipsStatus({ chips }: ChipsStatusProps) {
  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Rocket className="w-5 h-5 text-primary animate-float" />
          <CardTitle>Chips Status</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {ALL_CHIPS.map((chip) => {
            const isUsed = chips.some(c => c.name === chip.name);
            const usedChip = chips.find(c => c.name === chip.name);
            return (
              <div
                key={chip.name}
                className={cn(
                  "flex flex-col gap-2 p-4 rounded-lg",
                  "bg-gradient-to-br from-background/80 to-muted/50",
                  "border border-border/50",
                  "transition-all duration-300 hover:shadow-lg hover:border-primary/50",
                  "group"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium group-hover:text-primary transition-colors">{chip.label}</span>
                  <Badge
                    variant={isUsed ? "secondary" : "default"}
                    className={cn(
                      "transition-all duration-300",
                      isUsed ? "opacity-50" : "animate-pulse"
                    )}
                  >
                    {isUsed ? "Used" : "Available"}
                  </Badge>
                </div>
                {isUsed && usedChip && (
                  <p className="text-xs text-muted-foreground">
                    Used in Gameweek {usedChip.event}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
