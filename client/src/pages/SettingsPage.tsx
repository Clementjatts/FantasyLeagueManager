import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function SettingsPage() {
  const { profile, setFplTeamId } = useAuth();
  const [teamId, setTeamId] = useState<string>(profile?.fplTeamId ? String(profile.fplTeamId) : "");

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(teamId, 10);
    if (!isNaN(parsed) && parsed > 0) {
      await setFplTeamId(parsed);
    }
  };

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>User Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSave} className="flex gap-4 items-end">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Linked FPL Team ID</div>
              <Input type="number" value={teamId} onChange={(e) => setTeamId(e.target.value)} placeholder="Enter FPL Team ID" className="max-w-[220px]" />
            </div>
            <Button type="submit">Save</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}


