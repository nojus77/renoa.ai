import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET jobs assigned to worker for the week
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const startDateParam = searchParams.get('startDate');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Default to current week if no start date provided
    let startDate: Date;
    if (startDateParam) {
      startDate = new Date(startDateParam);
    } else {
      // Get Monday of current week
      startDate = new Date();
      const day = startDate.getDay();
      const diff = startDate.getDate() - day + (day === 0 ? -6 : 1);
      startDate.setDate(diff);
    }
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);

    const jobs = await prisma.job.findMany({
      where: {
        assignedUserIds: { has: userId },
        startTime: {
          gte: startDate,
          lt: endDate,
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
      },
      orderBy: { startTime: 'asc' },
    });

    // Group jobs by day
    const jobsByDay: Record<string, typeof jobs> = {};
    jobs.forEach((job) => {
      const dayKey = job.startTime.toISOString().split('T')[0];
      if (!jobsByDay[dayKey]) {
        jobsByDay[dayKey] = [];
      }
      jobsByDay[dayKey].push(job);
    });

    return NextResponse.json({ jobs, jobsByDay, startDate, endDate });
  } catch (error) {
    console.error('Error fetching week jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}
