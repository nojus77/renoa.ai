import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startOfToday, endOfDay, addDays } from 'date-fns';

export const dynamic = 'force-dynamic';

// Simple geocode function
async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  const apiKey = process.env.GOOGLE_MAPS_API || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!address || !apiKey) return null;

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
    );
    const data = await response.json();

    if (data.results?.[0]?.geometry?.location) {
      return {
        lat: data.results[0].geometry.location.lat,
        lng: data.results[0].geometry.location.lng,
      };
    }
  } catch (error) {
    console.error('Geocoding error:', error);
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

    // Process jobs and geocode if needed
    const jobsWithCoords = await Promise.all(
      jobs.map(async (job) => {
        let lat = job.latitude ?? job.customer?.latitude ?? null;
        let lng = job.longitude ?? job.customer?.longitude ?? null;
        const address = job.address || job.customer?.address || '';

        // If no coordinates but have address, geocode it
        if ((!lat || !lng) && address) {
          const coords = await geocodeAddress(address);
          if (coords) {
            lat = coords.lat;
            lng = coords.lng;

            // Save coordinates to customer for future use (saves API calls)
            if (job.customer?.id && !job.customer.latitude) {
              await prisma.customer.update({
                where: { id: job.customer.id },
                data: { latitude: coords.lat, longitude: coords.lng },
              }).catch(() => {}); // Ignore errors
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

    return NextResponse.json({
      jobs: jobsWithCoords,
      total: jobs.length,
      withLocation: jobsWithCoords.filter((j) => j.latitude && j.longitude).length,
    });
  } catch (error) {
    console.error('Error fetching jobs for map:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}
