import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * PUT /api/provider/crews/[id]
 * Update a crew
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { name, userIds, providerId, leaderId, color } = body;

    if (!providerId) {
      return NextResponse.json(
        { error: 'Provider ID required' },
        { status: 400 }
      );
    }

    // Verify crew belongs to provider
    const existingCrew = await prisma.crew.findUnique({
      where: { id },
    });

    if (!existingCrew) {
      return NextResponse.json(
        { error: 'Crew not found' },
        { status: 404 }
      );
    }

    if (existingCrew.providerId !== providerId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Verify all user IDs belong to this provider
    if (userIds && userIds.length > 0) {
      const users = await prisma.providerUser.findMany({
        where: {
          id: { in: userIds },
          providerId,
        },
      });

      if (users.length !== userIds.length) {
        return NextResponse.json(
          { error: 'Some user IDs do not belong to this provider' },
          { status: 400 }
        );
      }
    }

    // Verify leader ID if provided
    const finalUserIds = userIds !== undefined ? userIds : existingCrew.userIds;
    if (leaderId && !finalUserIds.includes(leaderId)) {
      return NextResponse.json(
        { error: 'Leader must be a member of the crew' },
        { status: 400 }
      );
    }

    const crew = await prisma.crew.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(userIds !== undefined && { userIds }),
        ...(leaderId !== undefined && { leaderId }),
        ...(color && { color }),
      },
    });

    // Fetch user details
    const users = await prisma.providerUser.findMany({
      where: {
        id: { in: crew.userIds },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        profilePhotoUrl: true,
      },
    });

    return NextResponse.json({
      success: true,
      crew: {
        ...crew,
        users,
        memberCount: crew.userIds.length,
      },
    });
  } catch (error) {
    console.error('Error updating crew:', error);
    return NextResponse.json(
      { error: 'Failed to update crew' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/provider/crews/[id]
 * Delete a crew
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const searchParams = request.nextUrl.searchParams;
    const providerId = searchParams.get('providerId');

    if (!providerId) {
      return NextResponse.json(
        { error: 'Provider ID required' },
        { status: 400 }
      );
    }

    // Verify crew belongs to provider
    const existingCrew = await prisma.crew.findUnique({
      where: { id },
    });

    if (!existingCrew) {
      return NextResponse.json(
        { error: 'Crew not found' },
        { status: 404 }
      );
    }

    if (existingCrew.providerId !== providerId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    await prisma.crew.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Crew deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting crew:', error);
    return NextResponse.json(
      { error: 'Failed to delete crew' },
      { status: 500 }
    );
  }
}
