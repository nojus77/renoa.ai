import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import {
  getSeatUsage,
  updateSubscriptionSeats,
  calculateProratedCost,
} from '@/lib/stripe-seats';

const prisma = new PrismaClient();

/**
 * GET /api/provider/billing/seats
 * Get current seat usage and billing information
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

    const seatUsage = await getSeatUsage(providerId);

    // Calculate prorated cost for adding one more seat
    let proratedCost = 0;
    if (seatUsage.currentPeriodEnd) {
      const now = new Date();
      const periodEnd = new Date(seatUsage.currentPeriodEnd);
      const daysRemaining = Math.ceil(
        (periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Calculate total days in billing period
      const totalDays = seatUsage.planType === 'annual' ? 365 : 30;

      proratedCost = calculateProratedCost(
        seatUsage.pricePerSeat,
        daysRemaining,
        totalDays
      );
    }

    return NextResponse.json({
      ...seatUsage,
      proratedCostForNewSeat: proratedCost,
      nextBillingDate: seatUsage.currentPeriodEnd,
    });
  } catch (error: any) {
    console.error('Error fetching seat usage:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch seat usage' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/provider/billing/seats
 * Add a seat (activate a user)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { providerId, userId } = body;

    if (!providerId || !userId) {
      return NextResponse.json(
        { error: 'Provider ID and User ID required' },
        { status: 400 }
      );
    }

    // Get current seat usage for prorated cost calculation
    const seatUsage = await getSeatUsage(providerId);

    // Activate the user
    await prisma.providerUser.update({
      where: { id: userId },
      data: { status: 'active' },
    });

    // Count active users after activation
    const activeUserCount = await prisma.providerUser.count({
      where: {
        providerId,
        status: 'active',
      },
    });

    // Calculate prorated cost
    let proratedCost = 0;
    if (seatUsage.currentPeriodEnd) {
      const now = new Date();
      const periodEnd = new Date(seatUsage.currentPeriodEnd);
      const daysRemaining = Math.ceil(
        (periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      const totalDays = seatUsage.planType === 'annual' ? 365 : 30;

      proratedCost = calculateProratedCost(
        seatUsage.pricePerSeat,
        daysRemaining,
        totalDays
      );
    }

    // Update Stripe subscription
    const result = await updateSubscriptionSeats(providerId, activeUserCount);

    if (!result.success) {
      // Rollback user activation if Stripe update fails
      await prisma.providerUser.update({
        where: { id: userId },
        data: { status: 'inactive' },
      });

      return NextResponse.json(
        { error: result.error || 'Failed to update subscription' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      newSeatCount: activeUserCount,
      proratedCost,
      message: `Seat added successfully. Prorated charge: $${(proratedCost / 100).toFixed(2)}`,
    });
  } catch (error: any) {
    console.error('Error adding seat:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add seat' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/provider/billing/seats
 * Deactivate a user (mark seat as available)
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const providerId = searchParams.get('providerId');
    const userId = searchParams.get('userId');

    if (!providerId || !userId) {
      return NextResponse.json(
        { error: 'Provider ID and User ID required' },
        { status: 400 }
      );
    }

    // Deactivate the user
    await prisma.providerUser.update({
      where: { id: userId },
      data: { status: 'inactive' },
    });

    // Note: We don't reduce the Stripe subscription immediately
    // The seat becomes available for reuse, and billing adjusts at next renewal

    return NextResponse.json({
      success: true,
      message: 'User deactivated. Seat will be available for reuse. Billing adjusts at next renewal.',
    });
  } catch (error: any) {
    console.error('Error deactivating seat:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to deactivate seat' },
      { status: 500 }
    );
  }
}
