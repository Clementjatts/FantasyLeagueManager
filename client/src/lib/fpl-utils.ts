import { Player } from "../types/fpl";

// Form weights for recent gameweeks (most recent first)
const FORM_WEIGHTS = [0.4, 0.3, 0.2, 0.1];

// Calculate weighted moving average of recent points
const calculateMovingAverage = (values: number[], window: number): number => {
  if (!values?.length) return 0;
  const relevantValues = values.slice(-window);
  return relevantValues.reduce((sum, val) => sum + val, 0) / relevantValues.length;
};

// Calculate player's form using weighted recent performances
const calculatePlayerForm = (points: number[]): number => {
  if (!points?.length) return 0;
  const recentPoints = points.slice(-FORM_WEIGHTS.length);
  return recentPoints.reduce((form, points, index) => 
    form + (points * (FORM_WEIGHTS[index] || 0)), 0);
};

// Calculate fixture difficulty considering home/away advantage
const calculateFixtureDifficulty = (fixture: any, isHome: boolean): number => {
  const homeFactor = isHome ? 0.9 : 1.1; // Home advantage
  return (fixture.difficulty || 3) * homeFactor;
};

// Calculate prediction confidence
const calculateConfidence = (player: Player, recentMinutes: number[]): number => {
  const hasEnoughHistory = parseFloat(player.points_per_game) > 0;
  const hasConsistentMinutes = calculateMovingAverage(recentMinutes, 3) > 60;
  const hasGoodForm = parseFloat(player.form) > 5;

  let confidence = 0.5; // Base confidence
  if (hasEnoughHistory) confidence += 0.2;
  if (hasConsistentMinutes) confidence += 0.2;
  if (hasGoodForm) confidence += 0.1;

  return Math.min(confidence, 1);
};

// Get next N fixtures for a team, sorted by gameweek
export const getNextFixtures = (teamId: number, fixtures: any[], count: number = 3): any[] => {
  const now = new Date();
  
  return fixtures
    .filter(f => 
      // Filter future fixtures
      new Date(f.kickoff_time) > now &&
      // Filter for team's fixtures
      (f.team_h === teamId || f.team_a === teamId)
    )
    .sort((a, b) => 
      // Sort by gameweek first, then by kickoff time
      a.event !== b.event 
        ? a.event - b.event
        : new Date(a.kickoff_time).getTime() - new Date(b.kickoff_time).getTime()
    )
    .slice(0, count);
};

export const predictPlayerPoints = (player: Player, fixtures: any[]) => {
  // Take only the next 3 fixtures
  const nextFixtures = fixtures.slice(0, 3);
  if (!nextFixtures.length) return 0;

  // Get recent performance data
  const recentPoints = [
    player.event_points || 0,
    parseFloat(player.points_per_game) * 3 || 0,
    parseFloat(player.points_per_game) * 2 || 0,
    parseFloat(player.points_per_game) * 1 || 0
  ];

  // Calculate key metrics
  const recentPointsAvg = calculateMovingAverage(recentPoints, 4);
  const form = calculatePlayerForm(recentPoints);
  const minutesPlayed = player.minutes || 0;
  const minutesFactor = minutesPlayed > 450 ? 1.1 :  // Over 5 full games
                       minutesPlayed > 270 ? 1.0 :    // Over 3 full games
                       minutesPlayed > 90 ? 0.9 :     // At least 1 full game
                       0.7;                           // Bench/irregular player

  // Calculate average fixture difficulty
  const avgFixtureDifficulty = nextFixtures.reduce((total, fixture) => {
    const isHome = fixture.team_h === player.team;
    return total + calculateFixtureDifficulty(fixture, isHome);
  }, 0) / nextFixtures.length;

  // Weighted prediction calculation
  const baselinePoints = recentPointsAvg * 0.4;
  const formFactor = form * 0.3;
  const minutesImpact = (minutesFactor - 0.7) * 2; // Scale to roughly -0.6 to +0.8
  const difficultyImpact = ((5 - avgFixtureDifficulty) / 5) * 2; // Scale to 0-2 range

  const predictedPoints = (
    baselinePoints +
    formFactor +
    minutesImpact +
    difficultyImpact
  );

  // Get confidence in prediction
  const confidence = calculateConfidence(player, [minutesPlayed]);

  // Apply confidence factor and round to 1 decimal
  const finalPrediction = predictedPoints * (0.8 + (confidence * 0.2));
  return Math.round(finalPrediction * 10) / 10;
};
