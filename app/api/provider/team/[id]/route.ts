import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { geocodeAddress } from '@/lib/geocode';

const prisma = new PrismaClient();

/**
 * Remove a worker from all crews they belong to
 * Also clears leaderId if they were the leader
 */
async function cleanupWorkerFromCrews(workerId: string, providerId: string): Promise<void> {
  // Find all crews that contain this worker
  const crewsWithWorker = await prisma.crew.findMany({
    where: {
      providerId,
      userIds: { has: workerId },
    },
  });

  // Update each crew to remove the worker
  for (const crew of crewsWithWorker) {
    const updatedUserIds = crew.userIds.filter(id => id !== workerId);
    const updatedLeaderId = crew.leaderId === workerId ? null : crew.leaderId;

    await prisma.crew.update({
      where: { id: crew.id },
      data: {
        userIds: updatedUserIds,
        leaderId: updatedLeaderId,
      },
    });

    console.log(`🧹 Removed worker ${workerId} from crew "${crew.name}"`);
  }

  // Also clear leaderId for any crews where this worker was leader (belt and suspenders)
  await prisma.crew.updateMany({
    where: {
      providerId,
      leaderId: workerId,
    },
    data: {
      leaderId: null,
    },
  });
}

/**
 * PATCH /api/provider/team/[id]
 * Update a team member's status, role, or hourly rate
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, role, hourlyRate, payType, commissionRate, firstName, lastName, phone, skills, color, changedBy, canCreateJobs, jobsNeedApproval, homeAddress } = body;

    console.log('📝 Team member update request:', { id, payType, hourlyRate, commissionRate, homeAddress });

    // Get current user data before update (for status change logging)
    const currentUser = await prisma.providerUser.findUnique({
      where: { id },
      select: { status: true, providerId: true },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
      );
    }

    // Validate commission rate (must be between 0 and 100)
    if (commissionRate !== undefined && (commissionRate < 0 || commissionRate > 100)) {
      return NextResponse.json(
        { error: 'Commission rate must be between 0 and 100%' },
        { status: 400 }
      );
    }

    // Build update data object
    const updateData: Record<string, unknown> = {};
    if (status !== undefined) updateData.status = status;
    if (role !== undefined) updateData.role = role;
    if (hourlyRate !== undefined) updateData.hourlyRate = hourlyRate;
    if (payType !== undefined) updateData.payType = payType;
    if (commissionRate !== undefined) updateData.commissionRate = commissionRate;
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (phone !== undefined) updateData.phone = phone;
    if (skills !== undefined) updateData.skills = skills;
    if (color !== undefined) updateData.color = color;
    if (canCreateJobs !== undefined) updateData.canCreateJobs = canCreateJobs;
    if (jobsNeedApproval !== undefined) updateData.jobsNeedApproval = jobsNeedApproval;

    // Handle home address update with geocoding
    if (homeAddress !== undefined) {
      updateData.homeAddress = homeAddress || null;

      // Geocode the address if provided
      if (homeAddress && homeAddress.trim()) {
        try {
          const coords = await geocodeAddress(homeAddress.trim());
          if (coords) {
            updateData.homeLatitude = coords.lat;
            updateData.homeLongitude = coords.lng;
            console.log(`📍 Geocoded home address: ${homeAddress} -> ${coords.lat}, ${coords.lng}`);
          } else {
            console.warn(`⚠️ Could not geocode home address: ${homeAddress}`);
            // Clear coordinates if we can't geocode
            updateData.homeLatitude = null;
            updateData.homeLongitude = null;
          }
        } catch (geocodeError) {
          console.error('Geocoding error:', geocodeError);
          // Don't fail the update, just clear coordinates
          updateData.homeLatitude = null;
          updateData.homeLongitude = null;
        }
      } else {
        // Clear coordinates if address is cleared
        updateData.homeLatitude = null;
        updateData.homeLongitude = null;
      }
    }

    console.log('📝 Updating with data:', updateData);

    const updated = await prisma.providerUser.update({
      where: { id },
      data: updateData,
    });

    console.log('✅ Updated team member:', { payType: updated.payType, hourlyRate: updated.hourlyRate, commissionRate: updated.commissionRate });

    // Log status change for audit trail (billing fraud prevention)
    if (status !== undefined && status !== currentUser.status) {
      await prisma.userStatusLog.create({
        data: {
          userId: id,
          providerId: currentUser.providerId,
          oldStatus: currentUser.status,
          newStatus: status,
          changedBy: changedBy || 'unknown',
        },
      });
      console.log(`📋 Status change logged: ${currentUser.status} → ${status} for user ${id}`);

      // If worker is being deactivated, clean up their crew memberships
      if (status === 'inactive' || status === 'terminated') {
        await cleanupWorkerFromCrews(id, currentUser.providerId);
      }
    }

    return NextResponse.json(updated);
  } catch (error: unknown) {
    console.error('Error updating team member:', error);

    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update team member' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/provider/team/[id]
 * Delete a team member
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get the user's providerId before deletion for crew cleanup
    const user = await prisma.providerUser.findUnique({
      where: { id },
      select: { providerId: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
      );
    }

    // Clean up crew memberships before deleting
    await cleanupWorkerFromCrews(id, user.providerId);

    // Now delete the user
    await prisma.providerUser.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error deleting team member:', error);

    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete team member' },
      { status: 500 }
    );
  }
}
