import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/field/my-jobs
 * Get jobs assigned to a specific field user
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }

    // Verify user exists and is a field user
    const user = await prisma.providerUser.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Build date filter if provided
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate);
    }

    // Fetch jobs where this user is assigned
    const jobs = await prisma.job.findMany({
      where: {
        assignedUserIds: {
          has: userId,
        },
        ...(startDate || endDate ? { startTime: dateFilter } : {}),
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    // Transform jobs to exclude pricing/financial information
    const fieldJobs = jobs.map(job => ({
      id: job.id,
      serviceType: job.serviceType,
      address: job.address,
      startTime: job.startTime,
      endTime: job.endTime,
      status: job.status,
      customerNotes: job.customerNotes,
      internalNotes: job.internalNotes,
      customer: job.customer,
      // Exclude: estimatedValue, actualValue, invoices
    }));

    return NextResponse.json({
      jobs: fieldJobs,
      count: fieldJobs.length,
    });
  } catch (error) {
    console.error('Error fetching field user jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}
