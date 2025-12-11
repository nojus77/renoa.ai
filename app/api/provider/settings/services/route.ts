import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      providerId,
      servicePricing, // Object with service types and their min/max prices
      minimumJobValue,
      depositRequired,
      depositPercentage,
    } = body;

    if (!providerId) {
      return NextResponse.json(
        { error: 'Provider ID is required' },
        { status: 400 }
      );
    }

    // Update provider service/pricing settings
    const provider = await prisma.provider.update({
      where: { id: providerId },
      data: {
        servicePricing: servicePricing || undefined,
        minimumJobValue: minimumJobValue !== undefined ? parseFloat(minimumJobValue) : undefined,
        depositRequired: depositRequired !== undefined ? depositRequired : undefined,
        depositPercentage: depositPercentage !== undefined ? parseInt(depositPercentage) : undefined,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        servicePricing: true,
        minimumJobValue: true,
        depositRequired: true,
        depositPercentage: true,
      },
    });

    return NextResponse.json({
      success: true,
      provider
    });
  } catch (error) {
    console.error('Error updating service settings:', error);
    return NextResponse.json(
      { error: 'Failed to update service settings' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('providerId');

    if (!providerId) {
      return NextResponse.json(
        { error: 'Provider ID is required' },
        { status: 400 }
      );
    }

    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
      select: {
        id: true,
        servicePricing: true,
        minimumJobValue: true,
        depositRequired: true,
        depositPercentage: true,
      },
    });

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ provider });
  } catch (error) {
    console.error('Error fetching service settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch service settings' },
      { status: 500 }
    );
  }
}
