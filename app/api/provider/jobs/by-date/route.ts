import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('providerId');
    const date = searchParams.get('date'); // Expected format: YYYY-MM-DD

    if (!providerId) {
      return NextResponse.json(
        { error: 'Provider ID is required' },
        { status: 400 }
      );
    }

    if (!date) {
      return NextResponse.json(
        { error: 'Date is required' },
        { status: 400 }
      );
    }

    // Parse the date and create start/end of day
    const dateStart = new Date(date + 'T00:00:00');
    const dateEnd = new Date(date + 'T23:59:59.999');

    // Validate date
    if (isNaN(dateStart.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format. Expected YYYY-MM-DD' },
        { status: 400 }
      );
    }

    // Get all jobs for this date
    const jobs = await prisma.job.findMany({
      where: {
        providerId,
        startTime: {
          gte: dateStart,
          lte: dateEnd,
        },
      },
      select: {
        id: true,
        serviceType: true,
        address: true,
        startTime: true,
        endTime: true,
        status: true,
        estimatedValue: true,
        actualValue: true,
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        assignedUserIds: true,
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    // Get assigned user details
    const allUserIds = new Set<string>();
    jobs.forEach(job => {
      if (job.assignedUserIds && job.assignedUserIds.length > 0) {
        job.assignedUserIds.forEach(id => allUserIds.add(id));
      }
    });

    const users = allUserIds.size > 0 ? await prisma.providerUser.findMany({
      where: {
        id: { in: Array.from(allUserIds) },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        profilePhotoUrl: true,
      },
    }) : [];

    const userMap = new Map(users.map(u => [u.id, u]));

    // Transform jobs with user data
    const transformedJobs = jobs.map(job => ({
      id: job.id,
      serviceType: job.serviceType,
      address: job.address,
      startTime: job.startTime.toISOString(),
      endTime: job.endTime.toISOString(),
      status: job.status,
      amount: job.actualValue || job.estimatedValue || null,
      customerName: job.customer?.name || 'Unknown Customer',
      customerPhone: job.customer?.phone || '',
      assignedUsers: job.assignedUserIds
        ? job.assignedUserIds
            .map(id => userMap.get(id))
            .filter(Boolean)
            .map(u => ({
              id: u!.id,
              firstName: u!.firstName,
              lastName: u!.lastName,
              profilePhotoUrl: u!.profilePhotoUrl,
            }))
        : [],
    }));

    // Calculate totals
    const totalRevenue = jobs.reduce((sum, job) => {
      return sum + (job.actualValue || job.estimatedValue || 0);
    }, 0);

    const completedCount = jobs.filter(j => j.status === 'completed').length;

    return NextResponse.json({
      success: true,
      data: {
        date,
        jobs: transformedJobs,
        summary: {
          totalJobs: jobs.length,
          completedJobs: completedCount,
          totalRevenue,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching jobs by date:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}
