import { formatInTimeZone, toZonedTime, fromZonedTime } from 'date-fns-tz';
import { format as formatDate, isSameDay } from 'date-fns';

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

// ============================================================================
// JOB-SPECIFIC TIMEZONE UTILITIES
// These functions handle per-job timezone with provider timezone fallback
// ============================================================================

/**
 * Get effective timezone for a job (job.timezone with provider fallback)
 * @param jobTimezone - The job's stored timezone (may be null)
 * @param providerTimezone - The provider's default timezone
 * @returns IANA timezone string
 */
export function getEffectiveTimezone(
  jobTimezone: string | null | undefined,
  providerTimezone: string
): string {
  return jobTimezone || providerTimezone || 'America/Chicago';
}

/**
 * Format a job's time using its timezone (with provider fallback)
 * @param date - The date to format
 * @param jobTimezone - The job's stored timezone (may be null)
 * @param providerTimezone - The provider's default timezone for fallback
 * @param formatStr - The format string (e.g., 'h:mm a', 'MMM d, yyyy')
 * @returns Formatted date string in the job's timezone
 */
export function formatJobTime(
  date: Date | string,
  jobTimezone: string | null | undefined,
  providerTimezone: string,
  formatStr: string
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const tz = getEffectiveTimezone(jobTimezone, providerTimezone);
  return formatInTimeZone(dateObj, tz, formatStr);
}

/**
 * Format a job's time with timezone abbreviation suffix
 * @param date - The date to format
 * @param jobTimezone - The job's stored timezone
 * @param providerTimezone - The provider's default timezone for fallback
 * @returns Formatted time with zone, e.g., "9:00 AM CST"
 */
export function formatJobTimeWithZone(
  date: Date | string,
  jobTimezone: string | null | undefined,
  providerTimezone: string
): string {
  const tz = getEffectiveTimezone(jobTimezone, providerTimezone);
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return formatInTimeZone(dateObj, tz, 'h:mm a zzz');
}

/**
 * Check if a job is scheduled for today in its own timezone
 * @param jobDate - The job's scheduled date
 * @param jobTimezone - The job's stored timezone
 * @param providerTimezone - The provider's default timezone for fallback
 * @returns true if the job is today in the job's timezone
 */
export function isJobToday(
  jobDate: Date | string,
  jobTimezone: string | null | undefined,
  providerTimezone: string
): boolean {
  const tz = getEffectiveTimezone(jobTimezone, providerTimezone);
  const jobDateObj = typeof jobDate === 'string' ? new Date(jobDate) : jobDate;

  // Get job date in job's timezone
  const jobInTz = toZonedTime(jobDateObj, tz);
  // Get current time in job's timezone
  const nowInTz = toZonedTime(new Date(), tz);

  return isSameDay(jobInTz, nowInTz);
}

/**
 * Get start and end of day boundaries for a job's timezone
 * Useful for querying "today's jobs" across multiple timezones
 * @param jobTimezone - The job's stored timezone
 * @param providerTimezone - The provider's default timezone for fallback
 * @returns { startOfDay: Date, endOfDay: Date } in UTC
 */
export function getJobDayBoundaries(
  jobTimezone: string | null | undefined,
  providerTimezone: string
): { startOfDay: Date; endOfDay: Date } {
  const tz = getEffectiveTimezone(jobTimezone, providerTimezone);
  const nowInTz = toZonedTime(new Date(), tz);

  // Create start of day in the job's timezone
  const startLocal = new Date(
    nowInTz.getFullYear(),
    nowInTz.getMonth(),
    nowInTz.getDate(),
    0, 0, 0, 0
  );

  // Create end of day in the job's timezone
  const endLocal = new Date(
    nowInTz.getFullYear(),
    nowInTz.getMonth(),
    nowInTz.getDate(),
    23, 59, 59, 999
  );

  // Convert back to UTC for database queries
  return {
    startOfDay: fromZonedTime(startLocal, tz),
    endOfDay: fromZonedTime(endLocal, tz),
  };
}

/**
 * Get the widest possible "today" window across all US timezones
 * This is useful for batch queries when we need to fetch all jobs
 * that might be "today" in any timezone
 * @returns { start: Date, end: Date } UTC boundaries covering all US timezones' "today"
 */
export function getWidestTodayWindow(): { start: Date; end: Date } {
  // US timezones range from UTC-10 (Hawaii) to UTC-4 (Eastern DST)
  // To get all jobs that are "today" in any US timezone:
  // Start: midnight in the earliest timezone (Hawaii = UTC-10)
  // End: end of day in the latest timezone (Eastern = UTC-4 or UTC-5)

  const now = new Date();

  // Get today in Hawaii (earliest US timezone)
  const hawaiiNow = toZonedTime(now, 'Pacific/Honolulu');
  const hawaiiStart = new Date(
    hawaiiNow.getFullYear(),
    hawaiiNow.getMonth(),
    hawaiiNow.getDate(),
    0, 0, 0, 0
  );

  // Get today in Eastern (latest US timezone)
  const easternNow = toZonedTime(now, 'America/New_York');
  const easternEnd = new Date(
    easternNow.getFullYear(),
    easternNow.getMonth(),
    easternNow.getDate(),
    23, 59, 59, 999
  );

  return {
    start: fromZonedTime(hawaiiStart, 'Pacific/Honolulu'),
    end: fromZonedTime(easternEnd, 'America/New_York'),
  };
}
