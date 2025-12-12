import { formatInTimeZone, toZonedTime, fromZonedTime } from 'date-fns-tz';
import { format as formatDate } from 'date-fns';

/**
 * Format a date that's already stored in the provider's timezone
 * NOTE: Our DB stores timestamps WITHOUT timezone (naive timestamps in Chicago time)
 * Prisma reads them as UTC, but they're actually Chicago local times
 * This function extracts the UTC time components and formats them as-is
 *
 * @param date - The date to format (Date object or ISO string)
 * @param formatStr - The format string (e.g., 'h:mm a', 'MMM d, yyyy')
 * @param timezone - IANA timezone (e.g., 'America/Chicago') - currently ignored
 * @returns Formatted date string treating the UTC components as local time
 */
export function formatInProviderTz(
  date: Date | string,
  formatStr: string,
  timezone: string = 'America/Chicago'
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  // Create a new Date by treating UTC components as local time
  // If DB has 17:00 (Chicago local stored as naive timestamp)
  // Prisma gives us 2025-12-12T17:00:00.000Z
  // We want to display "17:00" or "5:00 PM" (the UTC components as-is)
  const localDate = new Date(
    dateObj.getUTCFullYear(),
    dateObj.getUTCMonth(),
    dateObj.getUTCDate(),
    dateObj.getUTCHours(),
    dateObj.getUTCMinutes(),
    dateObj.getUTCSeconds(),
    dateObj.getUTCMilliseconds()
  );

  return formatDate(localDate, formatStr);
}

/**
 * Convert UTC date to provider's timezone
 * @param date - The UTC date to convert
 * @param timezone - IANA timezone (e.g., 'America/Chicago')
 * @returns Date object adjusted to provider's timezone
 */
export function toProviderTz(
  date: Date | string,
  timezone: string = 'America/Chicago'
): Date {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return toZonedTime(dateObj, timezone);
}

/**
 * Convert provider's local time to UTC
 * @param date - The local date in provider's timezone
 * @param timezone - IANA timezone (e.g., 'America/Chicago')
 * @returns Date object in UTC
 */
export function fromProviderTz(
  date: Date,
  timezone: string = 'America/Chicago'
): Date {
  return fromZonedTime(date, timezone);
}

/**
 * Get current time in provider's timezone
 * @param timezone - IANA timezone (e.g., 'America/Chicago')
 * @returns Current date/time in provider's timezone
 */
export function nowInProviderTz(timezone: string = 'America/Chicago'): Date {
  return toZonedTime(new Date(), timezone);
}

/**
 * Get timezone offset string (e.g., 'CST', 'EST')
 * @param date - The date to check
 * @param timezone - IANA timezone
 * @returns Timezone abbreviation
 */
export function getTimezoneAbbr(
  date: Date = new Date(),
  timezone: string = 'America/Chicago'
): string {
  return formatInTimeZone(date, timezone, 'zzz');
}
