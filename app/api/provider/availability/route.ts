import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET provider's availability settings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('providerId');

    if (!providerId) {
      return NextResponse.json(
        { error: 'Provider ID is required' },
        { status: 400 }
      );
    }

    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
      select: {
        workingHours: true,
        timeZone: true,
        bufferTime: true,
        advanceBooking: true,
        availabilityNotes: true,
      },
    });

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      );
    }

    // Default working hours if not set
    const defaultWorkingHours = {
      monday: [{ start: '09:00', end: '17:00' }],
      tuesday: [{ start: '09:00', end: '17:00' }],
      wednesday: [{ start: '09:00', end: '17:00' }],
      thursday: [{ start: '09:00', end: '17:00' }],
      friday: [{ start: '09:00', end: '17:00' }],
      saturday: [],
      sunday: [],
    };

    return NextResponse.json({
      workingHours: provider.workingHours || defaultWorkingHours,
      timeZone: provider.timeZone,
      bufferTime: provider.bufferTime,
      advanceBooking: provider.advanceBooking,
      availabilityNotes: provider.availabilityNotes,
    });
  } catch (error) {
    console.error('Error fetching availability:', error);
    return NextResponse.json(
      { error: 'Failed to fetch availability' },
      { status: 500 }
    );
  }
}

// POST update provider's availability settings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      providerId,
      workingHours,
      timeZone,
      bufferTime,
      advanceBooking,
      availabilityNotes,
    } = body;

    if (!providerId) {
      return NextResponse.json(
        { error: 'Provider ID is required' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    
    if (workingHours) updateData.workingHours = workingHours;
    if (timeZone) updateData.timeZone = timeZone;
    if (bufferTime !== undefined) updateData.bufferTime = bufferTime;
    if (advanceBooking !== undefined) updateData.advanceBooking = advanceBooking;
    if (availabilityNotes !== undefined) updateData.availabilityNotes = availabilityNotes;

    const updatedProvider = await prisma.provider.update({
      where: { id: providerId },
      data: updateData,
    });

    console.log('✅ Availability updated for provider:', providerId);

    return NextResponse.json({
      success: true,
      message: 'Availability updated successfully',
      provider: updatedProvider,
    });
  } catch (error) {
    console.error('Error updating availability:', error);
    return NextResponse.json(
      { error: 'Failed to update availability' },
      { status: 500 }
    );
  }
}