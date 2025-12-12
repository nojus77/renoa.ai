import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getCustomerSession } from '@/lib/auth-helpers';
import crypto from 'crypto';

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
    const reward = await prisma.loyalty_rewards.findUnique({
      where: { id: rewardId },
    });

    if (!reward || !reward.active) {
      return NextResponse.json({ error: 'Reward not found or inactive' }, { status: 404 });
    }

    // Get customer's loyalty points
    const loyalty = await prisma.loyalty_points.findUnique({
      where: { customer_id: session.customerId },
    });

    if (!loyalty) {
      return NextResponse.json({ error: 'Loyalty account not found' }, { status: 404 });
    }

    // Check if customer has enough points
    if (loyalty.points < reward.points_cost) {
      return NextResponse.json(
        { error: 'Insufficient points', required: reward.points_cost, available: loyalty.points },
        { status: 400 }
      );
    }

    // Deduct points
    const updatedLoyalty = await prisma.loyalty_points.update({
      where: { customer_id: session.customerId },
      data: {
        points: loyalty.points - reward.points_cost,
      },
    });

    // Create transaction record
    await prisma.loyalty_transactions.create({
      data: {
        id: crypto.randomUUID(),
        customer_id: session.customerId,
        points: -reward.points_cost,
        type: 'redeemed',
        source: 'reward_redemption',
        description: `Redeemed ${reward.name}`,
      },
    });

    // Create notification for successful redemption
    await prisma.customer_notifications.create({
      data: {
        id: crypto.randomUUID(),
        customer_id: session.customerId,
        type: 'promotion',
        title: 'Reward Redeemed!',
        message: `You've successfully redeemed ${reward.name}. Check your email for details on how to use it.`,
        action_url: '/customer-portal/rewards',
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
        rewardValue: Number(reward.reward_value),
        pointsCost: reward.points_cost,
      },
    });
  } catch (error: unknown) {
    console.error('Error redeeming reward:', error);
    return NextResponse.json(
      { error: 'Failed to redeem reward', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
