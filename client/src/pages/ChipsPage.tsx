import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Rocket } from "lucide-react";
import { fetchMyTeam } from "../lib/api";
import { Team } from "../types/fpl";

// Simple mapping of chip names to display labels
const CHIP_LABELS: Record<string, string> = {
  wildcard: "Wildcard",
  freehit: "Free Hit",
  bboost: "Bench Boost",
  "3xc": "Triple Captain"
};

export default function ChipsPage() {
  // Fetch team ID from local storage
  const { data: teamId } = useQuery({
    queryKey: ["teamId"],
    queryFn: () => localStorage.getItem("teamId") || "1"
  });

  // Fetch team data including chips
  const { data: team, isLoading, error } = useQuery({
    queryKey: ["my-team", teamId],
    queryFn: async () => {
      try {
        const data = await fetchMyTeam(Number(teamId));
        console.log('ChipsPage team data:', {
          hasChips: Boolean(data?.chips),
          chipCount: data?.chips?.length
        });
        return data;
      } catch (err) {
        console.error('Error fetching team data:', err);
        throw err;
      }
    },
    enabled: !!teamId
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load chip data. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // No data state
  if (!team?.chips) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertDescription>
            No chip data available. Please check your team ID.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold tracking-tight mb-6">FPL Chips</h1>
      <div className="grid gap-4">
        {Object.entries(CHIP_LABELS).map(([chipName, label]) => {
          const chip = team.chips.find(c => c.name === chipName);
          
          return (
            <Card key={chipName}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Rocket className="h-5 w-5 text-primary" />
                    <CardTitle>{label}</CardTitle>
                  </div>
                  <Badge variant={chip ? "secondary" : "default"}>
                    {chip ? `Used GW${chip.event}` : "Available"}
                  </Badge>
                </div>
              </CardHeader>
              {chip && (
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Used on {new Date(chip.time).toLocaleDateString()}
                  </p>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}