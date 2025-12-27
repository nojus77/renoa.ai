import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/worker/jobs/[id]
 * Get single job details for a worker (only if assigned to them)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get job only if worker is assigned to it
    const job = await prisma.job.findFirst({
      where: {
        id,
        assignedUserIds: { has: userId },
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            address: true,
          },
        },
        workLogs: {
          where: { userId },
          select: {
            id: true,
            clockIn: true,
            clockOut: true,
            hoursWorked: true,
            earnings: true,
          },
        },
        assignedCrew: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    });

    if (!job) {
      // Debug: Try to find the job without the userId check
      const jobWithoutUserCheck = await prisma.job.findUnique({
        where: { id },
        select: { id: true, assignedUserIds: true, status: true },
      });
      console.error('Job not found for worker:', {
        jobId: id,
        userId,
        jobExists: !!jobWithoutUserCheck,
        assignedUserIds: jobWithoutUserCheck?.assignedUserIds,
      });
      return NextResponse.json(
        { error: 'Job not found or not assigned to you' },
        { status: 404 }
      );
    }

    // Get coworkers (other assigned users, excluding current user)
    let coworkers: { id: string; name: string; phone: string | null; profilePhotoUrl: string | null }[] = [];
    if (job.assignedUserIds.length > 1) {
      const otherUserIds = job.assignedUserIds.filter(uid => uid !== userId);
      const users = await prisma.providerUser.findMany({
        where: {
          id: { in: otherUserIds },
          status: 'active',
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          profilePhotoUrl: true,
          profilePhotoBlobPath: true,
        },
      });
      coworkers = users.map(u => ({
        id: u.id,
        name: `${u.firstName} ${u.lastName}`,
        phone: u.phone,
        profilePhotoUrl: u.profilePhotoBlobPath || u.profilePhotoUrl,
      }));
    }

    // Get user's pay info for earnings breakdown display
    const userPayInfo = await prisma.providerUser.findUnique({
      where: { id: userId },
      select: {
        payType: true,
        hourlyRate: true,
        commissionRate: true,
      },
    });

    // Get provider settings for completion flow
    const providerSettings = await prisma.provider.findUnique({
      where: { id: job.providerId },
      select: {
        requireCompletionPhotos: true,
      },
    });

    return NextResponse.json({
      job: {
        ...job,
        coworkers,
        numWorkers: job.assignedUserIds.length,
        userPayInfo,
      },
      providerSettings: {
        requireCompletionPhotos: providerSettings?.requireCompletionPhotos ?? false,
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
