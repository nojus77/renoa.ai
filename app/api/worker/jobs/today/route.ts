import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET jobs assigned to worker for today
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get start and end of today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const jobs = await prisma.job.findMany({
      where: {
        assignedUserIds: { has: userId },
        startTime: {
          gte: today,
          lt: tomorrow,
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

    return NextResponse.json({ jobs });
  } catch (error) {
    console.error('Error fetching today jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}
