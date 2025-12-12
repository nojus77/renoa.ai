import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const currentMonth = new Date().getMonth() + 1; // 1-12

    // Find active seasonal campaign for current month
    const campaign = await prisma.seasonal_campaigns.findFirst({
      where: {
        active: true,
        OR: [
          {
            start_month: { lte: currentMonth },
            end_month: { gte: currentMonth },
          },
          // Handle December-February wrap (winter)
          {
            AND: [
              { start_month: 12 },
              { end_month: 2 },
              { OR: [{ start_month: { lte: currentMonth } }, { end_month: { gte: currentMonth } }] },
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
      discount_percent: campaign.discount_percent ? Number(campaign.discount_percent) : null,
    });
  } catch (error: unknown) {
    console.error('Error fetching seasonal campaign:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaign', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
