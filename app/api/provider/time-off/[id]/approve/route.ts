import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// PUT approve or deny time off request
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action } = body; // 'approve' or 'deny'

    if (!id) {
      return NextResponse.json({ error: 'Request ID is required' }, { status: 400 });
    }

    if (!action || !['approve', 'deny'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be "approve" or "deny"' },
        { status: 400 }
      );
    }

    const status = action === 'approve' ? 'approved' : 'denied';

    const updatedRequest = await prisma.workerTimeOff.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ success: true, request: updatedRequest });
  } catch (error) {
    console.error('Error updating time off request:', error);
    return NextResponse.json(
      { error: 'Failed to update time off request' },
      { status: 500 }
    );
  }
}
