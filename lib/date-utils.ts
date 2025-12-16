import { startOfDay, endOfDay, parseISO } from 'date-fns';

/**
 * Get consistent date range for database queries
 * Use this in all APIs to ensure consistent date filtering
 */
export function getDateRange(dateInput: string | Date) {
  const date = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
  return {
    start: startOfDay(date),
    end: endOfDay(date),
  };
}

/**
 * Check if a date falls within a day
 */
export function isWithinDay(checkDate: Date, targetDate: Date | string): boolean {
  const { start, end } = getDateRange(targetDate);
  return checkDate >= start && checkDate <= end;
}

/**
 * Format date for display consistently
 */
export function formatDateForDisplay(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format time for display
 */
export function formatTimeForDisplay(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}
