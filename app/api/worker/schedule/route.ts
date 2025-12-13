import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * PUT /api/worker/schedule
 * Update worker's working hours schedule
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, workingHours } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Verify user exists and get provider settings
    const user = await prisma.providerUser.findUnique({
      where: { id: userId },
      select: {
        id: true,
        provider: {
          select: {
            workersCanEditAvailability: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if worker is allowed to edit availability
    if (!user.provider.workersCanEditAvailability) {
      return NextResponse.json(
        { error: 'You do not have permission to edit your schedule' },
        { status: 403 }
      );
    }

    // Update working hours
    const updated = await prisma.providerUser.update({
      where: { id: userId },
      data: {
        workingHours: workingHours || {},
      },
      select: {
        id: true,
        workingHours: true,
      },
    });

    return NextResponse.json({
      success: true,
      workingHours: updated.workingHours,
    });
  } catch (error) {
    console.error('Error updating worker schedule:', error);
    return NextResponse.json(
      { error: 'Failed to update schedule' },
      { status: 500 }
    );
  }
}
