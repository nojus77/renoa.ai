import { formatInTimeZone, utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';
import { format as formatDate } from 'date-fns';

/**
 * Format a date in the provider's timezone
 * @param date - The date to format (Date object or ISO string)
 * @param formatStr - The format string (e.g., 'h:mm a', 'MMM d, yyyy')
 * @param timezone - IANA timezone (e.g., 'America/Chicago')
 * @returns Formatted date string in the specified timezone
 */
export function formatInProviderTz(
  date: Date | string,
  formatStr: string,
  timezone: string = 'America/Chicago'
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return formatInTimeZone(dateObj, timezone, formatStr);
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
  return utcToZonedTime(dateObj, timezone);
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
  return zonedTimeToUtc(date, timezone);
}

/**
 * Get current time in provider's timezone
 * @param timezone - IANA timezone (e.g., 'America/Chicago')
 * @returns Current date/time in provider's timezone
 */
export function nowInProviderTz(timezone: string = 'America/Chicago'): Date {
  return utcToZonedTime(new Date(), timezone);
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
