import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET available time slots for a provider on a specific date
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const providerId = searchParams.get('providerId');
    const date = searchParams.get('date'); // YYYY-MM-DD
    const duration = parseInt(searchParams.get('duration') || '120'); // minutes

    if (!providerId || !date) {
      return NextResponse.json(
        { error: 'Missing providerId or date' },
        { status: 400 }
      );
    }

    const startOfDay = new Date(`${date}T00:00:00`);
    const endOfDay = new Date(`${date}T23:59:59`);

    // Get all blocked times for this provider on this date
    const blockedTimes = await prisma.blockedTime.findMany({
      where: {
        providerId,
        OR: [
          // Blocks that cover this entire day
          {
            fromDate: { lte: startOfDay },
            toDate: { gte: endOfDay }
          },
          // Blocks that start or end on this day
          {
            fromDate: { gte: startOfDay, lte: endOfDay }
          },
          {
            toDate: { gte: startOfDay, lte: endOfDay }
          },
          // Recurring blocks
          {
            isRecurring: true,
            recurringDaysOfWeek: {
              has: startOfDay.getDay() // 0-6 (Sunday-Saturday)
            }
          }
        ]
      }
    });

    // Get all existing jobs for this provider on this date
    const existingJobs = await prisma.job.findMany({
      where: {
        providerId,
        startTime: {
          gte: startOfDay,
          lte: endOfDay
        },
        status: {
          in: ['scheduled', 'in_progress', 'confirmed']
        }
      },
      select: {
        startTime: true,
        endTime: true
      }
    });

    // Generate time slots (7 AM to 7 PM in 30-min intervals)
    const slots = [];
    const businessStart = 7; // 7 AM
    const businessEnd = 19; // 7 PM

    for (let hour = businessStart; hour < businessEnd; hour++) {
      for (let minute of [0, 30]) {
        const slotStart = new Date(date);
        slotStart.setHours(hour, minute, 0, 0);

        const slotEnd = new Date(slotStart);
        slotEnd.setMinutes(slotEnd.getMinutes() + duration);

        // Check if this slot conflicts with blocked times
        const isBlocked = blockedTimes.some(block => {
          // For all-day blocks
          if (!block.startTime || !block.endTime) {
            return true;
          }

          // For time-specific blocks
          const blockStart = new Date(`${date}T${block.startTime}`);
          const blockEnd = new Date(`${date}T${block.endTime}`);

          // Check for overlap
          return (
            (slotStart >= blockStart && slotStart < blockEnd) ||
            (slotEnd > blockStart && slotEnd <= blockEnd) ||
            (slotStart <= blockStart && slotEnd >= blockEnd)
          );
        });

        // Check if this slot conflicts with existing jobs
        const hasJob = existingJobs.some(job => {
          const jobStart = new Date(job.startTime);
          const jobEnd = new Date(job.endTime);

          // Check for overlap
          return (
            (slotStart >= jobStart && slotStart < jobEnd) ||
            (slotEnd > jobStart && slotEnd <= jobEnd) ||
            (slotStart <= jobStart && slotEnd >= jobEnd)
          );
        });

        slots.push({
          time: slotStart.toISOString(),
          available: !isBlocked && !hasJob,
          reason: isBlocked ? 'blocked' : hasJob ? 'booked' : null
        });
      }
    }

    return NextResponse.json({ date, slots });
  } catch (error) {
    console.error('Error fetching availability slots:', error);
    return NextResponse.json(
      { error: 'Failed to fetch availability slots' },
      { status: 500 }
    );
  }
}
