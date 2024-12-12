import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle } from "lucide-react";

interface TeamIdInputProps {
  onTeamIdChange: (teamId: number) => void;
}

export function TeamIdInput({ onTeamIdChange }: TeamIdInputProps) {
  const [teamId, setTeamId] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    const savedTeamId = localStorage.getItem("fpl_team_id");
    if (savedTeamId) {
      setTeamId(savedTeamId);
      onTeamIdChange(parseInt(savedTeamId, 10));
    }
  }, [onTeamIdChange]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedId = parseInt(teamId, 10);
    
    if (isNaN(parsedId) || parsedId <= 0) {
      toast({
        title: "Invalid Team ID",
        description: "Please enter a valid FPL team ID",
        variant: "destructive",
      });
      return;
    }

    localStorage.setItem("fpl_team_id", teamId);
    onTeamIdChange(parsedId);
    toast({
      title: "Team ID Updated",
      description: "Your FPL team ID has been saved",
    });
  };

  return (
    <Card className="bg-primary/5">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-primary" />
          <CardTitle>FPL Team Setup</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex gap-4">
          <Input
            type="number"
            placeholder="Enter your FPL Team ID"
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
            className="max-w-[200px]"
          />
          <Button type="submit">Save Team ID</Button>
        </form>
      </CardContent>
    </Card>
  );
}
