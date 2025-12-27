import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * POST /api/provider/alerts/dismiss
 * Dismiss an alert for a provider (stores dismissal timestamp)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { providerId, alertType } = body;

    if (!providerId) {
      return NextResponse.json(
        { error: 'Provider ID required' },
        { status: 400 }
      );
    }

    if (!alertType) {
      return NextResponse.json(
        { error: 'Alert type required' },
        { status: 400 }
      );
    }

    // Valid alert types
    const validAlertTypes = [
      'schedule-conflicts',
      'overdue-jobs',
      'unconfirmed-soon',
      'unassigned-jobs',
      'overdue-invoices',
      'overloaded-workers',
      'underutilized-workers',
    ];

    if (!validAlertTypes.includes(alertType)) {
      return NextResponse.json(
        { error: 'Invalid alert type' },
        { status: 400 }
      );
    }

    // Store the dismissal in provider's workingHours JSON field (used for preferences)
    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
      select: { workingHours: true },
    });

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      );
    }

    // Parse existing workingHours or create new object
    const currentSettings = (provider.workingHours as Record<string, unknown>) || {};
    const dismissedAlerts = (currentSettings.dismissedAlerts as Record<string, string>) || {};

    // Add the dismissal with current timestamp
    dismissedAlerts[alertType] = new Date().toISOString();

    // Update provider workingHours
    await prisma.provider.update({
      where: { id: providerId },
      data: {
        workingHours: {
          ...currentSettings,
          dismissedAlerts,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Alert '${alertType}' dismissed`,
      dismissedAt: dismissedAlerts[alertType],
    });
  } catch (error) {
    console.error('Error dismissing alert:', error);
    return NextResponse.json(
      { error: 'Failed to dismiss alert' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/provider/alerts/dismiss
 * Get list of dismissed alerts for a provider
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const providerId = searchParams.get('providerId');

    if (!providerId) {
      return NextResponse.json(
        { error: 'Provider ID required' },
        { status: 400 }
      );
    }

    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
      select: { workingHours: true },
    });

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      );
    }

    const currentSettings = (provider.workingHours as Record<string, unknown>) || {};
    const dismissedAlerts = (currentSettings.dismissedAlerts as Record<string, string>) || {};

    return NextResponse.json({
      dismissedAlerts,
    });
  } catch (error) {
    console.error('Error fetching dismissed alerts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dismissed alerts' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/provider/alerts/dismiss
 * Clear a dismissed alert (make it visible again)
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const providerId = searchParams.get('providerId');
    const alertType = searchParams.get('alertType');

    if (!providerId) {
      return NextResponse.json(
        { error: 'Provider ID required' },
        { status: 400 }
      );
    }

    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
      select: { workingHours: true },
    });

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      );
    }

    const currentSettings = (provider.workingHours as Record<string, unknown>) || {};
    const dismissedAlerts = { ...(currentSettings.dismissedAlerts as Record<string, string>) || {} };

    if (alertType) {
      // Remove specific alert
      delete dismissedAlerts[alertType];
    } else {
      // Clear all dismissed alerts
      Object.keys(dismissedAlerts).forEach(key => delete dismissedAlerts[key]);
    }

    await prisma.provider.update({
      where: { id: providerId },
      data: {
        workingHours: {
          ...currentSettings,
          dismissedAlerts,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: alertType ? `Alert '${alertType}' restored` : 'All alerts restored',
    });
  } catch (error) {
    console.error('Error restoring alert:', error);
    return NextResponse.json(
      { error: 'Failed to restore alert' },
      { status: 500 }
    );
  }
}
