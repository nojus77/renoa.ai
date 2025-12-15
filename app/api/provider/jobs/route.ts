import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createNotification } from '@/lib/notifications';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📝 Job creation request received:', {
      providerId: body.providerId,
      customerId: body.customerId,
      serviceType: body.serviceType,
      assignedUserIds: body.assignedUserIds,
      hasCustomerId: !!body.customerId,
      assignedUserIdsType: typeof body.assignedUserIds,
      assignedUserIdsLength: body.assignedUserIds?.length,
    });

    const {
      providerId,
      customerId,
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      serviceType,
      startTime,
      duration = 2, // Duration in hours, default 2
      estimatedValue,
      internalNotes,
      customerNotes,
      status = 'scheduled',
      appointmentType = 'anytime', // 'fixed', 'anytime', 'window'
      isRecurring = false,
      recurringFrequency,
      recurringEndDate,
      assignedUserIds = [],
    } = body;

    if (!providerId || !serviceType || !startTime) {
      return NextResponse.json({ error: 'Missing required fields: providerId, serviceType, startTime' }, { status: 400 });
    }

    let finalCustomerId = customerId;

    // If no customerId provided, create a new customer
    if (!customerId) {
      if (!customerName || !customerPhone) {
        return NextResponse.json({ error: 'customerName and customerPhone required for new customer' }, { status: 400 });
      }

      const newCustomer = await prisma.customer.create({
        data: {
          providerId,
          name: customerName,
          email: customerEmail || null,
          phone: customerPhone,
          address: customerAddress || '',
          source: 'own', // Provider manually added this customer
        },
      });

      finalCustomerId = newCustomer.id;
    }

    // Calculate endTime from startTime + duration
    const startDate = new Date(startTime);
    const endDate = new Date(startDate.getTime() + duration * 60 * 60 * 1000);

    // Verify assigned user IDs belong to this provider (if any)
    if (assignedUserIds && assignedUserIds.length > 0) {
      console.log('🔍 Validating assigned user IDs:', assignedUserIds);
      const users = await prisma.providerUser.findMany({
        where: {
          id: { in: assignedUserIds },
          providerId,
        },
      });
      console.log('✅ Found users:', users.map(u => ({ id: u.id, name: `${u.firstName} ${u.lastName}` })));

      if (users.length !== assignedUserIds.length) {
        console.error('❌ User validation failed:', {
          requested: assignedUserIds.length,
          found: users.length,
          requestedIds: assignedUserIds,
          foundIds: users.map(u => u.id),
        });
        return NextResponse.json(
          { error: 'Some assigned user IDs do not belong to this provider' },
          { status: 400 }
        );
      }
    } else {
      console.log('ℹ️ No users assigned to this job');
    }

    // Create the job
    const job = await prisma.job.create({
      data: {
        providerId,
        customerId: finalCustomerId,
        serviceType,
        address: customerAddress || '',
        startTime: startDate,
        endTime: endDate,
        status,
        source: 'own', // Provider manually created this job
        appointmentType, // 'fixed', 'anytime', 'window'
        estimatedValue: estimatedValue ? parseFloat(estimatedValue) : null,
        internalNotes: internalNotes || null,
        customerNotes: customerNotes || null,
        isRecurring,
        recurringFrequency: isRecurring ? recurringFrequency : null,
        recurringEndDate: isRecurring && recurringEndDate ? new Date(recurringEndDate) : null,
        assignedUserIds,
      },
      include: {
        customer: true, // Include customer data in response
      },
    });

    console.log('✅ Job created successfully:', {
      jobId: job.id,
      customerId: job.customerId,
      serviceType: job.serviceType,
      assignedUserIds: job.assignedUserIds,
      hasCustomer: !!job.customer,
    });

    // Send notifications to assigned workers
    if (assignedUserIds && assignedUserIds.length > 0) {
      const jobDate = startDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
      const jobTime = startDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });

      console.log('📨 Sending job assignment notifications to workers:', assignedUserIds);

      for (const workerId of assignedUserIds) {
        await createNotification({
          providerId,
          userId: workerId,
          type: 'job_assigned',
          title: 'New Job Assigned',
          message: `You've been assigned to ${serviceType} on ${jobDate} at ${jobTime}`,
          link: `/worker/job/${job.id}`,
          data: {
            jobId: job.id,
            serviceType,
            startTime: startDate.toISOString(),
            address: customerAddress || '',
          },
        });
      }

      console.log('✅ Job assignment notifications sent');
    }

    const response = { success: true, job };
    console.log('📤 Returning response with job data:', {
      success: response.success,
      jobId: response.job.id,
      customerName: response.job.customer?.name,
    });

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error creating job:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack,
    });
    return NextResponse.json(
      {
        error: 'Failed to create job',
        details: error.message || 'Unknown error',
        code: error.code,
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const providerId = searchParams.get('providerId');
    const userId = searchParams.get('userId'); // Filter by assigned user
    const status = searchParams.get('status'); // Filter by status
    const statuses = searchParams.get('statuses'); // Filter by multiple statuses (comma-separated)
    const unassigned = searchParams.get('unassigned'); // Filter for unassigned jobs only

    if (!providerId) {
      return NextResponse.json({ error: 'Provider ID required' }, { status: 400 });
    }

    // Build dynamic where clause
    const whereClause: any = {
      providerId,
    };

    // Filter by assigned user
    if (userId && userId !== 'all') {
      whereClause.assignedUserIds = {
        has: userId,
      };
    }

    // Filter for unassigned jobs only
    if (unassigned === 'true') {
      whereClause.OR = [
        { assignedUserIds: { equals: [] } },
        { assignedUserIds: null },
      ];
    }

    // Filter by single status
    if (status && status !== 'all') {
      whereClause.status = status;
    }

    // Filter by multiple statuses
    if (statuses && statuses !== 'all') {
      const statusArray = statuses.split(',').filter(s => s && s !== 'all');
      if (statusArray.length > 0) {
        whereClause.status = { in: statusArray };
      }
    }

    // Fetch all jobs for this provider using the Job model
    const jobs = await prisma.job.findMany({
      where: whereClause,
      include: {
        customer: true, // Include customer details
        photos: true,   // Include job photos
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    // Collect all unique user IDs from all jobs
    const allUserIds = new Set<string>();
    jobs.forEach(job => {
      if (job.assignedUserIds && job.assignedUserIds.length > 0) {
        job.assignedUserIds.forEach(id => allUserIds.add(id));
      }
    });

    // Fetch all users in a single query with their skills
    const users = allUserIds.size > 0 ? await prisma.providerUser.findMany({
      where: {
        id: { in: Array.from(allUserIds) },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        role: true,
        profilePhotoUrl: true,
        workerSkills: {
          include: {
            skill: {
              select: {
                id: true,
                name: true,
                category: true,
              },
            },
          },
        },
      },
    }) : [];

    // Create a map for O(1) lookups
    const userMap = new Map(users.map(u => [u.id, u]));

    // Transform jobs with user data
    const transformedJobs = jobs.map(job => {
      const assignedUsers = job.assignedUserIds
        ? job.assignedUserIds.map(id => userMap.get(id)).filter(Boolean)
        : [];

      return {
        id: job.id,
        customerName: job.customer.name,
        customerEmail: job.customer.email,
        customerPhone: job.customer.phone,
        serviceType: job.serviceType,
        address: job.address,
        startTime: job.startTime,
        endTime: job.endTime,
        status: job.status,
        source: job.source,
        isRenoaLead: job.source === 'renoa',
        estimatedValue: job.estimatedValue,
        actualValue: job.actualValue,
        internalNotes: job.internalNotes,
        customerNotes: job.customerNotes,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
        customer: job.customer,
        photos: job.photos,
        isRecurring: job.isRecurring,
        recurringFrequency: job.recurringFrequency,
        recurringEndDate: job.recurringEndDate,
        parentRecurringJobId: job.parentRecurringJobId,
        assignedUserIds: job.assignedUserIds,
        assignedUsers, // Include full user details
      };
    });

    return NextResponse.json({ jobs: transformedJobs });
  } catch (error) {
    console.error('Error fetching provider jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}
