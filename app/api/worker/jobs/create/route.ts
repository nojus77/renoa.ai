import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createNotification } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

// POST - Create a job as a worker
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      providerId,
      customerId,
      serviceType,
      address,
      startTime,
      endTime,
      notes,
    } = body;

    // Validate required fields
    if (!userId || !providerId) {
      return NextResponse.json({ error: 'User ID and Provider ID are required' }, { status: 400 });
    }

    if (!customerId) {
      return NextResponse.json({ error: 'Please select a customer' }, { status: 400 });
    }

    if (!serviceType) {
      return NextResponse.json({ error: 'Please select a service type' }, { status: 400 });
    }

    if (!startTime || !endTime) {
      return NextResponse.json({ error: 'Please set the date and time' }, { status: 400 });
    }

    // Get the worker and provider to check permissions
    const worker = await prisma.providerUser.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        providerId: true,
        role: true,
        status: true,
        provider: {
          select: {
            workersCanCreateJobs: true,
            workerJobsNeedApproval: true,
          },
        },
      },
    });

    if (!worker) {
      return NextResponse.json({ error: 'Worker not found' }, { status: 404 });
    }

    if (worker.providerId !== providerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (worker.status !== 'active') {
      return NextResponse.json({ error: 'Your account is not active' }, { status: 403 });
    }

    // Check provider-level permission (applies to all workers)
    if (!worker.provider.workersCanCreateJobs) {
      return NextResponse.json(
        { error: 'You do not have permission to create jobs' },
        { status: 403 }
      );
    }

    // Get customer info for the address if not provided
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: {
        id: true,
        name: true,
        address: true,
        providerId: true,
      },
    });

    if (!customer || customer.providerId !== providerId) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Determine job status based on provider-level approval settings
    const jobStatus = worker.provider.workerJobsNeedApproval ? 'pending_approval' : 'scheduled';

    // Create the job
    const job = await prisma.job.create({
      data: {
        providerId,
        customerId,
        serviceType,
        address: address || customer.address,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        status: jobStatus,
        source: 'worker',
        internalNotes: notes
          ? `[Created by ${worker.firstName} ${worker.lastName}] ${notes}`
          : `[Created by ${worker.firstName} ${worker.lastName}]`,
        assignedUserIds: [userId], // Auto-assign to the worker who created it
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    });

    // Create notification if job needs approval
    if (worker.provider.workerJobsNeedApproval) {
      await createNotification({
        providerId,
        type: 'job_created_by_worker',
        title: 'Job Needs Approval',
        message: `${worker.firstName} ${worker.lastName} created a new ${serviceType} job for ${customer.name}`,
        link: `/provider/jobs/${job.id}`,
      });
    }

    return NextResponse.json({
      success: true,
      job,
      needsApproval: worker.provider.workerJobsNeedApproval,
      message: worker.provider.workerJobsNeedApproval
        ? 'Job created and pending approval from your manager'
        : 'Job created and scheduled successfully',
    });
  } catch (error) {
    console.error('Error creating job:', error);
    return NextResponse.json({ error: 'Failed to create job' }, { status: 500 });
  }
}
