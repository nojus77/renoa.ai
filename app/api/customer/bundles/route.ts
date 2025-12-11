import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const season = searchParams.get('season');

    // Determine current season if not specified
    const currentMonth = new Date().getMonth() + 1;
    let currentSeason = null;
    if (!season || season === 'all') {
      // Default to current season unless 'all' is explicitly requested
      if (currentMonth >= 3 && currentMonth <= 5) currentSeason = 'spring';
      else if (currentMonth >= 6 && currentMonth <= 8) currentSeason = 'summer';
      else if (currentMonth >= 9 && currentMonth <= 11) currentSeason = 'fall';
      else currentSeason = 'winter';
    }

    const bundles = await prisma.service_bundles.findMany({
      where: {
        active: true,
        ...(season === 'all'
          ? {} // No season filter - show all
          : season
          ? { season } // Specific season
          : {
              OR: [{ season: currentSeason }, { season: null }], // Current season + year-round
            }),
      },
      orderBy: [{ display_order: 'asc' }, { created_at: 'desc' }],
    });

    // Convert Decimal fields to numbers
    const formattedBundles = bundles.map((bundle) => ({
      ...bundle,
      regularPrice: Number(bundle.regular_price),
      bundlePrice: Number(bundle.bundle_price),
      savings: Number(bundle.savings),
    }));

    return NextResponse.json({ bundles: formattedBundles });
  } catch (error) {
    console.error('Error fetching service bundles:', error);
    return NextResponse.json({ error: 'Failed to fetch service bundles' }, { status: 500 });
  }
}
