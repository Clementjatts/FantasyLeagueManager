import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type Pick } from "../types/fpl";
import { cn } from "@/lib/utils";

interface FormationAnalysisProps {
  picks: Pick[];
  onFormationChange?: (formation: string) => void;
}

// Common formations in FPL
const FORMATIONS = [
  "4-4-2",
  "4-3-3",
  "3-5-2",
  "3-4-3",
  "5-4-1",
  "5-3-2",
  "4-5-1"
];

export function FormationAnalysis({ picks, onFormationChange }: FormationAnalysisProps) {
  // Calculate current formation
  const getCurrentFormation = (picks: Pick[]) => {
    const starters = picks
      .filter(p => p.position <= 11)
      .sort((a, b) => a.position - b.position);
    
    // Count players by position (excluding GK)
    const defCount = starters.filter(p => p.position >= 2 && p.position <= 5).length;
    const midCount = starters.filter(p => p.position >= 6 && p.position <= 10).length;
    const fwdCount = starters.filter(p => p.position >= 11).length;
    
    return `${defCount}-${midCount}-${fwdCount}`;
  };

  const currentFormation = getCurrentFormation(picks);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Formation Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Current Formation:</span>
            <Badge variant="secondary" className="text-lg">
              {currentFormation}
            </Badge>
          </div>
          
          <div>
            <div className="text-sm font-medium mb-2">Alternative Formations:</div>
            <div className="flex flex-wrap gap-2">
              {FORMATIONS.map(formation => (
                <Button
                  key={formation}
                  variant={formation === currentFormation ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "transition-all duration-200",
                    formation === currentFormation && "ring-2 ring-primary"
                  )}
                  onClick={() => onFormationChange?.(formation)}
                >
                  {formation}
                </Button>
              ))}
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            {currentFormation === "4-4-2" && (
              "Balanced formation good for overall team stability"
            )}
            {currentFormation === "4-3-3" && (
              "Attack-focused formation, great for high-scoring gameweeks"
            )}
            {currentFormation === "3-5-2" && (
              "Midfield-heavy formation, ideal for controlling bonus points"
            )}
            {currentFormation === "3-4-3" && (
              "Aggressive formation, maximizing attacking returns"
            )}
            {currentFormation === "5-3-2" && (
              "Defensive formation, good for tough fixture runs"
            )}
            {currentFormation === "5-4-1" && (
              "Ultra-defensive setup, focusing on clean sheet points"
            )}
            {currentFormation === "4-5-1" && (
              "Midfield-focused formation, great for bonus point potential"
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
