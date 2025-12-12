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

    const upsells = await prisma.service_upsells.findMany({
      where: {
        base_service: baseService,
      },
      orderBy: [{ display_order: 'asc' }, { conversion_rate: 'desc' }],
      take: 4, // Limit to top 4 upsells
    });

    // Convert Decimal fields to numbers
    const formattedUpsells = upsells.map((upsell) => ({
      ...upsell,
      upsell_price: Number(upsell.upsell_price),
      conversion_rate: Number(upsell.conversion_rate),
    }));

    return NextResponse.json({ upsells: formattedUpsells });
  } catch (error) {
    console.error('Error fetching upsells:', error);
    return NextResponse.json({ error: 'Failed to fetch upsells' }, { status: 500 });
  }
}
