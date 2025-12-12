import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

    return NextResponse.json({ success: true, request: timeOffRequest });
  } catch (error) {
    console.error('Error creating time off request:', error);
    return NextResponse.json(
      { error: 'Failed to create time off request' },
      { status: 500 }
    );
  }
}
