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
  position: string;
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
  const [selectedPosition, setSelectedPosition] = useState<string>('ALL');

  const handleTeamChange = (value: string) => {
    setSelectedTeam(value);
    onFilterChange({ team: value, position: selectedPosition });
  };

  const handlePositionChange = (value: string) => {
    setSelectedPosition(value);
    onFilterChange({ team: selectedTeam, position: value });
  };

  return (
    <div className="flex items-center gap-2">
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
              <SelectLabel>Clubs</SelectLabel>
              <SelectItem value="ALL">All Clubs</SelectItem>
              {teams
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((team) => (
                  <SelectItem key={team.id} value={team.id.toString()}>
                    {team.name}
                  </SelectItem>
                ))
              }
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      
      <div className="w-[120px]">
        <Select
          value={selectedPosition}
          onValueChange={handlePositionChange}
        >
          <SelectTrigger className="w-full bg-background border-input hover:bg-accent hover:text-accent-foreground">
            <SelectValue placeholder="Position" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Position</SelectLabel>
              <SelectItem value="ALL">All Pos</SelectItem>
              <SelectItem value="1">GK</SelectItem>
              <SelectItem value="2">DEF</SelectItem>
              <SelectItem value="3">MID</SelectItem>
              <SelectItem value="4">FWD</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}