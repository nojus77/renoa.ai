import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/provider/crews/[id]/next-job
 * Get the next upcoming job for a crew
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: crewId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const providerId = searchParams.get('providerId');

    if (!providerId) {
      return NextResponse.json(
        { error: 'Provider ID required' },
        { status: 400 }
      );
    }

    // Verify crew exists and belongs to provider
    const crew = await prisma.crew.findFirst({
      where: {
        id: crewId,
        providerId,
      },
    });

    if (!crew) {
      return NextResponse.json(
        { error: 'Crew not found' },
        { status: 404 }
      );
    }

    // Find the next upcoming job assigned to this crew
    const now = new Date();
    const nextJob = await prisma.job.findFirst({
      where: {
        assignedCrewId: crewId,
        providerId,
        startTime: { gte: now },
        status: { in: ['scheduled', 'in_progress'] },
      },
      orderBy: { startTime: 'asc' },
      select: {
        id: true,
        serviceType: true,
        startTime: true,
        endTime: true,
        status: true,
        customer: {
          select: {
            name: true,
            address: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      nextJob: nextJob || null,
    });
  } catch (error) {
    console.error('Error fetching next job for crew:', error);
    return NextResponse.json(
      { error: 'Failed to fetch next job' },
      { status: 500 }
    );
  }
}
