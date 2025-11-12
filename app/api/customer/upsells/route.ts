import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const baseService = searchParams.get('baseService');

    if (!baseService) {
      return NextResponse.json({ error: 'Base service is required' }, { status: 400 });
    }

    const upsells = await prisma.serviceUpsell.findMany({
      where: {
        baseService,
      },
      orderBy: [{ displayOrder: 'asc' }, { conversionRate: 'desc' }],
      take: 4, // Limit to top 4 upsells
    });

    // Convert Decimal fields to numbers
    const formattedUpsells = upsells.map((upsell) => ({
      ...upsell,
      upsellPrice: Number(upsell.upsellPrice),
      conversionRate: Number(upsell.conversionRate),
    }));

    return NextResponse.json({ upsells: formattedUpsells });
  } catch (error) {
    console.error('Error fetching upsells:', error);
    return NextResponse.json({ error: 'Failed to fetch upsells' }, { status: 500 });
  }
}
