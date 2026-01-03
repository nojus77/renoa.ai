/**
 * Backfill script to geocode job addresses that don't have coordinates
 * Run with: npx ts-node scripts/backfill-job-coordinates.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Support both env variable names
const GOOGLE_MAPS_API = process.env.GOOGLE_MAPS_API || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  if (!address || !GOOGLE_MAPS_API) {
    return null;
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        address
      )}&key=${GOOGLE_MAPS_API}`
    );
    const data = await response.json();

    if (data.status === 'OK' && data.results?.[0]?.geometry?.location) {
      return {
        lat: data.results[0].geometry.location.lat,
        lng: data.results[0].geometry.location.lng,
      };
    }

    if (data.status === 'ZERO_RESULTS') {
      console.warn(`No geocoding results for address: ${address}`);
    } else if (data.status !== 'OK') {
      console.error(`Geocoding API error: ${data.status}`, data.error_message);
    }
  } catch (error) {
    console.error('Geocoding error:', error);
  }

  return null;
}

async function backfillJobCoordinates() {
  console.log('Starting job coordinates backfill...');

  if (!GOOGLE_MAPS_API) {
    console.error('ERROR: GOOGLE_MAPS_API or NEXT_PUBLIC_GOOGLE_MAPS_API_KEY environment variable is required');
    process.exit(1);
  }

  // Find all jobs without coordinates
  const jobsWithoutCoords = await prisma.job.findMany({
    where: {
      AND: [
        { latitude: null },
        { address: { not: '' } },
      ],
    },
    select: {
      id: true,
      address: true,
      customer: {
        select: {
          address: true,
          latitude: true,
          longitude: true,
        },
      },
    },
  });

  console.log(`Found ${jobsWithoutCoords.length} jobs without coordinates`);

  let updated = 0;
  let failed = 0;
  let skipped = 0;

  // Process in batches to avoid rate limiting
  const batchSize = 10;
  for (let i = 0; i < jobsWithoutCoords.length; i += batchSize) {
    const batch = jobsWithoutCoords.slice(i, i + batchSize);

    for (const job of batch) {
      // Try to use customer coordinates first if available
      if (job.customer?.latitude && job.customer?.longitude) {
        await prisma.job.update({
          where: { id: job.id },
          data: {
            latitude: job.customer.latitude,
            longitude: job.customer.longitude,
          },
        });
        console.log(`[${job.id.slice(-6)}] Used customer coordinates`);
        updated++;
        continue;
      }

      // Otherwise geocode the job address
      const addressToGeocode = job.address || job.customer?.address;
      if (!addressToGeocode) {
        console.log(`[${job.id.slice(-6)}] No address to geocode - skipping`);
        skipped++;
        continue;
      }

      const coords = await geocodeAddress(addressToGeocode);
      if (coords) {
        await prisma.job.update({
          where: { id: job.id },
          data: {
            latitude: coords.lat,
            longitude: coords.lng,
          },
        });
        console.log(`[${job.id.slice(-6)}] Geocoded: ${addressToGeocode.slice(0, 40)}...`);
        updated++;
      } else {
        console.log(`[${job.id.slice(-6)}] Failed to geocode: ${addressToGeocode.slice(0, 40)}...`);
        failed++;
      }
    }

    // Small delay between batches to avoid rate limiting
    if (i + batchSize < jobsWithoutCoords.length) {
      console.log(`Processed ${Math.min(i + batchSize, jobsWithoutCoords.length)} / ${jobsWithoutCoords.length} jobs...`);
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  console.log('\n=== Backfill Complete ===');
  console.log(`Updated: ${updated}`);
  console.log(`Failed: ${failed}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Total: ${jobsWithoutCoords.length}`);
}

backfillJobCoordinates()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
