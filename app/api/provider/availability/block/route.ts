import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      providerId,
      fromDate,
      toDate,
      startTime,
      endTime,
      reason,
      notes,
      isRecurring,
      recurring,
    } = body;

    if (!providerId || !fromDate || !toDate || !reason) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create blocked time record
    const blockedTime = await prisma.blockedTime.create({
      data: {
        providerId,
        fromDate: new Date(fromDate),
        toDate: new Date(toDate),
        startTime: startTime || null,
        endTime: endTime || null,
        reason,
        notes: notes || null,
        isRecurring: isRecurring || false,
        recurringType: isRecurring && recurring ? recurring.type : null,
        recurringDaysOfWeek: isRecurring && recurring && recurring.daysOfWeek ? recurring.daysOfWeek : [],
        recurringEndsType: isRecurring && recurring ? recurring.endsType : null,
        recurringOccurrences: isRecurring && recurring && recurring.endsType === 'after' ? recurring.occurrences : null,
        recurringEndsOnDate: isRecurring && recurring && recurring.endsType === 'on' ? new Date(recurring.endsOnDate) : null,
      },
    });

    return NextResponse.json({ success: true, blockedTime });
  } catch (error) {
    console.error('Error blocking time:', error);
    return NextResponse.json(
      { error: 'Failed to block time' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const providerId = searchParams.get('providerId');

    if (!providerId) {
      return NextResponse.json({ error: 'Provider ID required' }, { status: 400 });
    }

    // Fetch all blocked times for this provider
    const blockedTimes = await prisma.blockedTime.findMany({
      where: {
        providerId,
        // Only get active blocks (either one-time or recurring that haven't ended)
        OR: [
          { isRecurring: false },
          {
            AND: [
              { isRecurring: true },
              {
                OR: [
                  { recurringEndsType: 'never' },
                  {
                    AND: [
                      { recurringEndsType: 'on' },
                      { recurringEndsOnDate: { gte: new Date() } },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      orderBy: {
        fromDate: 'asc',
      },
    });

    return NextResponse.json({ blockedTimes });
  } catch (error) {
    console.error('Error fetching blocked times:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blocked times' },
      { status: 500 }
    );
  }
}
