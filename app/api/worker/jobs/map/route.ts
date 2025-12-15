import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startOfToday, endOfDay, addDays } from 'date-fns';

export const dynamic = 'force-dynamic';

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

    // Transform jobs for map view - prioritize job coordinates over customer coordinates
    const jobsWithCoords = jobs.map((job) => {
      // Job location takes priority, fall back to customer location
      const lat = job.latitude ?? job.customer?.latitude ?? null;
      const lng = job.longitude ?? job.customer?.longitude ?? null;
      const address = job.address || job.customer?.address || '';

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
    });

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
