import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Season {
  id: string;
  name: string;
  startYear: number;
  endYear: number;
  isCurrent: boolean;
}

interface SeasonContextType {
  currentSeason: Season;
  availableSeasons: Season[];
  setCurrentSeason: (season: Season) => void;
  isLoading: boolean;
}

const SeasonContext = createContext<SeasonContextType | undefined>(undefined);

// Available FPL seasons - comprehensive list from 2016-2024
const AVAILABLE_SEASONS: Season[] = [
  {
    id: '2024-25',
    name: '2024-25',
    startYear: 2024,
    endYear: 2025,
    isCurrent: true
  },
  {
    id: '2023-24',
    name: '2023-24',
    startYear: 2023,
    endYear: 2024,
    isCurrent: false
  },
  {
    id: '2022-23',
    name: '2022-23',
    startYear: 2022,
    endYear: 2023,
    isCurrent: false
  },
  {
    id: '2021-22',
    name: '2021-22',
    startYear: 2021,
    endYear: 2022,
    isCurrent: false
  },
  {
    id: '2020-21',
    name: '2020-21',
    startYear: 2020,
    endYear: 2021,
    isCurrent: false
  },
  {
    id: '2019-20',
    name: '2019-20',
    startYear: 2019,
    endYear: 2020,
    isCurrent: false
  },
  {
    id: '2018-19',
    name: '2018-19',
    startYear: 2018,
    endYear: 2019,
    isCurrent: false
  },
  {
    id: '2017-18',
    name: '2017-18',
    startYear: 2017,
    endYear: 2018,
    isCurrent: false
  },
  {
    id: '2016-17',
    name: '2016-17',
    startYear: 2016,
    endYear: 2017,
    isCurrent: false
  }
];

export function SeasonProvider({ children }: { children: React.ReactNode }) {
  const [currentSeason, setCurrentSeasonState] = useState<Season>(
    () => {
      // Try to get saved season from localStorage
      const savedSeasonId = localStorage.getItem('fpl_selected_season');
      if (savedSeasonId) {
        const savedSeason = AVAILABLE_SEASONS.find(s => s.id === savedSeasonId);
        if (savedSeason) return savedSeason;
      }
      // Default to current season
      return AVAILABLE_SEASONS.find(s => s.isCurrent) || AVAILABLE_SEASONS[0];
    }
  );
  
  const [isLoading, setIsLoading] = useState(false);

  const setCurrentSeason = (season: Season) => {
    setIsLoading(true);
    setCurrentSeasonState(season);
    localStorage.setItem('fpl_selected_season', season.id);
    
    // Simulate loading state for better UX
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  };

  const value: SeasonContextType = {
    currentSeason,
    availableSeasons: AVAILABLE_SEASONS,
    setCurrentSeason,
    isLoading
  };

  return (
    <SeasonContext.Provider value={value}>
      {children}
    </SeasonContext.Provider>
  );
}

export function useSeason() {
  const context = useContext(SeasonContext);
  if (context === undefined) {
    throw new Error('useSeason must be used within a SeasonProvider');
  }
  return context;
}
