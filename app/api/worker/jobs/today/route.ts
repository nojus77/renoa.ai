import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getWidestTodayWindow } from '@/lib/utils/timezone';

export const dynamic = 'force-dynamic';

// GET jobs assigned to worker for today
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get widest possible "today" window across all US timezones
    // This ensures we fetch all jobs that could be "today" in any timezone
    // The client-side display will use isJobToday() for accurate per-job filtering
    const { start, end } = getWidestTodayWindow();

    const jobs = await prisma.job.findMany({
      where: {
        assignedUserIds: { has: userId },
        startTime: {
          gte: start,
          lt: end,
        },
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        provider: {
          select: {
            timeZone: true,
          },
        },
        workLogs: {
          where: { userId },
          select: {
            id: true,
            clockIn: true,
            clockOut: true,
            hoursWorked: true,
            earnings: true,
          },
        },
      },
      orderBy: { startTime: 'asc' },
    });

    // Add provider timezone to each job for client-side isJobToday() filtering
    const jobsWithTimezone = jobs.map((job) => ({
      ...job,
      providerTimezone: job.provider?.timeZone || 'America/Chicago',
    }));

    return NextResponse.json({ jobs: jobsWithTimezone });
  } catch (error) {
    console.error('Error fetching today jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}
