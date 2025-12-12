import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// PUT update/cancel time off request
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    if (!id) {
      return NextResponse.json({ error: 'Request ID is required' }, { status: 400 });
    }

    // Get the request first
    const existingRequest = await prisma.workerTimeOff.findUnique({
      where: { id },
    });

    if (!existingRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    // Worker can only cancel pending requests
    if (action === 'cancel') {
      if (existingRequest.status !== 'pending') {
        return NextResponse.json(
          { error: 'Can only cancel pending requests' },
          { status: 400 }
        );
      }

      await prisma.workerTimeOff.delete({
        where: { id },
      });

      return NextResponse.json({ success: true, message: 'Request cancelled' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error updating time off request:', error);
    return NextResponse.json(
      { error: 'Failed to update time off request' },
      { status: 500 }
    );
  }
}
