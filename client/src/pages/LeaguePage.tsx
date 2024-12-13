import { Card, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";

export default function LeaguePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">League Content Coming Soon</h1>
      <Card>
        <CardContent className="p-6">
          <div className="text-center space-y-2">
            <Users className="w-12 h-12 mx-auto text-muted-foreground" />
            <h2 className="text-2xl font-semibold">Under Development</h2>
            <p className="text-muted-foreground">
              This feature will be available in a future update
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
