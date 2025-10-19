// Type definitions for admin service to fix implicit any errors

export interface DailyDataEntry {
  [key: string]: number;
}

export interface SessionActivityEntry {
  [key: string]: {
    sessions: number;
    participants: number;
  };
}

export interface CategoryCount {
  [key: string]: number;
}

export interface EngagementLevel {
  [key: string]: number;
}

// Generic types for database results
export type DatabaseUser = any;
export type DatabaseTopic = any;
export type DatabaseMessage = any;
export type DatabaseRating = any;
export type DatabaseDevice = any;
export type DatabaseRow = any;