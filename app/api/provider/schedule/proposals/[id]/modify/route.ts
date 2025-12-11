import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * PATCH /api/provider/schedule/proposals/[id]/modify
 * Modify specific assignments in a proposal before approval
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { modifications } = await request.json();
    // modifications: Array<{ jobId: string, workerIds: string[] }>

    if (!modifications || !Array.isArray(modifications)) {
      return NextResponse.json(
        { error: 'Invalid modifications' },
        { status: 400 }
      );
    }

    // Update each modified assignment
    for (const mod of modifications) {
      await prisma.proposedAssignment.updateMany({
        where: {
          proposalId: params.id,
          jobId: mod.jobId,
        },
        data: {
          workerIds: mod.workerIds,
        },
      });
    }

    // Update proposal to indicate modifications
    await prisma.scheduleProposal.update({
      where: { id: params.id },
      data: {
        status: 'pending', // Keep as pending until approved
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Modify proposal error:', error);
    return NextResponse.json(
      { error: 'Failed to modify proposal' },
      { status: 500 }
    );
  }
}
