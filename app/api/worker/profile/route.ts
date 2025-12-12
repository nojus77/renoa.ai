import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
        createdAt: true,
        canCreateJobs: true,
        jobsNeedApproval: true,
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

    return NextResponse.json({ user });
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
    const { userId, firstName, lastName, phone } = body;

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

    const updated = await prisma.providerUser.update({
      where: { id: userId },
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone || null,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
      },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error: any) {
    console.error('Error updating worker profile:', error);

    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
