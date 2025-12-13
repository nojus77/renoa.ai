import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET upcoming jobs assigned to worker (not today, next 2-3 jobs)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '3');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Start from tomorrow
    const tomorrow = new Date();
    tomorrow.setHours(0, 0, 0, 0);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const jobs = await prisma.job.findMany({
      where: {
        assignedUserIds: { has: userId },
        startTime: {
          gte: tomorrow,
        },
        status: {
          not: 'cancelled',
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
      take: limit,
    });

    return NextResponse.json({ jobs });
  } catch (error) {
    console.error('Error fetching upcoming jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch upcoming jobs' },
      { status: 500 }
    );
  }
}
