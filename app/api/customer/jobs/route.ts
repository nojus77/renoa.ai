import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Get customer session
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('customer-session');

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    const customerId = session.customerId;

    // Get all jobs for this customer
    const jobs = await prisma.job.findMany({
      where: { customerId },
      orderBy: { startTime: 'desc' },
      include: {
        provider: {
          select: {
            businessName: true,
            phone: true,
            email: true,
          },
        },
        photos: true,
      },
    });

    return NextResponse.json({
      jobs: jobs.map(job => ({
        ...job,
        estimatedValue: job.estimatedValue ? Number(job.estimatedValue) : null,
        actualValue: job.actualValue ? Number(job.actualValue) : null,
      })),
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}
