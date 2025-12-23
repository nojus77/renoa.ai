import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface JobUpdate {
  id: string;
  assignedUserIds?: string[];
  startTime?: string;
  duration?: number;
  status?: string;
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📥 Bulk update request received:', JSON.stringify(body, null, 2));

    const { providerId, userId, updates } = body as {
      providerId: string;
      userId: string;
      updates: JobUpdate[];
    };

    if (!providerId || !userId) {
      console.error('❌ Missing credentials:', { providerId, userId, hasProviderId: !!providerId, hasUserId: !!userId });
      return NextResponse.json(
        { error: 'Missing providerId or userId', details: { providerId: !!providerId, userId: !!userId } },
        { status: 400 }
      );
    }

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid updates array' },
        { status: 400 }
      );
    }

    // Verify user has permission (owner or office role)
    const user = await prisma.providerUser.findUnique({
      where: { id: userId },
      select: { role: true, providerId: true },
    });

    if (!user || user.providerId !== providerId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    if (user.role !== 'owner' && user.role !== 'office') {
      return NextResponse.json(
        { error: 'Only owners and office staff can bulk update jobs' },
        { status: 403 }
      );
    }

    // First, fetch existing jobs to preserve duration when not provided
    const jobIds = updates.map(u => u.id);
    const existingJobs = await prisma.job.findMany({
      where: { id: { in: jobIds } },
      select: { id: true, startTime: true, endTime: true },
    });

    const existingJobsMap = new Map(existingJobs.map(j => [j.id, j]));

    // Process all updates in a transaction
    const results = await prisma.$transaction(
      updates.map((update) => {
        const { id, assignedUserIds, startTime, duration, status } = update;
        const existingJob = existingJobsMap.get(id);

        // Build update data object
        const updateData: any = {};

        if (assignedUserIds !== undefined) {
          updateData.assignedUserIds = assignedUserIds;
        }

        if (startTime !== undefined) {
          const newStartTime = new Date(startTime);
          updateData.startTime = newStartTime;

          // If duration is provided, update endTime
          if (duration !== undefined) {
            const newEndTime = new Date(newStartTime.getTime() + duration * 60 * 60 * 1000);
            updateData.endTime = newEndTime;
            console.log(`✅ Updating job ${id} with duration ${duration}h: ${newStartTime.toISOString()} -> ${newEndTime.toISOString()}`);
          } else if (existingJob) {
            // Preserve existing duration
            const existingDuration = (existingJob.endTime.getTime() - existingJob.startTime.getTime()) / (1000 * 60 * 60);
            const newEndTime = new Date(newStartTime.getTime() + existingDuration * 60 * 60 * 1000);
            updateData.endTime = newEndTime;
            console.log(`✅ Preserving duration ${existingDuration}h for job ${id}: ${newStartTime.toISOString()} -> ${newEndTime.toISOString()}`);
          }
        } else if (duration !== undefined && existingJob) {
          // Duration changed but not startTime - update endTime based on existing startTime
          const newEndTime = new Date(existingJob.startTime.getTime() + duration * 60 * 60 * 1000);
          updateData.endTime = newEndTime;
          console.log(`✅ Updating duration to ${duration}h for job ${id}: ${existingJob.startTime.toISOString()} -> ${newEndTime.toISOString()}`);
        }

        if (status !== undefined) {
          updateData.status = status;
        }

        return prisma.job.update({
          where: { id },
          data: updateData,
          include: {
            customer: true,
          },
        });
      })
    );

    // Collect all unique user IDs from all jobs
    const allUserIds = new Set<string>();
    results.forEach(job => {
      if (job.assignedUserIds && job.assignedUserIds.length > 0) {
        job.assignedUserIds.forEach(id => allUserIds.add(id));
      }
    });

    // Fetch all users in a single query
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
      },
    }) : [];

    // Create a map for O(1) lookups
    const userMap = new Map(users.map(u => [u.id, u]));

    // Transform results with user data
    const transformedResults = results.map(job => {
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
        estimatedValue: job.estimatedValue,
        actualValue: job.actualValue,
        jobInstructions: job.jobInstructions,
        customerNotes: job.customerNotes,
        assignedUserIds: job.assignedUserIds,
        assignedUsers,
      };
    });

    console.log('✅ Bulk update successful:', {
      updated: transformedResults.length,
      jobIds: transformedResults.map(j => j.id),
    });

    return NextResponse.json({
      success: true,
      updated: transformedResults.length,
      jobs: transformedResults,
    });
  } catch (error: any) {
    console.error('❌ Error in bulk update:', error);
    return NextResponse.json(
      {
        error: 'Failed to bulk update jobs',
        details: error.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
