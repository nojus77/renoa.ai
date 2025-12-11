import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// POST validate that a time slot is available before booking
export async function POST(req: NextRequest) {
  try {
    const { providerId, startTime, duration } = await req.json();

    if (!providerId || !startTime || !duration) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const start = new Date(startTime);
    const end = new Date(start.getTime() + duration * 60000); // duration in minutes

    // Check blocked times
    const blocked = await prisma.blockedTime.findFirst({
      where: {
        providerId,
        OR: [
          // All-day block that covers this time
          {
            AND: [
              { fromDate: { lte: start } },
              { toDate: { gte: end } },
              { startTime: null },
              { endTime: null }
            ]
          },
          // Time-specific block that overlaps
          {
            AND: [
              { fromDate: { lte: start } },
              { toDate: { gte: start } },
              {
                OR: [
                  // Block starts before and ends during our slot
                  {
                    AND: [
                      { startTime: { lte: start.toTimeString().slice(0, 5) } },
                      { endTime: { gt: start.toTimeString().slice(0, 5) } }
                    ]
                  },
                  // Block starts during our slot
                  {
                    AND: [
                      { startTime: { lt: end.toTimeString().slice(0, 5) } },
                      { endTime: { gte: end.toTimeString().slice(0, 5) } }
                    ]
                  },
                  // Block completely covers our slot
                  {
                    AND: [
                      { startTime: { lte: start.toTimeString().slice(0, 5) } },
                      { endTime: { gte: end.toTimeString().slice(0, 5) } }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }
    });

    if (blocked) {
      return NextResponse.json({
        available: false,
        reason: blocked.reason || 'Provider has blocked this time'
      });
    }

    // Check existing jobs
    const existingJob = await prisma.job.findFirst({
      where: {
        providerId,
        status: { in: ['scheduled', 'confirmed', 'in_progress'] },
        OR: [
          // Existing job starts before and ends during our slot
          {
            AND: [
              { startTime: { lte: start } },
              { endTime: { gt: start } }
            ]
          },
          // Existing job starts during our slot
          {
            AND: [
              { startTime: { lt: end } },
              { endTime: { gte: end } }
            ]
          },
          // Our slot completely covers existing job
          {
            AND: [
              { startTime: { gte: start } },
              { endTime: { lte: end } }
            ]
          }
        ]
      }
    });

    if (existingJob) {
      return NextResponse.json({
        available: false,
        reason: 'Provider already has a job scheduled at this time'
      });
    }

    return NextResponse.json({ available: true });
  } catch (error) {
    console.error('Error validating booking:', error);
    return NextResponse.json(
      { error: 'Failed to validate booking' },
      { status: 500 }
    );
  }
}
