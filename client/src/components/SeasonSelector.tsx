import React from 'react';
import { Calendar, ChevronDown, Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useSeason } from '@/contexts/SeasonContext';
import { cn } from '@/lib/utils';

interface SeasonSelectorProps {
  className?: string;
  showLabel?: boolean;
  variant?: 'default' | 'compact';
}

export function SeasonSelector({ 
  className, 
  showLabel = true, 
  variant = 'default' 
}: SeasonSelectorProps) {
  const { currentSeason, availableSeasons, setCurrentSeason, isLoading } = useSeason();

  const handleSeasonChange = (seasonId: string) => {
    const selectedSeason = availableSeasons.find(s => s.id === seasonId);
    if (selectedSeason) {
      setCurrentSeason(selectedSeason);
    }
  };

  const isCompact = variant === 'compact';

  return (
    <div className={cn(
      "flex items-center gap-2",
      isCompact ? "gap-1" : "gap-2",
      className
    )}>
      {showLabel && (
        <div className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
          <Calendar className="h-4 w-4" />
          {!isCompact && <span>Season:</span>}
        </div>
      )}
      
      <div className="relative">
        <Select
          value={currentSeason.id}
          onValueChange={handleSeasonChange}
          disabled={isLoading}
        >
          <SelectTrigger 
            className={cn(
              "bg-background border-input hover:bg-accent hover:text-accent-foreground transition-colors",
              isCompact ? "w-[100px] h-8 text-xs" : "w-[160px]",
              isLoading && "opacity-50"
            )}
          >
            <div className="flex items-center gap-2">
              {isLoading && <Loader2 className="h-3 w-3 animate-spin" />}
              <SelectValue>
                <div className="flex items-center gap-1 whitespace-nowrap">
                  <span>{currentSeason.name}</span>
                  {currentSeason.isCurrent && (
                    <Badge 
                      variant="secondary" 
                      className={cn(
                        "text-xs px-1 py-0 flex-shrink-0",
                        isCompact && "hidden"
                      )}
                    >
                      Current
                    </Badge>
                  )}
                </div>
              </SelectValue>
            </div>
          </SelectTrigger>
          
          <SelectContent>
            {availableSeasons.map((season) => (
              <SelectItem 
                key={season.id} 
                value={season.id}
                className="cursor-pointer"
              >
                <div className="flex items-center justify-between w-full whitespace-nowrap">
                  <span>{season.name}</span>
                  {season.isCurrent && (
                    <Badge variant="secondary" className="ml-2 text-xs flex-shrink-0">
                      Current
                    </Badge>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
