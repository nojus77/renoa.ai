import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseISO } from 'date-fns';
import { getDateRange } from '@/lib/date-utils';

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

    // Parse date or use today - use shared date utility for consistency
    const targetDate = dateStr ? parseISO(dateStr) : new Date();
    const { start: dayStart, end: dayEnd } = getDateRange(targetDate);

    console.log('[Dispatch API] Fetching jobs for:', {
      providerId,
      date: dateStr,
      targetDate: targetDate.toISOString(),
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

    // Fetch provider info for office location
    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
      select: {
        businessName: true,
        businessAddress: true,
        officeLatitude: true,
        officeLongitude: true,
      },
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

    console.log('[Dispatch API] Total workers found:', workers.length);
    console.log('[Dispatch API] Workers:', workers.map(w => ({
      id: w.id,
      name: `${w.firstName} ${w.lastName}`,
    })));

    console.log('[Dispatch API] Total jobs found:', jobs.length);
    console.log('[Dispatch API] Jobs:', jobs.map(j => ({
      id: j.id,
      service: j.serviceType,
      assignedUserIds: j.assignedUserIds,
      startTime: j.startTime.toISOString(),
      customer: j.customer?.name,
    })));

    // Get the next date with jobs (for navigation hint when today has no jobs)
    const nextJobDate = jobs.length === 0 ? await prisma.job.findFirst({
      where: {
        providerId,
        startTime: { gte: dayStart },
        status: { notIn: ['cancelled', 'completed'] },
      },
      select: { startTime: true },
      orderBy: { startTime: 'asc' },
    }) : null;

    // Get the previous date with jobs
    const prevJobDate = jobs.length === 0 ? await prisma.job.findFirst({
      where: {
        providerId,
        startTime: { lt: dayStart },
        status: { notIn: ['cancelled', 'completed'] },
      },
      select: { startTime: true },
      orderBy: { startTime: 'desc' },
    }) : null;

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
      office: provider ? {
        name: provider.businessName,
        address: provider.businessAddress,
        latitude: provider.officeLatitude,
        longitude: provider.officeLongitude,
      } : null,
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
      // Navigation hints when current date has no jobs
      nextJobDate: nextJobDate?.startTime?.toISOString().split('T')[0] || null,
      prevJobDate: prevJobDate?.startTime?.toISOString().split('T')[0] || null,
    });
  } catch (error) {
    console.error('[Dispatch API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dispatch data' },
      { status: 500 }
    );
  }
}
