import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PATCH /api/provider/team/[id]/reactivate - Reactivate a deactivated team member
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { providerId, userId: requestingUserId } = body;

    if (!providerId || !requestingUserId) {
      return NextResponse.json(
        { success: false, error: 'Provider ID and User ID required' },
        { status: 400 }
      );
    }

    // Verify requesting user has permission (owner or office)
    const requestingUser = await prisma.providerUser.findUnique({
      where: { id: requestingUserId },
      select: { role: true, providerId: true },
    });

    if (!requestingUser || requestingUser.providerId !== providerId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (requestingUser.role !== 'owner' && requestingUser.role !== 'office') {
      return NextResponse.json(
        { success: false, error: 'Only owners and office staff can reactivate team members' },
        { status: 403 }
      );
    }

    // Get target member
    const targetMember = await prisma.providerUser.findUnique({
      where: { id },
      select: { id: true, providerId: true, status: true },
    });

    if (!targetMember) {
      return NextResponse.json(
        { success: false, error: 'Team member not found' },
        { status: 404 }
      );
    }

    if (targetMember.providerId !== providerId) {
      return NextResponse.json(
        { success: false, error: 'Team member does not belong to this provider' },
        { status: 403 }
      );
    }

    // Check if member can be reactivated
    if (targetMember.status === 'active') {
      return NextResponse.json(
        { success: false, error: 'Team member is already active' },
        { status: 400 }
      );
    }

    // Reactivate member
    const reactivatedMember = await prisma.providerUser.update({
      where: { id },
      data: { status: 'active' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        status: true,
        skills: true,
        color: true,
        hourlyRate: true,
        workingHours: true,
        profilePhotoUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: reactivatedMember,
      message: 'Team member reactivated successfully',
    });
  } catch (error) {
    console.error('Error reactivating team member:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reactivate team member' },
      { status: 500 }
    );
  }
}
