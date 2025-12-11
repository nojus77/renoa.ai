import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const currentMonth = new Date().getMonth() + 1; // 1-12

    // Find active seasonal campaign for current month
    const campaign = await prisma.seasonalCampaign.findFirst({
      where: {
        active: true,
        OR: [
          {
            startMonth: { lte: currentMonth },
            endMonth: { gte: currentMonth },
          },
          // Handle December-February wrap (winter)
          {
            AND: [
              { startMonth: 12 },
              { endMonth: 2 },
              { OR: [{ startMonth: { lte: currentMonth } }, { endMonth: { gte: currentMonth } }] },
            ],
          },
        ],
      },
    });

    if (!campaign) {
      return NextResponse.json({ campaign: null });
    }

    return NextResponse.json({
      ...campaign,
      discountPercent: Number(campaign.discountPercent),
    });
  } catch (error: any) {
    console.error('Error fetching seasonal campaign:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaign', details: error.message },
      { status: 500 }
    );
  }
}
