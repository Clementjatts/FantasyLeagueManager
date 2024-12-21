import type { Team, ChipRecommendations } from "../types/fpl";

export function getValueBasedRecommendations(team: Team): ChipRecommendations {
  const recommendations: ChipRecommendations = {
    wildcard: [],
    freehit: [],
    bboost: [],
    "3xc": [],
  };

  const recentValueChange = team.stats.value - team.last_deadline_value;
  const valueChangePercent = (recentValueChange / team.last_deadline_value) * 100;
  
  if (recentValueChange < -3) {
    recommendations.wildcard.push(
      `Team value has dropped £${(-recentValueChange/10).toFixed(1)}m (${valueChangePercent.toFixed(1)}%) - Consider Wildcard to recover value`
    );
  }

  return recommendations;
}

export function getPerformanceRecommendations(team: Team, avgPoints: number): ChipRecommendations {
  const recommendations: ChipRecommendations = {
    wildcard: [],
    freehit: [],
    bboost: [],
    "3xc": [],
  };

  const recentPoints = team.points_history
    .slice(-3)
    .reduce((acc: number, gw: any) => acc + gw.points, 0) / 3;
  const recentAverage = team.points_history
    .slice(-5)
    .reduce((acc: number, gw: any) => acc + gw.points, 0) / 5;
  const pointsTrend = recentPoints - recentAverage;
  const pointsPercentile = (recentPoints / avgPoints) * 100;

  if (pointsPercentile < 80) {
    recommendations.wildcard.push(
      `Recent performance (${Math.round(recentPoints)} pts) is in bottom ${Math.round(100-pointsPercentile)}% - Team restructure recommended`
    );
    if (pointsTrend < -5) {
      recommendations.wildcard.push(
        `Form declining by ${Math.abs(Math.round(pointsTrend))} points vs 5-week average - Consider Wildcard reset`
      );
    }
  }

  return recommendations;
}

export function getBenchRecommendations(team: Team, avgPoints: number): ChipRecommendations {
  const recommendations: ChipRecommendations = {
    wildcard: [],
    freehit: [],
    bboost: [],
    "3xc": [],
  };

  const benchStats = {
    points: team.stats.points_on_bench,
    recentPoints: team.points_history
      .slice(-4)
      .reduce((acc: number, gw: any, index: number) => {
        const weight = 1 - (index * 0.1);
        return acc + ((gw.points_on_bench || 0) * weight);
      }, 0) / 3.4,
    previousPoints: team.points_history
      .slice(-8, -4)
      .reduce((acc: number, gw: any) => acc + (gw.points_on_bench || 0), 0) / 4
  };
  
  const benchTrend = benchStats.recentPoints - benchStats.previousPoints;
  const benchStrength = (benchStats.recentPoints / avgPoints) * 100;
  
  if (benchStats.points > 20 && benchStrength > 25) {
    recommendations.bboost.push(
      `Strong bench performing at ${benchStrength.toFixed(1)}% of average score - Consider Bench Boost`
    );
    if (benchTrend > 5) {
      recommendations.bboost.push(
        `Bench form improving by ${Math.round(benchTrend)} points - Optimal timing for Bench Boost`
      );
    }
  }

  return recommendations;
}

export function getRankBasedRecommendations(team: Team): ChipRecommendations {
  const recommendations: ChipRecommendations = {
    wildcard: [],
    freehit: [],
    bboost: [],
    "3xc": [],
  };

  const overallRank = team.summary_overall_rank;
  const rankPercentile = (overallRank / 10000000) * 100;
  const rankTrend = team.points_history
    .slice(-3)
    .reduce((acc: number, gw: any) => acc + (gw.rank || 0), 0) / 3 - overallRank;
  const rankMomentum = (rankTrend / overallRank) * 100;

  if (rankPercentile > 90) {
    recommendations.wildcard.push(
      `Rank in bottom ${Math.round(100-rankPercentile)}% - Aggressive restructure needed`
    );
    if (rankMomentum < -10) {
      recommendations.wildcard.push(
        `Rank improving at ${Math.abs(Math.round(rankMomentum))}% rate - Capitalize with Wildcard`
      );
    }
  } else if (rankPercentile < 10) {
    recommendations.freehit.push(
      `Top ${Math.round(rankPercentile)}% rank - Use Free Hit strategically to maintain position`
    );
    if (rankMomentum > 5) {
      recommendations.wildcard.push(
        `Rank dropping at ${Math.round(rankMomentum)}% rate - Consider defensive Wildcard`
      );
    }
  }

  return recommendations;
}

export function mergeRecommendations(...recommendations: ChipRecommendations[]): ChipRecommendations {
  return recommendations.reduce((merged, current) => {
    Object.entries(current).forEach(([chip, recs]) => {
      if (!merged[chip as keyof ChipRecommendations]) {
        merged[chip as keyof ChipRecommendations] = [];
      }
      merged[chip as keyof ChipRecommendations].push(...recs);
    });
    return merged;
  }, {} as ChipRecommendations);
}

export function getTeamSpecificRecommendations(team: Team, currentGameweek: number): ChipRecommendations {
  const avgPoints = team.stats.average_entry_score;

  return mergeRecommendations(
    getValueBasedRecommendations(team),
    getPerformanceRecommendations(team, avgPoints),
    getBenchRecommendations(team, avgPoints),
    getRankBasedRecommendations(team)
  );
}
