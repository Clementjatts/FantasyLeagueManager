import type { ChipStrategy } from "../types/fpl";
import { ChipIcons } from "../components/ChipStrategyIcons";

export const CHIP_STRATEGIES: ChipStrategy[] = [
  {
    name: "Wildcard",
    chipName: "wildcard",
    description: "Complete team overhaul - use during fixture swings or major team issues",
    icon: ChipIcons.wildcard,
    bestTiming: [
      "Around GW 16-20 for second half optimization",
      "After major blanks/doubles announcement",
      "When team value can be significantly improved",
      "When 4+ transfers are needed"
    ],
    considerations: [
      "Consider future fixture swings",
      "Plan for upcoming blank/double gameweeks",
      "Monitor price changes and team value",
      "Check injury news and team rotations"
    ]
  },
  {
    name: "Free Hit",
    chipName: "freehit",
    description: "One-week team transformation - ideal for blank/double gameweeks",
    icon: ChipIcons.freehit,
    bestTiming: [
      "During significant blank gameweeks",
      "In big double gameweeks",
      "When many key players have difficult fixtures",
      "For maximum point potential in crucial gameweeks"
    ],
    considerations: [
      "Compare potential points gain vs saving for later",
      "Check fixture difficulty of targeted players",
      "Consider form of available players",
      "Evaluate opposition managers' chip strategies"
    ]
  },
  {
    name: "Triple Captain",
    chipName: "3xc",
    description: "Triple points for your captain - maximize on double gameweeks",
    icon: ChipIcons["3xc"],
    bestTiming: [
      "During double gameweeks for premium players",
      "When top scorer has favorable fixtures",
      "Against defensively weak teams",
      "In crucial differential moments"
    ],
    considerations: [
      "Check fixture difficulty",
      "Verify player's recent form",
      "Consider rotation risks",
      "Compare with other premium options"
    ]
  },
  {
    name: "Bench Boost",
    chipName: "bboost",
    description: "All bench players score points - maximize bench potential",
    icon: ChipIcons.bboost,
    bestTiming: [
      "During double gameweeks",
      "When bench has good fixtures",
      "After wildcard optimization",
      "When all 15 players are likely to play"
    ],
    considerations: [
      "Ensure all players have fixtures",
      "Check for rotation risks",
      "Verify double gameweek potential",
      "Consider bench player form"
    ]
  }
];
