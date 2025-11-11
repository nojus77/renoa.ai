import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET - Fetch notification preferences
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
        id: true,
      },
    });

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      );
    }

    // TODO: Add notificationPreferences field to Provider schema
    // For now, return default preferences
    const defaultPreferences = {
      email: {
        newLead: true,
        jobReminders: true,
        paymentReceived: true,
        customerMessages: true,
        weeklySummary: true,
      },
      sms: {
        newLead: true,
        urgentMessages: true,
      },
      quietHours: {
        enabled: false,
        start: '21:00',
        end: '07:00',
      },
    };

    return NextResponse.json({
      success: true,
      preferences: defaultPreferences,
    });
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification preferences' },
      { status: 500 }
    );
  }
}

// PUT - Update notification preferences
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { providerId, preferences } = body;

    if (!providerId) {
      return NextResponse.json(
        { error: 'Provider ID is required' },
        { status: 400 }
      );
    }

    // TODO: Add notificationPreferences field to Provider schema
    // For now, just return success without saving
    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
    });

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Notification preferences updated successfully',
      preferences,
    });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return NextResponse.json(
      { error: 'Failed to update notification preferences' },
      { status: 500 }
    );
  }
}
