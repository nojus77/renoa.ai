import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * POST /api/property/streetview
 * Get Street View URL for an address, caching it in the customer record
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, address } = body;

    if (!address) {
      return NextResponse.json({ error: 'Address required' }, { status: 400 });
    }

    // Check if already cached
    if (customerId) {
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        select: { streetViewUrl: true },
      });

      if (customer?.streetViewUrl) {
        return NextResponse.json({ url: customer.streetViewUrl, cached: true });
      }
    }

    // Generate Street View URL
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Google Maps API key not configured' },
        { status: 500 }
      );
    }

    const streetViewUrl = `https://maps.googleapis.com/maps/api/streetview?size=600x400&location=${encodeURIComponent(address)}&key=${apiKey}`;

    // Cache it if we have customerId
    if (customerId) {
      await prisma.customer.update({
        where: { id: customerId },
        data: { streetViewUrl },
      });
    }

    return NextResponse.json({ url: streetViewUrl, cached: false });
  } catch (error) {
    console.error('Error fetching street view:', error);
    return NextResponse.json(
      { error: 'Failed to fetch street view' },
      { status: 500 }
    );
  }
}
