import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET provider profile
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('providerId') || searchParams.get('id');

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
        ownerName: true,
        email: true,
        phone: true,
        serviceTypes: true,
        serviceAreas: true,
        yearsInBusiness: true,
        avatar: true,
        profilePhotoUrl: true,
        bio: true,
        certifications: true,
        onboardingCompleted: true,
        workingHours: true,
        timeZone: true,
        bufferTime: true,
        advanceBooking: true,
        availabilityNotes: true,
        rating: true,
        totalLeadsSent: true,
        leadsAccepted: true,
        leadsConverted: true,
        totalRevenue: true,
        createdAt: true,
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
    console.error('Error fetching provider profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

// POST update provider profile
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      providerId,
      businessName,
      ownerName,
      bio,
      serviceTypes,
      serviceAreas,
      yearsInBusiness,
      certifications,
      avatar,
      onboardingCompleted,
    } = body;

    if (!providerId) {
      return NextResponse.json(
        { error: 'Provider ID is required' },
        { status: 400 }
      );
    }

    // Build update data object
    const updateData: any = {};

    if (businessName !== undefined) updateData.businessName = businessName;
    if (ownerName !== undefined) updateData.ownerName = ownerName;
    if (bio !== undefined) updateData.bio = bio;
    if (serviceTypes !== undefined) updateData.serviceTypes = serviceTypes;
    if (serviceAreas !== undefined) updateData.serviceAreas = serviceAreas;
    if (yearsInBusiness !== undefined) updateData.yearsInBusiness = yearsInBusiness;
    if (certifications !== undefined) updateData.certifications = certifications;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (onboardingCompleted !== undefined) updateData.onboardingCompleted = onboardingCompleted;

    const updatedProvider = await prisma.provider.update({
      where: { id: providerId },
      data: updateData,
    });

    console.log('✅ Profile updated for provider:', providerId);

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      provider: updatedProvider,
    });
  } catch (error) {
    console.error('Error updating provider profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
