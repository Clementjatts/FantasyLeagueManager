import { Player } from "../../types/fpl";
import { ElitePlayerCard } from "../ElitePlayerCard";
import { BasePitch } from "./BasePitch";

interface TopManagersPitchProps {
  players: (Player & { 
    position: number; 
    eliteOwnership: number;
    captaincyCount?: number;
    viceCaptaincyCount?: number;
  })[];
  substitutes: (Player & { 
    position: number; 
    eliteOwnership: number;
    captaincyCount?: number;
    viceCaptaincyCount?: number;
  })[];
  fixtures?: any[];
  teams?: any[];
}

export function TopManagersPitch({ 
  players, 
  substitutes,
  fixtures,
  teams
}: TopManagersPitchProps) {
  return (
    <BasePitch
      players={players}
      substitutes={substitutes}
      renderPlayer={(player) => {
        const team = teams?.find((t: any) => t.id === player.team);
        if (!team) return null;

        return (
          <ElitePlayerCard
            key={player.id}
            player={player}
            team={team}
            fixtures={fixtures}
            teams={teams}
            isCaptain={false}
            isViceCaptain={false}
            className="w-[180px] h-[150px]"
          />
        );
      }}
    />
  );
}
