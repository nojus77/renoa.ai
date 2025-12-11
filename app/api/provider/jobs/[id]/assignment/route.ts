import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { checkWorkerConflicts, getCrewAvailability } from '@/lib/scheduling-utils';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = params.id;
    const searchParams = request.nextUrl.searchParams;
    const providerId = searchParams.get('providerId');
    const includeAvailability = searchParams.get('includeAvailability') === 'true';

    if (!providerId) {
      return NextResponse.json(
        { error: 'Provider ID is required' },
        { status: 400 }
      );
    }

    // Get the job with assignment details
    const job = await prisma.job.findFirst({
      where: {
        id: jobId,
        providerId,
      },
      select: {
        id: true,
        serviceType: true,
        startTime: true,
        endTime: true,
        status: true,
        assignedUserIds: true,
        assignedCrewId: true,
        assignedCrew: {
          select: {
            id: true,
            name: true,
            userIds: true,
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Get all assigned users (including those not in a crew)
    const assignedUsers = await prisma.providerUser.findMany({
      where: {
        id: { in: job.assignedUserIds },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        color: true,
        skills: true,
        profilePhotoUrl: true,
      },
    });

    // Determine which users are crew members vs individual assignments
    const crewMemberIds = job.assignedCrew?.userIds || [];
    const individualAssignments = assignedUsers.filter(
      u => !crewMemberIds.includes(u.id)
    );
    const crewAssignments = assignedUsers.filter(
      u => crewMemberIds.includes(u.id)
    );

    // Build the response
    interface AssignmentResponse {
      job: {
        id: string;
        serviceType: string;
        startTime: Date;
        endTime: Date;
        status: string;
      };
      assignment: {
        hasAssignments: boolean;
        totalWorkers: number;
        crew: {
          id: string;
          name: string;
          memberCount: number;
          members: typeof crewAssignments;
        } | null;
        individualWorkers: typeof individualAssignments;
      };
      availability?: {
        crewAvailable?: boolean;
        crewConflicts?: Array<{
          workerId: string;
          workerName: string;
          conflictingJobId: string;
          conflictingJobTitle: string;
        }>;
        workerConflicts?: Array<{
          workerId: string;
          workerName: string;
          conflictingJobId: string;
          conflictingJobTitle: string;
        }>;
      };
    }

    const response: AssignmentResponse = {
      job: {
        id: job.id,
        serviceType: job.serviceType,
        startTime: job.startTime,
        endTime: job.endTime,
        status: job.status,
      },
      assignment: {
        hasAssignments: job.assignedUserIds.length > 0 || !!job.assignedCrewId,
        totalWorkers: assignedUsers.length,
        crew: job.assignedCrew ? {
          id: job.assignedCrew.id,
          name: job.assignedCrew.name,
          memberCount: crewAssignments.length,
          members: crewAssignments,
        } : null,
        individualWorkers: individualAssignments,
      },
    };

    // Optionally include availability/conflict information
    if (includeAvailability) {
      response.availability = {};

      // Check crew availability
      if (job.assignedCrewId) {
        const crewAvailability = await getCrewAvailability(
          job.assignedCrewId,
          job.startTime,
          job.endTime,
          jobId
        );
        response.availability.crewAvailable = crewAvailability.available;
        if (crewAvailability.conflicts.length > 0) {
          response.availability.crewConflicts = crewAvailability.conflicts.map(c => ({
            workerId: c.workerId,
            workerName: c.workerName,
            conflictingJobId: c.conflictingJobId,
            conflictingJobTitle: c.conflictingJobTitle,
          }));
        }
      }

      // Check individual worker availability
      if (individualAssignments.length > 0) {
        const workerIds = individualAssignments.map(w => w.id);
        const workerConflicts = await checkWorkerConflicts(
          workerIds,
          job.startTime,
          job.endTime,
          jobId
        );
        if (workerConflicts.length > 0) {
          response.availability.workerConflicts = workerConflicts.map(c => ({
            workerId: c.workerId,
            workerName: c.workerName,
            conflictingJobId: c.conflictingJobId,
            conflictingJobTitle: c.conflictingJobTitle,
          }));
        }
      }
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching job assignment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job assignment' },
      { status: 500 }
    );
  }
}
