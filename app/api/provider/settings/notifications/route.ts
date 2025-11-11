import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Fetch notification settings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('providerId');

    if (!providerId) {
      return NextResponse.json({ error: 'Provider ID is required' }, { status: 400 });
    }

    // TODO: Fetch from dedicated settings table
    // For now, return default settings
    const settings = {
      notificationsEnabled: true,
      quietHoursEnabled: true,
      quietHoursStart: '21:00',
      quietHoursEnd: '08:00',
      notificationSettings: [
        { type: 'job_scheduled', label: 'Job Scheduled', description: 'When a new job is scheduled with the customer', sms: true, email: true },
        { type: 'lead_accepted', label: 'Lead Accepted', description: 'When you accept a new lead from Renoa', sms: true, email: true },
        { type: 'reminder_24h', label: '24-Hour Reminder', description: 'Reminder sent to customer 24 hours before the job', sms: true, email: false },
        { type: 'provider_on_way', label: 'Provider On The Way', description: 'When you mark that you\'re heading to the job location', sms: true, email: false },
        { type: 'job_complete', label: 'Job Completed', description: 'When you mark a job as complete', sms: true, email: true },
        { type: 'invoice_sent', label: 'Invoice Sent', description: 'When an invoice is sent to the customer', sms: true, email: true },
        { type: 'payment_received', label: 'Payment Received', description: 'When payment is received from the customer', sms: true, email: true },
      ],
    };

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// POST - Save notification settings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      providerId,
      notificationsEnabled,
      quietHoursEnabled,
      quietHoursStart,
      quietHoursEnd,
      notificationSettings,
    } = body;

    if (!providerId) {
      return NextResponse.json({ error: 'Provider ID is required' }, { status: 400 });
    }

    // TODO: Save to dedicated settings table
    // For now, just log and return success
    console.log('Saving notification settings for provider:', providerId);
    console.log('Settings:', {
      notificationsEnabled,
      quietHoursEnabled,
      quietHoursStart,
      quietHoursEnd,
      notificationSettings,
    });

    return NextResponse.json({
      success: true,
      message: 'Settings saved successfully',
    });
  } catch (error) {
    console.error('Error saving notification settings:', error);
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    );
  }
}
