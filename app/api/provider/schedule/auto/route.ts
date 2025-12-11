import { NextRequest, NextResponse } from 'next/server';
import { scheduleJobsForDate } from '@/lib/services/scheduling/scheduler-engine';

/**
 * POST /api/provider/schedule/auto
 * Generate automatic schedule for a specific date
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { providerId, date, jobIds, excludeWorkerIds, createdBy } = body;

    if (!providerId || !date) {
      return NextResponse.json(
        { error: 'Provider ID and date required' },
        { status: 400 }
      );
    }

    // Parse date
    const scheduleDate = new Date(date);

    // Run scheduler
    const result = await scheduleJobsForDate(providerId, scheduleDate, {
      jobIds,
      excludeWorkerIds,
      createdBy
    });

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to generate schedule', details: result.errors },
        { status: 500 }
      );
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Auto-schedule API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate schedule', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
