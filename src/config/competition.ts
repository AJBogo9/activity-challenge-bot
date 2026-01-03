/**
 * Competition configuration
 * Update these dates for each competition period
 */
export interface CompetitionConfig {
  startDate: Date;
  endDate: Date;
  name: string;
  description?: string;
}

// Current active competition
export const CURRENT_COMPETITION: CompetitionConfig = {
  name: "Winter 2025-2026 Activity Challenge",
  startDate: new Date("2025-12-24"),
  endDate: new Date("2026-03-31"),
  description: "Q1 2026 fitness challenge"
};

// Validate competition dates on startup
const validateCompetitionDates = () => {
  if (isNaN(CURRENT_COMPETITION.startDate.getTime())) {
    throw new Error(
      `Invalid competition start date: ${CURRENT_COMPETITION.startDate}. ` +
      `Please check the date format in src/config/competition.ts`
    );
  }
  
  if (isNaN(CURRENT_COMPETITION.endDate.getTime())) {
    throw new Error(
      `Invalid competition end date: ${CURRENT_COMPETITION.endDate}. ` +
      `Please check the date format in src/config/competition.ts`
    );
  }
  
  if (CURRENT_COMPETITION.startDate >= CURRENT_COMPETITION.endDate) {
    throw new Error(
      `Competition start date (${CURRENT_COMPETITION.startDate.toISOString()}) ` +
      `must be before end date (${CURRENT_COMPETITION.endDate.toISOString()}). ` +
      `Please fix the dates in src/config/competition.ts`
    );
  }
};

// Run validation immediately when this module is imported
validateCompetitionDates();

// Helper functions
export const isCompetitionActive = (date: Date = new Date()): boolean => {
  return date >= CURRENT_COMPETITION.startDate && date <= CURRENT_COMPETITION.endDate;
};

export const getDaysRemaining = (date: Date = new Date()): number => {
  if (date > CURRENT_COMPETITION.endDate) return 0;
  const diff = CURRENT_COMPETITION.endDate.getTime() - date.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export const getDaysElapsed = (date: Date = new Date()): number => {
  if (date < CURRENT_COMPETITION.startDate) return 0;
  const diff = date.getTime() - CURRENT_COMPETITION.startDate.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

export const getCompetitionProgress = (date: Date = new Date()): number => {
  if (date < CURRENT_COMPETITION.startDate) return 0;
  if (date > CURRENT_COMPETITION.endDate) return 100;
  
  const total = CURRENT_COMPETITION.endDate.getTime() - CURRENT_COMPETITION.startDate.getTime();
  const elapsed = date.getTime() - CURRENT_COMPETITION.startDate.getTime();
  return Math.round((elapsed / total) * 100);
};