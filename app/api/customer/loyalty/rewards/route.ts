import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Fetch all active loyalty rewards
export async function GET(request: NextRequest) {
  try {
    const rewards = await prisma.loyalty_rewards.findMany({
      where: { active: true },
      orderBy: { points_cost: 'asc' },
    });

    // Convert Decimal to number for JSON serialization
    const serializedRewards = rewards.map((reward) => ({
      ...reward,
      rewardValue: Number(reward.reward_value),
      pointsCost: reward.points_cost,
    }));

    return NextResponse.json({ rewards: serializedRewards });
  } catch (error: unknown) {
    console.error('Error fetching rewards:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rewards', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
