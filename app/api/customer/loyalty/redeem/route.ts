import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getCustomerSession } from '@/lib/auth-helpers';

const prisma = new PrismaClient();

// POST - Redeem a loyalty reward
export async function POST(request: NextRequest) {
  try {
    const session = await getCustomerSession();

    if (!session?.customerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { rewardId } = await request.json();

    if (!rewardId) {
      return NextResponse.json({ error: 'Reward ID is required' }, { status: 400 });
    }

    // Fetch reward
    const reward = await prisma.loyaltyReward.findUnique({
      where: { id: rewardId },
    });

    if (!reward || !reward.active) {
      return NextResponse.json({ error: 'Reward not found or inactive' }, { status: 404 });
    }

    // Get customer's loyalty points
    const loyalty = await prisma.loyaltyPoints.findUnique({
      where: { customerId: session.customerId },
    });

    if (!loyalty) {
      return NextResponse.json({ error: 'Loyalty account not found' }, { status: 404 });
    }

    // Check if customer has enough points
    if (loyalty.points < reward.pointsCost) {
      return NextResponse.json(
        { error: 'Insufficient points', required: reward.pointsCost, available: loyalty.points },
        { status: 400 }
      );
    }

    // Deduct points
    const updatedLoyalty = await prisma.loyaltyPoints.update({
      where: { customerId: session.customerId },
      data: {
        points: loyalty.points - reward.pointsCost,
      },
    });

    // Create transaction record
    await prisma.loyaltyTransaction.create({
      data: {
        customerId: session.customerId,
        points: -reward.pointsCost,
        type: 'redeemed',
        source: 'reward_redemption',
        description: `Redeemed ${reward.name}`,
      },
    });

    // Create notification for successful redemption
    await prisma.customerNotification.create({
      data: {
        customerId: session.customerId,
        type: 'promotion',
        title: '🎁 Reward Redeemed!',
        message: `You've successfully redeemed ${reward.name}. Check your email for details on how to use it.`,
        actionUrl: '/customer-portal/rewards',
      },
    });

    // TODO: Send email with reward details
    // TODO: Create promo code if reward is a discount
    // TODO: Update customer flags if reward is priority scheduling

    return NextResponse.json({
      success: true,
      newBalance: updatedLoyalty.points,
      reward: {
        ...reward,
        rewardValue: Number(reward.rewardValue),
      },
    });
  } catch (error: any) {
    console.error('Error redeeming reward:', error);
    return NextResponse.json(
      { error: 'Failed to redeem reward', details: error.message },
      { status: 500 }
    );
  }
}
