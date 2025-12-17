import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { geocodeAddress } from '@/lib/geocode';

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
      timeZone,
    } = body;

    if (!providerId) {
      return NextResponse.json(
        { error: 'Provider ID is required' },
        { status: 400 }
      );
    }

    // Validate required fields for business address
    // Note: businessName, taxId, and businessEntity are optional here since they may be set from the profile section
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

    // Geocode the business address for route optimization
    const fullAddress = `${businessAddress.trim()}, ${city.trim()}, ${state.trim()} ${zipCode.trim()}`;
    let officeLatitude: number | null = null;
    let officeLongitude: number | null = null;

    try {
      const coords = await geocodeAddress(fullAddress);
      if (coords) {
        officeLatitude = coords.lat;
        officeLongitude = coords.lng;
        console.log(`[Business Settings] Geocoded office: ${fullAddress} -> ${officeLatitude}, ${officeLongitude}`);
      } else {
        console.warn(`[Business Settings] Could not geocode address: ${fullAddress}`);
      }
    } catch (geocodeError) {
      console.error('[Business Settings] Geocoding error:', geocodeError);
      // Continue without coordinates - don't fail the entire save
    }

    // Update provider business settings
    const provider = await prisma.provider.update({
      where: { id: providerId },
      data: {
        // Optional fields - only update if provided
        ...(businessName?.trim() && { businessName: businessName.trim() }),
        ...(taxId?.trim() && { taxId: taxId.trim() }),
        ...(businessEntity && { businessEntity }),
        // Required address fields
        businessAddress: businessAddress.trim(),
        city: city.trim(),
        state: state.trim(),
        zipCode: zipCode.trim(),
        serviceRadius: serviceRadius !== undefined ? parseInt(serviceRadius) : undefined,
        website: website || undefined,
        businessHours: businessHours || undefined,
        timeZone: timeZone || undefined,
        // Save geocoded coordinates
        officeLatitude,
        officeLongitude,
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
        timeZone: true,
        officeLatitude: true,
        officeLongitude: true,
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
        timeZone: true,
        officeLatitude: true,
        officeLongitude: true,
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
