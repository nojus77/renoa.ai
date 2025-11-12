import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get customer session
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('customer-session');

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    const customerId = session.customerId;
    const jobId = params.id;

    // Get job details
    const job = await prisma.job.findFirst({
      where: {
        id: jobId,
        customerId, // Ensure customer owns this job
      },
      include: {
        provider: {
          select: {
            businessName: true,
            phone: true,
            email: true,
          },
        },
        photos: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      job: {
        ...job,
        estimatedValue: job.estimatedValue ? Number(job.estimatedValue) : null,
        actualValue: job.actualValue ? Number(job.actualValue) : null,
      },
    });
  } catch (error) {
    console.error('Error fetching job:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job' },
      { status: 500 }
    );
  }
}
