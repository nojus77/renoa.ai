import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createNotification } from '@/lib/notifications';
import { getTimezoneFromAddress } from '@/lib/google-timezone';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📝 Job creation request received:', {
      providerId: body.providerId,
      customerId: body.customerId,
      serviceType: body.serviceType,
      serviceTypeConfigId: body.serviceTypeConfigId,
      assignedUserIds: body.assignedUserIds,
      hasCustomerId: !!body.customerId,
      assignedUserIdsType: typeof body.assignedUserIds,
      assignedUserIdsLength: body.assignedUserIds?.length,
      requiredSkillIds: body.requiredSkillIds,
      requiredWorkerCount: body.requiredWorkerCount,
      allowUnqualified: body.allowUnqualified,
    });

    const {
      providerId,
      customerId,
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      serviceType,
      // serviceTypeConfigId - logged above but not stored (no field in schema)
      startTime,
      duration = 2, // Duration in hours, default 2
      durationMinutes, // Duration in minutes
      estimatedValue,
      jobInstructions, // Office → worker instructions
      customerNotes,
      status = 'scheduled',
      appointmentType = 'anytime', // 'fixed', 'anytime', 'window'
      isRecurring = false,
      recurringFrequency,
      recurringEndDate,
      assignedUserIds = [],
      // NEW: Structured skill fields from modal
      requiredSkillIds,
      preferredSkillIds,
      requiredWorkerCount,
      bufferMinutes,
      // NEW: Override fields
      allowUnqualified = false,
      unqualifiedOverrideReason,
    } = body;

    // Validation
    if (!providerId || !serviceType || !startTime) {
      return NextResponse.json({ error: 'Missing required fields: providerId, serviceType, startTime' }, { status: 400 });
    }

    // Validate startTime is a valid date
    const startDate = new Date(startTime);
    if (isNaN(startDate.getTime())) {
      return NextResponse.json({ error: 'Invalid startTime: must be a valid date string' }, { status: 400 });
    }

    // Duration validation
    const durationHours = durationMinutes ? durationMinutes / 60 : duration;
    if (!durationHours || durationHours <= 0) {
      return NextResponse.json({ error: 'Duration is required and must be positive' }, { status: 400 });
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

    // Calculate endTime from startTime + duration (startDate already validated above)
    const endDate = new Date(startDate.getTime() + durationHours * 60 * 60 * 1000);

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

    // Check for blocked time conflicts
    // Get the job's date (for recurring block check)
    const jobDayOfWeek = startDate.getDay();

    // Find blocked times that overlap with this job's time
    const blockedTimes = await prisma.blockedTime.findMany({
      where: {
        providerId,
        fromDate: { lte: endDate },
        toDate: { gte: startDate },
        OR: [
          { isRecurring: false },
          {
            AND: [
              { isRecurring: true },
              {
                OR: [
                  { recurringEndsType: 'never' },
                  { recurringEndsOnDate: { gte: startDate } },
                ],
              },
            ],
          },
        ],
      },
    });

    // Check for company-wide blocks first (affects all jobs regardless of assignment)
    for (const block of blockedTimes) {
      // For recurring blocks, check if the day of week matches
      if (block.isRecurring && block.recurringType === 'weekly' && block.recurringDaysOfWeek) {
        const blockDays = block.recurringDaysOfWeek as number[];
        if (!blockDays.includes(jobDayOfWeek)) continue;
      }

      // Check time overlap (if time-specific block)
      if (block.startTime && block.endTime) {
        const [blockStartH, blockStartM] = block.startTime.split(':').map(Number);
        const [blockEndH, blockEndM] = block.endTime.split(':').map(Number);
        const jobStartHour = startDate.getHours() + startDate.getMinutes() / 60;
        const jobEndHour = endDate.getHours() + endDate.getMinutes() / 60;
        const blockStartHour = blockStartH + blockStartM / 60;
        const blockEndHour = blockEndH + blockEndM / 60;

        // Check if there's no overlap
        if (jobEndHour <= blockStartHour || jobStartHour >= blockEndHour) {
          continue; // No time overlap, skip this block
        }
      }

      // If this is a company-wide block, reject the job creation entirely
      if (block.scope === 'company') {
        console.log('⚠️ Company-wide blocked time conflict detected:', {
          blockId: block.id,
          reason: block.reason,
          fromDate: block.fromDate,
          toDate: block.toDate,
        });

        return NextResponse.json(
          {
            error: `Cannot schedule job: The company is blocked during this time${block.reason ? ` (${block.reason})` : ''}`,
            blockedType: 'company',
          },
          { status: 400 }
        );
      }
    }

    // Check if any assigned workers are blocked
    if (assignedUserIds && assignedUserIds.length > 0) {
      const blockedWorkers: string[] = [];
      for (const block of blockedTimes) {
        // For recurring blocks, check if the day of week matches
        if (block.isRecurring && block.recurringType === 'weekly' && block.recurringDaysOfWeek) {
          const blockDays = block.recurringDaysOfWeek as number[];
          if (!blockDays.includes(jobDayOfWeek)) continue;
        }

        // Check time overlap (if time-specific block)
        if (block.startTime && block.endTime) {
          const [blockStartH, blockStartM] = block.startTime.split(':').map(Number);
          const [blockEndH, blockEndM] = block.endTime.split(':').map(Number);
          const jobStartHour = startDate.getHours() + startDate.getMinutes() / 60;
          const jobEndHour = endDate.getHours() + endDate.getMinutes() / 60;
          const blockStartHour = blockStartH + blockStartM / 60;
          const blockEndHour = blockEndH + blockEndM / 60;

          // Check if there's no overlap
          if (jobEndHour <= blockStartHour || jobStartHour >= blockEndHour) {
            continue; // No time overlap, skip this block
          }
        }

        // Check if any assigned workers are in the blocked list
        if (block.scope === 'workers' && block.blockedWorkerIds) {
          const affected = assignedUserIds.filter((id: string) =>
            block.blockedWorkerIds.includes(id)
          );
          blockedWorkers.push(...affected);
        }
      }

      // Remove duplicates
      const uniqueBlockedWorkers = Array.from(new Set(blockedWorkers));

      if (uniqueBlockedWorkers.length > 0) {
        // Get worker names for the error message
        const blockedWorkerDetails = await prisma.providerUser.findMany({
          where: { id: { in: uniqueBlockedWorkers } },
          select: { id: true, firstName: true, lastName: true },
        });

        const workerNames = blockedWorkerDetails
          .map(w => `${w.firstName} ${w.lastName}`)
          .join(', ');

        console.log('⚠️ Worker blocked time conflict detected:', {
          blockedWorkers: uniqueBlockedWorkers,
          workerNames,
        });

        return NextResponse.json(
          {
            error: `Cannot schedule job: ${workerNames} ${uniqueBlockedWorkers.length > 1 ? 'are' : 'is'} blocked during this time`,
            blockedWorkerIds: uniqueBlockedWorkers,
          },
          { status: 400 }
        );
      }
    }

    // Fetch ServiceTypeConfig for skill requirements
    const serviceConfig = await prisma.serviceTypeConfig.findFirst({
      where: {
        providerId,
        serviceType,
      },
    });

    // Fetch provider for fallback timezone
    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
      select: { timeZone: true },
    });

    // Get timezone from job address location
    const jobAddress = customerAddress || '';
    const jobTimezone = jobAddress ? await getTimezoneFromAddress(jobAddress) : null;
    // Fallback to provider timezone if lookup fails
    const finalTimezone = jobTimezone || provider?.timeZone || 'America/Chicago';

    console.log('📋 ServiceTypeConfig for', serviceType, ':', serviceConfig ? {
      requiredSkills: serviceConfig.requiredSkills,
      preferredSkills: serviceConfig.preferredSkills,
      crewSizeMin: serviceConfig.crewSizeMin,
      estimatedDuration: serviceConfig.estimatedDuration, // ServiceTypeConfig stores in hours
    } : 'Not configured');

    // Determine final required skill IDs
    const finalRequiredSkillIds = requiredSkillIds ?? serviceConfig?.requiredSkills ?? [];
    const finalPreferredSkillIds = preferredSkillIds ?? serviceConfig?.preferredSkills ?? [];

    // Validate skill IDs exist in the database (if any provided)
    const allSkillIds = Array.from(new Set([...finalRequiredSkillIds, ...finalPreferredSkillIds]));
    if (allSkillIds.length > 0) {
      const existingSkills = await prisma.skill.findMany({
        where: {
          id: { in: allSkillIds },
          providerId, // Skills must belong to this provider
        },
        select: { id: true },
      });
      const existingSkillIds = new Set(existingSkills.map(s => s.id));
      const invalidSkillIds = allSkillIds.filter(id => !existingSkillIds.has(id));

      if (invalidSkillIds.length > 0) {
        return NextResponse.json(
          { error: `Invalid skill IDs: ${invalidSkillIds.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // Create skill snapshot for display (prevents showing IDs if skills are deleted)
    let requiredSkillsSnapshot: Array<{ id: string; name: string }> | null = null;
    if (finalRequiredSkillIds.length > 0) {
      const skills = await prisma.skill.findMany({
        where: { id: { in: finalRequiredSkillIds } },
        select: { id: true, name: true },
      });
      requiredSkillsSnapshot = skills.map(s => ({ id: s.id, name: s.name }));
    }

    // Create the job with skill requirements
    // Use explicit values from request if provided, otherwise fall back to ServiceTypeConfig
    const job = await prisma.job.create({
      data: {
        providerId,
        customerId: finalCustomerId,
        serviceType,
        address: customerAddress || '',
        timezone: finalTimezone, // IANA timezone from job location
        startTime: startDate,
        endTime: endDate,
        status,
        source: 'own', // Provider manually created this job
        appointmentType, // 'fixed', 'anytime', 'window'
        estimatedValue: estimatedValue ? parseFloat(estimatedValue) : null,
        jobInstructions: jobInstructions || null,
        customerNotes: customerNotes || null,
        isRecurring,
        recurringFrequency: isRecurring ? recurringFrequency : null,
        recurringEndDate: isRecurring && recurringEndDate ? new Date(recurringEndDate) : null,
        assignedUserIds,
        // Skill requirements: prefer explicit values, fall back to ServiceTypeConfig (already validated)
        requiredSkillIds: finalRequiredSkillIds,
        preferredSkillIds: finalPreferredSkillIds,
        // Snapshot of skill names at creation (only store if we have skills)
        ...(requiredSkillsSnapshot && requiredSkillsSnapshot.length > 0
          ? { requiredSkillsSnapshot: requiredSkillsSnapshot }
          : {}),
        requiredWorkerCount: requiredWorkerCount ?? serviceConfig?.crewSizeMin ?? 1,
        bufferMinutes: bufferMinutes ?? 15,
        durationMinutes: durationMinutes ?? (serviceConfig?.estimatedDuration ? Math.round(serviceConfig.estimatedDuration * 60) : Math.round(durationHours * 60)),
        // Override fields
        allowUnqualified: allowUnqualified || false,
        unqualifiedOverrideReason: allowUnqualified ? (unqualifiedOverrideReason || null) : null,
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

    // Check for scheduling conflicts with the newly created job
    let hasConflicts = false;
    const conflictingWorkers: string[] = [];

    if (assignedUserIds && assignedUserIds.length > 0) {
      // Find other jobs for these workers that overlap with this job's time
      const overlappingJobs = await prisma.job.findMany({
        where: {
          providerId,
          id: { not: job.id }, // Exclude the job we just created
          assignedUserIds: { hasSome: assignedUserIds },
          status: { notIn: ['cancelled', 'completed', 'no_show'] },
          // Check for time overlap: job starts before this ends AND ends after this starts
          startTime: { lt: endDate },
          endTime: { gt: startDate },
        },
        select: {
          id: true,
          serviceType: true,
          startTime: true,
          endTime: true,
          assignedUserIds: true,
        },
      });

      if (overlappingJobs.length > 0) {
        hasConflicts = true;
        // Find which workers have conflicts
        for (const overlappingJob of overlappingJobs) {
          for (const userId of assignedUserIds) {
            if (overlappingJob.assignedUserIds.includes(userId) && !conflictingWorkers.includes(userId)) {
              conflictingWorkers.push(userId);
            }
          }
        }
      }
    }

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

      // If there are conflicts, send a warning notification to office users
      if (hasConflicts && conflictingWorkers.length > 0) {
        console.log('⚠️ Scheduling conflict detected, sending notifications');

        // Get conflicting worker names
        const conflictingWorkerDetails = await prisma.providerUser.findMany({
          where: { id: { in: conflictingWorkers } },
          select: { id: true, firstName: true, lastName: true },
        });
        const workerNames = conflictingWorkerDetails.map(w => `${w.firstName} ${w.lastName}`).join(', ');

        // Get office users to notify
        const officeUsers = await prisma.providerUser.findMany({
          where: {
            providerId,
            role: { in: ['admin', 'owner', 'office'] },
            status: 'active',
          },
          select: { id: true },
        });

        for (const officeUser of officeUsers) {
          await createNotification({
            providerId,
            userId: officeUser.id,
            type: 'schedule_conflict',
            title: '⚠️ Scheduling Conflict',
            message: `${workerNames} ${conflictingWorkers.length > 1 ? 'have' : 'has'} overlapping jobs on ${jobDate} at ${jobTime}`,
            link: `/provider/calendar?date=${startDate.toISOString().split('T')[0]}`,
            data: {
              jobId: job.id,
              conflictingWorkerIds: conflictingWorkers,
              conflictType: 'time_overlap',
            },
          });
        }

        console.log('✅ Conflict notifications sent to office users');
      }
    }

    const response = {
      success: true,
      job,
      // Include conflict info for frontend to show warning
      hasConflicts,
      conflictingWorkers: hasConflicts ? conflictingWorkers : undefined,
    };
    console.log('📤 Returning response with job data:', {
      success: response.success,
      jobId: response.job.id,
      customerName: response.job.customer?.name,
      hasConflicts,
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

    // Pagination params
    const cursor = searchParams.get('cursor');
    const limit = parseInt(searchParams.get('limit') || '50');

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

    // Fetch jobs with cursor-based pagination
    const jobs = await prisma.job.findMany({
      where: whereClause,
      include: {
        customer: true, // Include customer details
        photos: true,   // Include job photos
      },
      orderBy: {
        startTime: 'asc',
      },
      take: limit + 1, // Fetch one extra to check if there are more
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
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

    // Check if there are more results
    const hasMore = jobs.length > limit;
    const jobsToReturn = hasMore ? jobs.slice(0, -1) : jobs;
    const nextCursor = hasMore ? jobsToReturn[jobsToReturn.length - 1]?.id : null;

    // Transform jobs with user data
    const transformedJobs = jobsToReturn.map(job => {
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
        jobInstructions: job.jobInstructions,
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

    return NextResponse.json({
      jobs: transformedJobs,
      nextCursor,
      hasMore,
    });
  } catch (error) {
    console.error('Error fetching provider jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}
