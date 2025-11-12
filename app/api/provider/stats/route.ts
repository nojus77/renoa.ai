import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('providerId');

    if (!providerId) {
      return NextResponse.json({ error: 'Provider ID required' }, { status: 400 });
    }

    // Get provider with jobs from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const jobs = await prisma.job.findMany({
      where: {
        providerId,
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    // Calculate stats
    const totalJobs = jobs.length;
    const completedJobs = jobs.filter(j => j.status === 'completed').length;
    const revenue = jobs
      .filter(j => j.status === 'completed')
      .reduce((sum, j) => sum + (j.actualValue || j.estimatedValue || 0), 0);

    const stats = {
      totalJobs,
      completedJobs,
      revenue,
      avgResponseTime: 8, // minutes - placeholder for now
    };

    return NextResponse.json(stats, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
