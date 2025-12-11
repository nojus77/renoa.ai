import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Fetch all active loyalty rewards
export async function GET(request: NextRequest) {
  try {
    const rewards = await prisma.loyaltyReward.findMany({
      where: { active: true },
      orderBy: { pointsCost: 'asc' },
    });

    // Convert Decimal to number for JSON serialization
    const serializedRewards = rewards.map((reward) => ({
      ...reward,
      rewardValue: Number(reward.rewardValue),
    }));

    return NextResponse.json({ rewards: serializedRewards });
  } catch (error: any) {
    console.error('Error fetching rewards:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rewards', details: error.message },
      { status: 500 }
    );
  }
}
