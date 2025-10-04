// ============================================================================
// TIME UTILITIES
// ============================================================================
// Consistent time formatting across the app with 12-hour format
// ============================================================================

import { format, formatDistanceToNow, formatDistanceStrict, differenceInSeconds, isFuture, isWithinInterval } from 'date-fns';

// 12-hour time format
export const TIME_FORMAT_12H = 'h:mm a'; // 2:30 PM
export const DATE_FORMAT = 'E, MMM d'; // Mon, Jan 15
export const DATETIME_FORMAT_12H = 'E, MMM d @ h:mm a'; // Mon, Jan 15 @ 2:30 PM
export const FULL_DATETIME_FORMAT_12H = 'EEEE, MMMM d, yyyy @ h:mm a'; // Monday, January 15, 2024 @ 2:30 PM

// Format time in 12-hour format
export function formatTime12h(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, TIME_FORMAT_12H);
}

// Format date in readable format
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, DATE_FORMAT);
}

// Format date and time in 12-hour format
export function formatDateTime12h(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, DATETIME_FORMAT_12H);
}

// Format full date and time
export function formatFullDateTime12h(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, FULL_DATETIME_FORMAT_12H);
}

// Format session time range (start - end)
export function formatSessionTimeRange(startTime: Date | string, endTime: Date | string): string {
  const start = typeof startTime === 'string' ? new Date(startTime) : startTime;
  const end = typeof endTime === 'string' ? new Date(endTime) : endTime;
  
  const startFormatted = format(start, DATETIME_FORMAT_12H);
  const endTimeFormatted = format(end, TIME_FORMAT_12H);
  const duration = formatDistanceStrict(end, start);
  
  return `${startFormatted} - ${endTimeFormatted} (${duration})`;
}

// Format time remaining in session
export function formatTimeRemaining(endTime: Date | string): string | null {
  const end = typeof endTime === 'string' ? new Date(endTime) : endTime;
  const now = new Date();
  const secondsLeft = differenceInSeconds(end, now);
  
  if (secondsLeft <= 0) {
    return '00:00';
  }
  
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// Format relative time (e.g., "2 minutes ago", "in 5 minutes")
export function formatRelativeTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return formatDistanceToNow(dateObj, { addSuffix: true });
}

// Check if session is currently active
export function isSessionActive(startTime: Date | string, endTime: Date | string): boolean {
  const start = typeof startTime === 'string' ? new Date(startTime) : startTime;
  const end = typeof endTime === 'string' ? new Date(endTime) : endTime;
  const now = new Date();
  
  return isWithinInterval(now, { start, end });
}

// Check if session is upcoming
export function isSessionUpcoming(startTime: Date | string): boolean {
  const start = typeof startTime === 'string' ? new Date(startTime) : startTime;
  return isFuture(start);
}

// Get session status
export function getSessionStatus(startTime: Date | string, endTime: Date | string): 'upcoming' | 'active' | 'ended' {
  const start = typeof startTime === 'string' ? new Date(startTime) : startTime;
  const end = typeof endTime === 'string' ? new Date(endTime) : endTime;
  const now = new Date();
  
  if (now < start) return 'upcoming';
  if (now >= start && now <= end) return 'active';
  return 'ended';
}

// Format session status with time info
export function formatSessionStatus(startTime: Date | string, endTime: Date | string): string {
  const status = getSessionStatus(startTime, endTime);
  const start = typeof startTime === 'string' ? new Date(startTime) : startTime;
  const end = typeof endTime === 'string' ? new Date(endTime) : endTime;
  
  switch (status) {
    case 'upcoming':
      return `Starts ${formatRelativeTime(start)}`;
    case 'active':
      const remaining = formatTimeRemaining(end);
      return remaining ? `${remaining} remaining` : 'Ending soon';
    case 'ended':
      return `Ended ${formatRelativeTime(end)}`;
    default:
      return 'Unknown status';
  }
}