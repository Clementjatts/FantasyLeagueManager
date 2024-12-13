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
  position: string;
  team: string;
  minPrice: number;
  maxPrice: number;
  minForm: number;
  sortBy: 'price' | 'form' | 'points' | 'selected';
  sortOrder: 'asc' | 'desc';
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
  const [filters, setFilters] = useState<FilterOptions>({
    position: 'ALL',
    team: 'ALL',
    minPrice: 0,
    maxPrice: 15,
    minForm: 0,
    sortBy: 'points',
    sortOrder: 'desc',
  });

  const positions = [
    { value: 'ALL', label: 'All Positions' },
    { value: '1', label: 'Goalkeeper' },
    { value: '2', label: 'Defender' },
    { value: '3', label: 'Midfielder' },
    { value: '4', label: 'Forward' },
  ];

  const sortOptions = [
    { value: 'price', label: 'Price' },
    { value: 'form', label: 'Form' },
    { value: 'points', label: 'Total Points' },
    { value: 'selected', label: 'Selection %' },
  ];

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-card to-muted/10 border border-border/30">
      <div className="space-y-6">
        {/* Position and Team Filters */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2.5">
            <Label className="text-sm font-medium text-muted-foreground">Position</Label>
            <Select
              value={filters.position}
              onValueChange={(value) => handleFilterChange('position', value)}
            >
              <SelectTrigger className="w-full bg-background/50 border-border/50 hover:bg-background/80 transition-colors">
                <SelectValue placeholder="Select position" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Positions</SelectLabel>
                  {positions.map((pos) => (
                    <SelectItem key={pos.value} value={pos.value}>
                      {pos.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2.5">
            <Label className="text-sm font-medium text-muted-foreground">Team</Label>
            <Select
              value={filters.team}
              onValueChange={(value) => handleFilterChange('team', value)}
            >
              <SelectTrigger className="w-full bg-background/50 border-border/50 hover:bg-background/80 transition-colors">
                <SelectValue placeholder="Select team" />
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

          <div className="space-y-2.5">
            <Label className="text-sm font-medium text-muted-foreground">Sort By</Label>
            <Select
              value={filters.sortBy}
              onValueChange={(value: 'price' | 'form' | 'points' | 'selected') => 
                handleFilterChange('sortBy', value)
              }
            >
              <SelectTrigger className="w-full bg-background/50 border-border/50 hover:bg-background/80 transition-colors">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Sort Options</SelectLabel>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2.5">
            <Label className="text-sm font-medium text-muted-foreground">Sort Order</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={filters.sortOrder === 'asc' ? 'default' : 'outline'}
                size="sm"
                className={cn(
                  "w-full transition-all",
                  filters.sortOrder === 'asc' 
                    ? "bg-primary hover:bg-primary/90" 
                    : "hover:bg-background/80"
                )}
                onClick={() => handleFilterChange('sortOrder', 'asc')}
              >
                Ascending
              </Button>
              <Button
                variant={filters.sortOrder === 'desc' ? 'default' : 'outline'}
                size="sm"
                className={cn(
                  "w-full transition-all",
                  filters.sortOrder === 'desc' 
                    ? "bg-primary hover:bg-primary/90" 
                    : "hover:bg-background/80"
                )}
                onClick={() => handleFilterChange('sortOrder', 'desc')}
              >
                Descending
              </Button>
            </div>
          </div>
        </div>

        {/* Price Range Slider */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Label className="text-sm font-medium text-muted-foreground">Price Range</Label>
            <Badge variant="secondary" className="bg-background/50">
              £{filters.minPrice.toFixed(1)}m - £{filters.maxPrice.toFixed(1)}m
            </Badge>
          </div>
          <Slider
            min={0}
            max={15}
            step={0.1}
            value={[filters.minPrice, filters.maxPrice]}
            onValueChange={([min, max]) => {
              handleFilterChange('minPrice', min);
              handleFilterChange('maxPrice', max);
            }}
            className="[&_[role=slider]]:bg-primary [&_[role=slider]]:border-primary"
          />
        </div>

        {/* Form Slider */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Label className="text-sm font-medium text-muted-foreground">Minimum Form</Label>
            <Badge variant="secondary" className="bg-background/50">
              {filters.minForm.toFixed(1)}
            </Badge>
          </div>
          <Slider
            min={0}
            max={10}
            step={0.1}
            value={[filters.minForm]}
            onValueChange={([value]) => handleFilterChange('minForm', value)}
            className="[&_[role=slider]]:bg-primary [&_[role=slider]]:border-primary"
          />
        </div>
      </div>
    </Card>
  );
}
