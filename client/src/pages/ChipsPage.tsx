import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Rocket } from "lucide-react";
import { fetchMyTeam } from "../lib/api";
import { Team, Chip } from "../types/fpl";

const CHIP_LABELS: Record<string, string> = {
  wildcard: "Wildcard",
  freehit: "Free Hit",
  bboost: "Bench Boost",
  "3xc": "Triple Captain"
};

function ChipCard({ chip }: { chip: Chip }) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Rocket className="w-5 h-5 text-primary" />
            <CardTitle>{CHIP_LABELS[chip.name] || chip.name}</CardTitle>
          </div>
          <Badge variant={chip.event ? "secondary" : "default"}>
            {chip.event ? `Used GW${chip.event}` : 'Available'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {chip.event && (
          <p className="text-sm text-muted-foreground">
            Used on {new Date(chip.time).toLocaleDateString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function ChipsPage() {
  const { data: teamId } = useQuery({
    queryKey: ["teamId"],
    queryFn: () => localStorage.getItem("teamId") || "1"
  });

  const { data: team, isLoading, error } = useQuery({
    queryKey: ["/api/fpl/my-team", teamId],
    queryFn: async () => {
      try {
        const data = await fetchMyTeam(Number(teamId));
        console.log('ChipsPage received team data:', {
          hasChips: Boolean(data?.chips),
          chipCount: data?.chips?.length,
          currentEvent: data?.current_event
        });
        return data;
      } catch (err) {
        console.error('Error fetching team data:', err);
        throw err;
      }
    },
    enabled: !!teamId,
    retry: 1
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load chip data. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  if (!team?.chips) {
    return (
      <Alert>
        <AlertDescription>
          No chip data available.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold tracking-tight mb-6">Chip Status</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.keys(CHIP_LABELS).map((chipName) => {
          const chip = team.chips.find(c => c.name === chipName) || {
            name: chipName,
            time: "",
            event: null
          };
          return <ChipCard key={chipName} chip={chip} />;
        })}
      </div>
    </div>
  );
}