import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { customerId: string } }
) {
  try {
    const customerId = params.customerId;

    // Fetch all jobs for this customer that have customer notes
    const jobs = await prisma.job.findMany({
      where: {
        customerId,
        customerNotes: {
          not: null,
        },
      },
      select: {
        customerNotes: true,
        createdAt: true,
        serviceType: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10, // Limit to last 10 jobs with notes
    });

    const history = jobs.map(job => ({
      notes: job.customerNotes,
      date: job.createdAt.toISOString(),
      serviceType: job.serviceType,
    }));

    return NextResponse.json({ history });
  } catch (error) {
    console.error('Error fetching customer notes history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer notes history' },
      { status: 500 }
    );
  }
}
