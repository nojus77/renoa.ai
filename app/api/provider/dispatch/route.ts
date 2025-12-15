import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay, parseISO } from 'date-fns';

export const dynamic = 'force-dynamic';

/**
 * GET /api/provider/dispatch
 * Get all jobs and workers for dispatch view on a given date
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('providerId');
    const dateStr = searchParams.get('date'); // YYYY-MM-DD format

    if (!providerId) {
      return NextResponse.json(
        { error: 'Provider ID is required' },
        { status: 400 }
      );
    }

    // Parse date or use today
    const targetDate = dateStr ? parseISO(dateStr) : new Date();
    const dayStart = startOfDay(targetDate);
    const dayEnd = endOfDay(targetDate);

    console.log('[Dispatch API] Fetching jobs for:', {
      providerId,
      date: dateStr,
      dayStart: dayStart.toISOString(),
      dayEnd: dayEnd.toISOString(),
    });

    // Fetch all jobs for the day
    const jobs = await prisma.job.findMany({
      where: {
        providerId,
        startTime: {
          gte: dayStart,
          lte: dayEnd,
        },
        status: { notIn: ['cancelled'] },
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
        assignedCrew: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
      orderBy: [
        { routeOrder: 'asc' },
        { startTime: 'asc' },
      ],
    });

    // Fetch all field workers
    const workers = await prisma.providerUser.findMany({
      where: {
        providerId,
        role: 'field',
        status: 'active',
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        color: true,
        homeLatitude: true,
        homeLongitude: true,
      },
      orderBy: { firstName: 'asc' },
    });

    console.log('[Dispatch API] Total jobs found:', jobs.length);
    console.log('[Dispatch API] Jobs:', jobs.map(j => ({
      id: j.id,
      service: j.serviceType,
      assignedUserIds: j.assignedUserIds,
      startTime: j.startTime,
    })));

    // Process jobs - separate assigned from unassigned
    const assignedJobs: typeof jobs = [];
    const unassignedJobs: typeof jobs = [];

    for (const job of jobs) {
      // Use job's coordinates or fall back to customer's
      const lat = job.latitude ?? job.customer?.latitude ?? null;
      const lng = job.longitude ?? job.customer?.longitude ?? null;

      const processedJob = {
        ...job,
        latitude: lat,
        longitude: lng,
        appointmentType: job.appointmentType || 'anytime',
      };

      if (job.assignedUserIds.length > 0 || job.assignedCrewId) {
        assignedJobs.push(processedJob);
      } else {
        unassignedJobs.push(processedJob);
      }
    }

    // Assign colors to workers if not set
    const WORKER_COLORS = [
      '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6',
      '#ec4899', '#06b6d4', '#f97316', '#84cc16',
    ];

    const workersWithColors = workers.map((worker, index) => ({
      ...worker,
      color: worker.color || WORKER_COLORS[index % WORKER_COLORS.length],
    }));

    return NextResponse.json({
      jobs: assignedJobs.map(job => ({
        id: job.id,
        serviceType: job.serviceType,
        status: job.status,
        startTime: job.startTime.toISOString(),
        endTime: job.endTime?.toISOString(),
        address: job.address,
        appointmentType: job.appointmentType,
        routeOrder: job.routeOrder,
        estimatedArrival: job.estimatedArrival?.toISOString() || null,
        latitude: job.latitude,
        longitude: job.longitude,
        customer: {
          id: job.customer?.id || '',
          name: job.customer?.name || 'Unknown',
          phone: job.customer?.phone || '',
          address: job.customer?.address || null,
        },
        assignedUserIds: job.assignedUserIds,
        assignedCrew: job.assignedCrew,
      })),
      unassignedJobs: unassignedJobs.map(job => ({
        id: job.id,
        serviceType: job.serviceType,
        status: job.status,
        startTime: job.startTime.toISOString(),
        endTime: job.endTime?.toISOString(),
        address: job.address,
        appointmentType: job.appointmentType,
        routeOrder: job.routeOrder,
        estimatedArrival: job.estimatedArrival?.toISOString() || null,
        latitude: job.latitude,
        longitude: job.longitude,
        customer: {
          id: job.customer?.id || '',
          name: job.customer?.name || 'Unknown',
          phone: job.customer?.phone || '',
          address: job.customer?.address || null,
        },
        assignedUserIds: job.assignedUserIds,
        assignedCrew: job.assignedCrew,
      })),
      workers: workersWithColors,
      date: targetDate.toISOString(),
    });
  } catch (error) {
    console.error('[Dispatch API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dispatch data' },
      { status: 500 }
    );
  }
}
