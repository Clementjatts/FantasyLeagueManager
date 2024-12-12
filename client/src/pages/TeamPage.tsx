import { useQuery } from "@tanstack/react-query";
import { TeamPitch } from "../components/TeamPitch";
import { fetchMyTeam, fetchPlayers } from "../lib/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

export default function TeamPage() {
  const { data: team, isLoading: isLoadingTeam } = useQuery({
    queryKey: ["/api/fpl/my-team/1"],
    queryFn: () => fetchMyTeam(1)
  });

  const { data: players, isLoading: isLoadingPlayers } = useQuery({
    queryKey: ["/api/fpl/players"],
  });

  if (isLoadingTeam || isLoadingPlayers) {
    return <Skeleton className="h-[600px] w-full" />;
  }

  if (!team || !players) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Failed to load team data</AlertDescription>
      </Alert>
    );
  }

  const teamPlayers = team.picks.map(pick => ({
    ...players.find(p => p.id === pick.element)!,
    position: pick.position,
  }));

  const captainId = team.picks.find(p => p.is_captain)?.element;
  const viceCaptainId = team.picks.find(p => p.is_vice_captain)?.element;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">My Team</h1>
      <TeamPitch 
        players={teamPlayers}
        captainId={captainId}
        viceCaptainId={viceCaptainId}
      />
    </div>
  );
}
