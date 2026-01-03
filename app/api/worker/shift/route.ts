import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET - Get current shift status and today's hours
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const providerId = searchParams.get('providerId');

    if (!userId || !providerId) {
      return NextResponse.json(
        { error: 'User ID and Provider ID are required' },
        { status: 400 }
      );
    }

    // Check for active shift (clocked in but not out)
    const activeShift = await prisma.workerShift.findFirst({
      where: {
        userId,
        providerId,
        clockOut: null,
      },
      orderBy: { clockIn: 'desc' },
    });

    // Get today's completed shifts for total hours
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todaysShifts = await prisma.workerShift.findMany({
      where: {
        userId,
        providerId,
        clockIn: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      orderBy: { clockIn: 'asc' },
    });

    // Calculate total hours today
    let totalHoursToday = 0;
    for (const shift of todaysShifts) {
      if (shift.clockOut) {
        // Completed shift
        totalHoursToday += shift.hoursWorked || 0;
      } else if (activeShift && shift.id === activeShift.id) {
        // Active shift - calculate elapsed time
        const elapsed = (new Date().getTime() - new Date(shift.clockIn).getTime()) / (1000 * 60 * 60);
        totalHoursToday += elapsed;
      }
    }

    return NextResponse.json({
      success: true,
      activeShift: activeShift ? {
        id: activeShift.id,
        clockIn: activeShift.clockIn.toISOString(),
        elapsedMinutes: Math.floor((new Date().getTime() - new Date(activeShift.clockIn).getTime()) / (1000 * 60)),
      } : null,
      isClockedIn: !!activeShift,
      totalHoursToday: Math.round(totalHoursToday * 100) / 100,
      shiftsToday: todaysShifts.length,
    });
  } catch (error) {
    console.error('Error getting shift status:', error);
    return NextResponse.json(
      { error: 'Failed to get shift status' },
      { status: 500 }
    );
  }
}

// POST - Clock in
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, providerId } = body;

    if (!userId || !providerId) {
      return NextResponse.json(
        { error: 'User ID and Provider ID are required' },
        { status: 400 }
      );
    }

    // Verify user exists and belongs to provider
    const user = await prisma.providerUser.findUnique({
      where: { id: userId },
      select: { id: true, providerId: true, status: true, firstName: true, lastName: true },
    });

    if (!user || user.providerId !== providerId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (user.status !== 'active') {
      return NextResponse.json(
        { error: 'Your account is not active' },
        { status: 403 }
      );
    }

    // Check if already clocked in
    const existingShift = await prisma.workerShift.findFirst({
      where: {
        userId,
        providerId,
        clockOut: null,
      },
    });

    if (existingShift) {
      return NextResponse.json(
        { error: 'Already clocked in', shiftId: existingShift.id },
        { status: 400 }
      );
    }

    // Create new shift
    const shift = await prisma.workerShift.create({
      data: {
        userId,
        providerId,
        clockIn: new Date(),
      },
    });

    console.log(`[Shift] ${user.firstName} ${user.lastName} clocked in at ${shift.clockIn.toISOString()}`);

    return NextResponse.json({
      success: true,
      shift: {
        id: shift.id,
        clockIn: shift.clockIn.toISOString(),
      },
      message: 'Clocked in successfully',
    });
  } catch (error) {
    console.error('Error clocking in:', error);
    return NextResponse.json(
      { error: 'Failed to clock in' },
      { status: 500 }
    );
  }
}

// PUT - Clock out
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, providerId, shiftId, notes } = body;

    if (!userId || !providerId) {
      return NextResponse.json(
        { error: 'User ID and Provider ID are required' },
        { status: 400 }
      );
    }

    // Find active shift
    const shift = shiftId
      ? await prisma.workerShift.findUnique({ where: { id: shiftId } })
      : await prisma.workerShift.findFirst({
          where: {
            userId,
            providerId,
            clockOut: null,
          },
          orderBy: { clockIn: 'desc' },
        });

    if (!shift) {
      return NextResponse.json(
        { error: 'No active shift found' },
        { status: 400 }
      );
    }

    if (shift.userId !== userId || shift.providerId !== providerId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (shift.clockOut) {
      return NextResponse.json(
        { error: 'Shift already clocked out' },
        { status: 400 }
      );
    }

    // Calculate hours worked
    const clockOut = new Date();
    const hoursWorked = (clockOut.getTime() - new Date(shift.clockIn).getTime()) / (1000 * 60 * 60);

    // Update shift
    const updatedShift = await prisma.workerShift.update({
      where: { id: shift.id },
      data: {
        clockOut,
        hoursWorked: Math.round(hoursWorked * 100) / 100,
        notes: notes || null,
      },
    });

    // Get user for logging
    const user = await prisma.providerUser.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true },
    });

    console.log(`[Shift] ${user?.firstName} ${user?.lastName} clocked out. Hours: ${updatedShift.hoursWorked}`);

    return NextResponse.json({
      success: true,
      shift: {
        id: updatedShift.id,
        clockIn: updatedShift.clockIn.toISOString(),
        clockOut: updatedShift.clockOut!.toISOString(),
        hoursWorked: updatedShift.hoursWorked,
      },
      message: `Clocked out. Total time: ${formatHours(updatedShift.hoursWorked || 0)}`,
    });
  } catch (error) {
    console.error('Error clocking out:', error);
    return NextResponse.json(
      { error: 'Failed to clock out' },
      { status: 500 }
    );
  }
}

function formatHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}
