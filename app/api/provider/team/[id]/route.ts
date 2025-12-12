import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * PATCH /api/provider/team/[id]
 * Update a team member's status, role, or hourly rate
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { status, role, hourlyRate, payType, commissionRate, firstName, lastName, phone, skills, color, changedBy } = body;

    // Get current user data before update (for status change logging)
    const currentUser = await prisma.providerUser.findUnique({
      where: { id: params.id },
      select: { status: true, providerId: true },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
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

    const updated = await prisma.providerUser.update({
      where: { id: params.id },
      data: updateData,
    });

    // Log status change for audit trail (billing fraud prevention)
    if (status !== undefined && status !== currentUser.status) {
      await prisma.userStatusLog.create({
        data: {
          userId: params.id,
          providerId: currentUser.providerId,
          oldStatus: currentUser.status,
          newStatus: status,
          changedBy: changedBy || 'unknown',
        },
      });
      console.log(`📋 Status change logged: ${currentUser.status} → ${status} for user ${params.id}`);
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating team member:', error);

    if (error.code === 'P2025') {
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
  { params }: { params: { id: string } }
) {
  try {
    await prisma.providerUser.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting team member:', error);

    if (error.code === 'P2025') {
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
