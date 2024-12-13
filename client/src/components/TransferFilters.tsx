import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface FilterOptions {
  team: string;
}

interface Team {
  id: number;
  name: string;
  short_name: string;
}

interface TransferFiltersProps {
  teams: Team[];
  onFilterChange: (filters: FilterOptions) => void;
}

export function TransferFilters({ teams, onFilterChange }: TransferFiltersProps) {
  const [selectedTeam, setSelectedTeam] = useState<string>('ALL');

  const handleTeamChange = (value: string) => {
    setSelectedTeam(value);
    onFilterChange({ team: value });
  };

  return (
    <div className="w-[200px]">
      <Select
        value={selectedTeam}
        onValueChange={handleTeamChange}
      >
        <SelectTrigger className="w-full bg-background border-input hover:bg-accent hover:text-accent-foreground">
          <SelectValue placeholder="Filter by team" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Teams</SelectLabel>
            <SelectItem value="ALL">All Teams</SelectItem>
            {teams.map((team) => (
              <SelectItem key={team.id} value={team.id.toString()}>
                {team.name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
