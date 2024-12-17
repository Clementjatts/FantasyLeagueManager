import { Player } from "../types/fpl";
import { PlayerCard } from "./PlayerCard";
import { cn } from "@/lib/utils";
import { TeamPitch } from "./TeamPitch";

interface LiveTeamPitchProps {
  players: Player[];
  substitutes: Player[];
  captainId?: number;
  viceCaptainId?: number;
  teams?: any[];
  fixtures?: any[];
}

export function LiveTeamPitch({ 
  players, 
  substitutes,
  captainId, 
  viceCaptainId,
  teams = [],
  fixtures = []
}: LiveTeamPitchProps) {
  const playersList = players || [];
  const substitutesList = substitutes || [];
  
  const getFormation = (players: Player[]) => {
    const def = players.filter(p => p.element_type === 2).length;
    const mid = players.filter(p => p.element_type === 3).length;
    const fwd = players.filter(p => p.element_type === 4).length;
    return `${def}-${mid}-${fwd}`;
  };

  const formation = getFormation(playersList);
  
  // Calculate live performance metrics
  const totalPoints = playersList.reduce((sum, p) => sum + (p.event_points || 0), 0);
  const playersPlayed = playersList.filter(p => p.minutes > 0).length;
  const playersToPlay = playersList.length - playersPlayed;
  
  const positions = {
    1: playersList.filter(p => p.element_type === 1),  // GK
    2: playersList.filter(p => p.element_type === 2),  // DEF
    3: playersList.filter(p => p.element_type === 3),  // MID
    4: playersList.filter(p => p.element_type === 4),  // FWD
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-background/80 backdrop-blur-sm rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-primary">{totalPoints}</div>
          <div className="text-sm text-muted-foreground">Total Points</div>
        </div>
        <div className="bg-background/80 backdrop-blur-sm rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-500">{playersPlayed}</div>
          <div className="text-sm text-muted-foreground">Players Played</div>
        </div>
        <div className="bg-background/80 backdrop-blur-sm rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-yellow-500">{playersToPlay}</div>
          <div className="text-sm text-muted-foreground">Yet to Play</div>
        </div>
      </div>
      <div className="relative w-full bg-gradient-to-b from-green-800 to-green-900 rounded-lg p-4 md:p-8 shadow-xl">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik01MCAwdjEwME0wIDUwaDEwMCIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiIGZpbGw9Im5vbmUiLz48L3N2Zz4=')] opacity-20"/>
      <div className="space-y-8">
        <TeamPitch
          players={players}
          substitutes={substitutes}
          captainId={captainId}
          viceCaptainId={viceCaptainId}
          renderPlayerCard={(player: Player, isSubstitute: boolean): React.ReactNode => (
            <PlayerCard
              player={player}
              className={cn(
                "transition-transform hover:scale-105 text-center w-full",
                isSubstitute && "opacity-80 hover:opacity-100"
              )}
              teams={teams}
              fixtures={fixtures}
              isCaptain={player.id === captainId}
              isViceCaptain={player.id === viceCaptainId}
              showLiveStats={true}
            />
          )}
        />
      </div>
    </div>
  </div>
  );
}
