import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { geocodeAddress } from '@/lib/geocode';

export const dynamic = 'force-dynamic';

// GET worker profile
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const user = await prisma.providerUser.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        color: true,
        profilePhotoUrl: true,
        hourlyRate: true,
        payType: true,
        commissionRate: true,
        workingHours: true,
        homeAddress: true,
        homeLatitude: true,
        homeLongitude: true,
        createdAt: true,
        canCreateJobs: true,
        jobsNeedApproval: true,
        skills: true, // For equipment stored with EQUIP: prefix
        workerSkills: {
          include: {
            skill: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        provider: {
          select: {
            id: true,
            businessName: true,
            phone: true,
            email: true,
            primaryCategory: true,
            workersCanCreateJobs: true,
            workerJobsNeedApproval: true,
            workersCanEditSkills: true,
            workersCanEditAvailability: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Extract equipment from skills field (items with EQUIP: prefix)
    const equipment = (user.skills || [])
      .filter(s => s.startsWith('EQUIP:'))
      .map(s => s.replace('EQUIP:', ''));

    // Calculate jobs this week
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const jobsThisWeek = await prisma.job.count({
      where: {
        assignedUserIds: { has: userId },
        status: 'completed',
        completedAt: { gte: startOfWeek },
      },
    });

    // Return user with equipment added
    return NextResponse.json({
      user: { ...user, equipment },
      stats: { jobsThisWeek }
    });
  } catch (error) {
    console.error('Error fetching worker profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

// PUT - Update worker profile (limited fields - workers can only edit their own basic info)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, firstName, lastName, phone, homeAddress } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Validate required fields
    if (!firstName?.trim() || !lastName?.trim()) {
      return NextResponse.json({ error: 'First name and last name are required' }, { status: 400 });
    }

    // Optional phone validation
    if (phone) {
      const phoneDigits = phone.replace(/\D/g, '');
      if (phoneDigits.length > 0 && phoneDigits.length !== 10) {
        return NextResponse.json({ error: 'Phone number must be 10 digits' }, { status: 400 });
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone || null,
    };

    // Handle home address with geocoding
    if (homeAddress !== undefined) {
      updateData.homeAddress = homeAddress || null;

      if (homeAddress && homeAddress.trim()) {
        try {
          const coords = await geocodeAddress(homeAddress.trim());
          if (coords) {
            updateData.homeLatitude = coords.lat;
            updateData.homeLongitude = coords.lng;
            console.log(`📍 Geocoded worker home address: ${homeAddress} -> ${coords.lat}, ${coords.lng}`);
          } else {
            console.warn(`⚠️ Could not geocode home address: ${homeAddress}`);
            updateData.homeLatitude = null;
            updateData.homeLongitude = null;
          }
        } catch (geocodeError) {
          console.error('Geocoding error:', geocodeError);
          updateData.homeLatitude = null;
          updateData.homeLongitude = null;
        }
      } else {
        updateData.homeLatitude = null;
        updateData.homeLongitude = null;
      }
    }

    const updated = await prisma.providerUser.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        homeAddress: true,
        homeLatitude: true,
        homeLongitude: true,
      },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error: unknown) {
    console.error('Error updating worker profile:', error);

    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
