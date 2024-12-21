import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: React.ReactNode;
  tooltip: string;
}

export function StatCard({ label, value, subValue, tooltip }: StatCardProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="p-4 rounded-lg bg-primary/5 space-y-1 cursor-help">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{label}</p>
              <Info className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="font-semibold">{value}</p>
            {subValue && (
              <div className="text-xs text-muted-foreground">
                {subValue}
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
