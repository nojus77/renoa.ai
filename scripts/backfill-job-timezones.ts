/**
 * Backfill timezone for existing jobs
 *
 * For each job without timezone:
 * 1. If has address, lookup timezone via getTimezoneFromAddress()
 * 2. If no address or lookup fails, use provider.timeZone
 * 3. Rate limit 100ms between requests (Google API limit)
 *
 * Run with: npx ts-node scripts/backfill-job-timezones.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Inline the timezone lookup to avoid module resolution issues with ts-node
async function getTimezoneFromAddress(address: string): Promise<string | null> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    console.warn('[Timezone] Google Maps API key not configured');
    return null;
  }

  if (!address || address.trim().length < 5) {
    return null;
  }

  try {
    // Step 1: Geocode address to get lat/lng
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
    const geocodeRes = await fetch(geocodeUrl);

    if (!geocodeRes.ok) {
      return null;
    }

    const geocodeData = await geocodeRes.json();

    if (geocodeData.status !== 'OK' || !geocodeData.results?.[0]) {
      return null;
    }

    const { lat, lng } = geocodeData.results[0].geometry.location;

    // Step 2: Get timezone from lat/lng
    const timestamp = Math.floor(Date.now() / 1000);
    const timezoneUrl = `https://maps.googleapis.com/maps/api/timezone/json?location=${lat},${lng}&timestamp=${timestamp}&key=${apiKey}`;
    const timezoneRes = await fetch(timezoneUrl);

    if (!timezoneRes.ok) {
      return null;
    }

    const timezoneData = await timezoneRes.json();

    if (timezoneData.status !== 'OK' || !timezoneData.timeZoneId) {
      return null;
    }

    return timezoneData.timeZoneId;
  } catch (error) {
    return null;
  }
}

// Sleep utility for rate limiting
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('=== Job Timezone Backfill Script ===\n');

  // Get all jobs without timezone
  const jobsWithoutTimezone = await prisma.job.findMany({
    where: {
      timezone: null,
    },
    select: {
      id: true,
      address: true,
      providerId: true,
    },
  });

  console.log(`Found ${jobsWithoutTimezone.length} jobs without timezone\n`);

  if (jobsWithoutTimezone.length === 0) {
    console.log('No jobs to update. Exiting.');
    return;
  }

  // Cache provider timezones to reduce DB queries
  const providerTimezoneCache: Record<string, string> = {};

  let updated = 0;
  let skipped = 0;
  let addressLookups = 0;
  let providerFallbacks = 0;
  let errors = 0;

  for (let i = 0; i < jobsWithoutTimezone.length; i++) {
    const job = jobsWithoutTimezone[i];
    const progress = `[${i + 1}/${jobsWithoutTimezone.length}]`;

    try {
      let timezone: string | null = null;

      // Try to get timezone from address
      if (job.address && job.address.trim().length >= 5) {
        console.log(`${progress} Looking up timezone for job ${job.id.slice(0, 8)}... (${job.address.slice(0, 40)}...)`);
        timezone = await getTimezoneFromAddress(job.address);

        if (timezone) {
          addressLookups++;
          console.log(`  -> Found: ${timezone}`);
        } else {
          console.log(`  -> Address lookup failed, using provider fallback`);
        }

        // Rate limit: 100ms between Google API requests
        await sleep(100);
      }

      // Fallback to provider timezone
      if (!timezone) {
        // Check cache first
        if (!providerTimezoneCache[job.providerId]) {
          const provider = await prisma.provider.findUnique({
            where: { id: job.providerId },
            select: { timeZone: true },
          });
          providerTimezoneCache[job.providerId] = provider?.timeZone || 'America/Chicago';
        }
        timezone = providerTimezoneCache[job.providerId];
        providerFallbacks++;
        console.log(`${progress} Using provider timezone for job ${job.id.slice(0, 8)}...: ${timezone}`);
      }

      // Update the job
      await prisma.job.update({
        where: { id: job.id },
        data: { timezone },
      });

      updated++;
    } catch (error) {
      console.error(`${progress} Error updating job ${job.id}:`, error);
      errors++;
    }
  }

  console.log('\n=== Backfill Complete ===');
  console.log(`Total jobs processed: ${jobsWithoutTimezone.length}`);
  console.log(`Updated: ${updated}`);
  console.log(`  - From address lookup: ${addressLookups}`);
  console.log(`  - From provider fallback: ${providerFallbacks}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Errors: ${errors}`);
}

main()
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
