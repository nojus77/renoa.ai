import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createNotification } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

// GET time off requests for worker
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const requests = await prisma.workerTimeOff.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ requests });
  } catch (error) {
    console.error('Error fetching time off requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch time off requests' },
      { status: 500 }
    );
  }
}

// POST create time off request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, startDate, endDate, reason, notes } = body;

    if (!userId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'User ID, start date, and end date are required' },
        { status: 400 }
      );
    }

    // Get worker info for notification
    const worker = await prisma.providerUser.findUnique({
      where: { id: userId },
      select: {
        firstName: true,
        lastName: true,
        providerId: true,
      },
    });

    if (!worker) {
      return NextResponse.json({ error: 'Worker not found' }, { status: 404 });
    }

    const timeOffRequest = await prisma.workerTimeOff.create({
      data: {
        userId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reason: reason || 'other',
        notes,
        status: 'pending',
      },
    });

    // Create notification for provider
    const reasonLabel = reason || 'time off';
    const startFormatted = new Date(startDate).toLocaleDateString();
    const endFormatted = new Date(endDate).toLocaleDateString();
    await createNotification({
      providerId: worker.providerId,
      type: 'time_off_request',
      title: 'Time Off Request',
      message: `${worker.firstName} ${worker.lastName} requested ${reasonLabel} from ${startFormatted} to ${endFormatted}`,
      link: '/provider/team?tab=time-off',
    });

    return NextResponse.json({ success: true, request: timeOffRequest });
  } catch (error) {
    console.error('Error creating time off request:', error);
    return NextResponse.json(
      { error: 'Failed to create time off request' },
      { status: 500 }
    );
  }
}
