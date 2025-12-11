import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getCustomerSession } from '@/lib/auth-helpers';

const prisma = new PrismaClient();

// GET - Fetch jobs that are due or overdue for the customer
export async function GET(request: NextRequest) {
  try {
    const session = await getCustomerSession();

    if (!session?.customerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date();
    const sevenDaysFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Find completed jobs that are due within the next 7 days
    const dueJobs = await prisma.job.findMany({
      where: {
        customerId: session.customerId,
        status: 'completed',
        nextDueDate: {
          lte: sevenDaysFromNow,
        },
      },
      include: {
        provider: {
          select: {
            id: true,
            businessName: true,
            phone: true,
            email: true,
          },
        },
      },
      orderBy: {
        nextDueDate: 'asc',
      },
    });

    // Categorize jobs by urgency
    const overdueJobs = dueJobs.filter(
      (job) => job.nextDueDate && new Date(job.nextDueDate) < today
    );
    const upcomingJobs = dueJobs.filter(
      (job) => job.nextDueDate && new Date(job.nextDueDate) >= today
    );

    // Serialize the response
    const serializedDueJobs = dueJobs.map((job) => ({
      ...job,
      estimatedValue: job.estimatedValue ? Number(job.estimatedValue) : null,
      actualValue: job.actualValue ? Number(job.actualValue) : null,
    }));

    return NextResponse.json({
      dueJobs: serializedDueJobs,
      overdueCount: overdueJobs.length,
      upcomingCount: upcomingJobs.length,
      totalDue: dueJobs.length,
    });
  } catch (error: any) {
    console.error('Error fetching due jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch due jobs', details: error.message },
      { status: 500 }
    );
  }
}
