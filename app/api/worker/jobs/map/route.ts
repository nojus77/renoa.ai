import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startOfToday, endOfDay, addDays } from 'date-fns';

export const dynamic = 'force-dynamic';

// Simple geocode function with debug logging
async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  // Use server-side key (GOOGLE_MAPS_API) or fall back to client key
  const apiKey = process.env.GOOGLE_MAPS_API || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  console.log('[Geocode] Address:', address);
  console.log('[Geocode] API Key exists:', !!apiKey);

  if (!address || !apiKey) {
    console.log('[Geocode] Missing address or API key');
    return null;
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
    console.log('[Geocode] URL:', url.replace(apiKey, 'API_KEY_HIDDEN'));

    const response = await fetch(url);
    const data = await response.json();

    console.log('[Geocode] Response status:', data.status);
    console.log('[Geocode] Results count:', data.results?.length || 0);

    if (data.status === 'OK' && data.results?.[0]?.geometry?.location) {
      const { lat, lng } = data.results[0].geometry.location;
      console.log('[Geocode] Got coordinates:', lat, lng);
      return { lat, lng };
    } else {
      console.log('[Geocode] Failed:', data.status, data.error_message || '');
    }
  } catch (error) {
    console.error('[Geocode] Error:', error);
  }

  return null;
}

/**
 * GET /api/worker/jobs/map
 * Get jobs with location info for map view
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const filter = searchParams.get('filter') || 'today';

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Build date filter based on startTime
    const today = startOfToday();
    let dateFilter: { gte?: Date; lte?: Date } = {};

    if (filter === 'today') {
      dateFilter = {
        gte: today,
        lte: endOfDay(today),
      };
    } else if (filter === 'week') {
      dateFilter = {
        gte: today,
        lte: endOfDay(addDays(today, 7)),
      };
    } else {
      // 'all' - show upcoming jobs (next 30 days)
      dateFilter = {
        gte: today,
        lte: endOfDay(addDays(today, 30)),
      };
    }

    const jobs = await prisma.job.findMany({
      where: {
        assignedUserIds: { has: userId },
        status: { notIn: ['cancelled'] },
        startTime: dateFilter,
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            address: true,
            latitude: true,
            longitude: true,
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    console.log('[Map API] Found jobs:', jobs.length);
    jobs.forEach(job => {
      console.log('[Map API] Job:', job.id,
        'Address:', job.address || job.customer?.address || 'NONE',
        'Has coords:', !!(job.latitude || job.customer?.latitude));
    });

    // Process jobs and geocode if needed
    const jobsWithCoords = await Promise.all(
      jobs.map(async (job) => {
        let lat = job.latitude ?? job.customer?.latitude ?? null;
        let lng = job.longitude ?? job.customer?.longitude ?? null;
        const address = job.address || job.customer?.address || '';

        // If no coordinates but have address, geocode it
        if ((!lat || !lng) && address) {
          console.log('[Map API] Need to geocode job:', job.id);
          const coords = await geocodeAddress(address);
          if (coords) {
            lat = coords.lat;
            lng = coords.lng;

            // Save coordinates to customer for future use (saves API calls)
            if (job.customer?.id) {
              try {
                await prisma.customer.update({
                  where: { id: job.customer.id },
                  data: { latitude: coords.lat, longitude: coords.lng },
                });
                console.log('[Map API] Saved coords to customer:', job.customer.id);
              } catch (e) {
                console.log('[Map API] Failed to save coords:', e);
              }
            }
          }
        }

        return {
          id: job.id,
          serviceType: job.serviceType,
          status: job.status,
          scheduledDate: job.startTime?.toISOString() || '',
          startTime: job.startTime?.toISOString() || '',
          endTime: job.endTime?.toISOString() || '',
          address,
          latitude: lat,
          longitude: lng,
          customer: {
            name: job.customer?.name || 'Unknown Customer',
            phone: job.customer?.phone || '',
            address: job.customer?.address || null,
          },
        };
      })
    );

    const withLocation = jobsWithCoords.filter((j) => j.latitude && j.longitude);
    console.log('[Map API] Jobs with location:', withLocation.length, 'of', jobs.length);

    return NextResponse.json({
      jobs: jobsWithCoords,
      total: jobs.length,
      withLocation: withLocation.length,
    });
  } catch (error) {
    console.error('[Map API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}
