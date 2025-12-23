import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET team/worker permission settings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('providerId');

    if (!providerId) {
      return NextResponse.json(
        { error: 'Provider ID is required' },
        { status: 400 }
      );
    }

    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
      select: {
        id: true,
        workersCanCreateJobs: true,
        workerJobsNeedApproval: true,
        workersCanEditSkills: true,
        workersCanEditAvailability: true,
        workersCanViewTeamSchedule: true,
        requireCompletionPhotos: true,
      },
    });

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ provider });
  } catch (error) {
    console.error('Error fetching team settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team settings' },
      { status: 500 }
    );
  }
}

// POST update team/worker permission settings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      providerId,
      workersCanCreateJobs,
      workerJobsNeedApproval,
      workersCanEditSkills,
      workersCanEditAvailability,
      workersCanViewTeamSchedule,
      requireCompletionPhotos,
    } = body;

    if (!providerId) {
      return NextResponse.json(
        { error: 'Provider ID is required' },
        { status: 400 }
      );
    }

    const provider = await prisma.provider.update({
      where: { id: providerId },
      data: {
        workersCanCreateJobs: workersCanCreateJobs ?? undefined,
        workerJobsNeedApproval: workerJobsNeedApproval ?? undefined,
        workersCanEditSkills: workersCanEditSkills ?? undefined,
        workersCanEditAvailability: workersCanEditAvailability ?? undefined,
        workersCanViewTeamSchedule: workersCanViewTeamSchedule ?? undefined,
        requireCompletionPhotos: requireCompletionPhotos ?? undefined,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        workersCanCreateJobs: true,
        workerJobsNeedApproval: true,
        workersCanEditSkills: true,
        workersCanEditAvailability: true,
        workersCanViewTeamSchedule: true,
        requireCompletionPhotos: true,
      },
    });

    return NextResponse.json({
      success: true,
      provider,
    });
  } catch (error) {
    console.error('Error updating team settings:', error);
    return NextResponse.json(
      { error: 'Failed to update team settings' },
      { status: 500 }
    );
  }
}
