import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/provider/schedule/proposals/[id]
 * Get proposal details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const proposal = await prisma.scheduleProposal.findUnique({
      where: { id: params.id },
      include: {
        assignments: true
      }
    });

    if (!proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }

    return NextResponse.json(proposal);
  } catch (error) {
    console.error('Error fetching proposal:', error);
    return NextResponse.json(
      { error: 'Failed to fetch proposal' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/provider/schedule/proposals/[id]
 * Approve or reject a proposal
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { action, userId } = body; // action: 'approve' | 'reject'

    if (!action || !userId) {
      return NextResponse.json(
        { error: 'Action and userId required' },
        { status: 400 }
      );
    }

    if (action === 'approve') {
      // Get proposal with assignments
      const proposal = await prisma.scheduleProposal.findUnique({
        where: { id: params.id },
        include: { assignments: true }
      });

      if (!proposal) {
        return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
      }

      if (proposal.status === 'approved') {
        return NextResponse.json({ error: 'Proposal already approved' }, { status: 400 });
      }

      // Apply all assignments
      for (const assignment of proposal.assignments) {
        await prisma.job.update({
          where: { id: assignment.jobId },
          data: {
            assignedUserIds: assignment.workerIds,
            startTime: assignment.suggestedStart,
            endTime: assignment.suggestedEnd
          }
        });
      }

      // Update proposal status
      await prisma.scheduleProposal.update({
        where: { id: params.id },
        data: {
          status: 'approved',
          reviewedAt: new Date(),
          reviewedBy: userId
        }
      });

      return NextResponse.json({
        success: true,
        message: `Schedule approved: ${proposal.assignments.length} jobs assigned`
      });
    }

    if (action === 'reject') {
      await prisma.scheduleProposal.update({
        where: { id: params.id },
        data: {
          status: 'rejected',
          reviewedAt: new Date(),
          reviewedBy: userId
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Schedule rejected'
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Proposal action error:', error);
    return NextResponse.json(
      { error: 'Failed to process proposal' },
      { status: 500 }
    );
  }
}
