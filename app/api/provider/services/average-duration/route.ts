import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/provider/services/average-duration
 * Returns average actual duration for completed jobs of a given service type
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('providerId');
    const serviceType = searchParams.get('serviceType');

    if (!providerId || !serviceType) {
      return NextResponse.json(
        { error: 'Provider ID and service type are required' },
        { status: 400 }
      );
    }

    // Fetch completed jobs with actual duration recorded
    // Using findMany + JS averaging because Prisma aggregate doesn't support take/orderBy together
    const completedJobs = await prisma.job.findMany({
      where: {
        providerId,
        serviceType,
        status: 'completed',
        actualDurationMinutes: { not: null },
      },
      select: { actualDurationMinutes: true },
      orderBy: { completedAt: 'desc' },
      take: 50, // Last 50 jobs for recency weighting
    });

    const count = completedJobs.length;

    if (count < 3) {
      // Not enough data for meaningful average
      return NextResponse.json({ average: null, count });
    }

    // Calculate average
    const sum = completedJobs.reduce((acc, job) => acc + (job.actualDurationMinutes || 0), 0);
    const average = Math.round(sum / count);

    return NextResponse.json({ average, count });
  } catch (error) {
    console.error('[Average Duration API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch average duration' },
      { status: 500 }
    );
  }
}
