import { TrendingUp, Calendar, Zap, Info } from "lucide-react";

export const ChipIcons = {
  wildcard: <TrendingUp className="w-5 h-5 text-primary" />,
  freehit: <Calendar className="w-5 h-5 text-primary" />,
  "3xc": <Zap className="w-5 h-5 text-primary" />,
  bboost: <Info className="w-5 h-5 text-primary" />
} as const;
