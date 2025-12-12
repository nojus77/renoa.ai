import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// PUT - Update worker availability/working hours
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, workingHours } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Validate working hours structure
    if (workingHours) {
      const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

      for (const [day, hours] of Object.entries(workingHours)) {
        if (!validDays.includes(day)) {
          return NextResponse.json({ error: `Invalid day: ${day}` }, { status: 400 });
        }

        const hourData = hours as { start?: string; end?: string } | null;
        if (hourData && typeof hourData === 'object') {
          // Validate time format (HH:MM)
          const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
          if (hourData.start && !timeRegex.test(hourData.start)) {
            return NextResponse.json({ error: `Invalid start time for ${day}` }, { status: 400 });
          }
          if (hourData.end && !timeRegex.test(hourData.end)) {
            return NextResponse.json({ error: `Invalid end time for ${day}` }, { status: 400 });
          }
        }
      }
    }

    const updated = await prisma.providerUser.update({
      where: { id: userId },
      data: {
        workingHours: workingHours || null,
      },
      select: {
        id: true,
        workingHours: true,
      },
    });

    return NextResponse.json({ success: true, workingHours: updated.workingHours });
  } catch (error: any) {
    console.error('Error updating worker availability:', error);

    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(
      { error: 'Failed to update availability' },
      { status: 500 }
    );
  }
}
