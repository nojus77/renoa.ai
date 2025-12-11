import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      providerId,
      businessName,
      businessAddress,
      city,
      state,
      zipCode,
      taxId,
      businessEntity,
      serviceRadius,
      website,
      businessHours,
    } = body;

    if (!providerId) {
      return NextResponse.json(
        { error: 'Provider ID is required' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!businessName?.trim()) {
      return NextResponse.json(
        { error: 'Business name is required' },
        { status: 400 }
      );
    }
    if (!taxId?.trim()) {
      return NextResponse.json(
        { error: 'EIN/Tax ID is required' },
        { status: 400 }
      );
    }
    if (!businessAddress?.trim()) {
      return NextResponse.json(
        { error: 'Business address is required' },
        { status: 400 }
      );
    }
    if (!city?.trim()) {
      return NextResponse.json(
        { error: 'City is required' },
        { status: 400 }
      );
    }
    if (!state?.trim()) {
      return NextResponse.json(
        { error: 'State is required' },
        { status: 400 }
      );
    }
    if (!zipCode?.trim()) {
      return NextResponse.json(
        { error: 'ZIP code is required' },
        { status: 400 }
      );
    }
    if (!businessEntity) {
      return NextResponse.json(
        { error: 'Business entity type is required' },
        { status: 400 }
      );
    }

    // Update provider business settings
    const provider = await prisma.provider.update({
      where: { id: providerId },
      data: {
        businessName: businessName.trim(),
        businessAddress: businessAddress.trim(),
        city: city.trim(),
        state: state.trim(),
        zipCode: zipCode.trim(),
        taxId: taxId.trim(),
        businessEntity: businessEntity,
        serviceRadius: serviceRadius !== undefined ? parseInt(serviceRadius) : undefined,
        website: website || undefined,
        businessHours: businessHours || undefined,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        businessName: true,
        businessAddress: true,
        city: true,
        state: true,
        zipCode: true,
        taxId: true,
        businessEntity: true,
        serviceRadius: true,
        website: true,
        businessHours: true,
      },
    });

    return NextResponse.json({
      success: true,
      provider
    });
  } catch (error) {
    console.error('Error updating business settings:', error);
    return NextResponse.json(
      { error: 'Failed to update business settings' },
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
        businessName: true,
        businessAddress: true,
        city: true,
        state: true,
        zipCode: true,
        taxId: true,
        businessEntity: true,
        serviceRadius: true,
        website: true,
        businessHours: true,
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
    console.error('Error fetching business settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch business settings' },
      { status: 500 }
    );
  }
}
