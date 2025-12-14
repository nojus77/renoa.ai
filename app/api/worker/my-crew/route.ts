import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/worker/my-crew
 * Get the crew that the current worker belongs to
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }

    // Find crew where this worker is a member
    const crew = await prisma.crew.findFirst({
      where: {
        userIds: { has: userId },
      },
      include: {
        provider: {
          select: {
            businessName: true,
          },
        },
      },
    });

    if (!crew) {
      return NextResponse.json({ crew: null });
    }

    // Get crew member details
    const members = await prisma.providerUser.findMany({
      where: {
        id: { in: crew.userIds },
        status: 'active',
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        profilePhotoUrl: true,
        profilePhotoBlobPath: true,
        role: true,
      },
    });

    // Get leader details
    const leader = crew.leaderId
      ? members.find((m) => m.id === crew.leaderId)
      : null;

    // Format members (excluding self)
    const formattedMembers = members
      .filter((m) => m.id !== userId)
      .map((m) => ({
        id: m.id,
        name: `${m.firstName} ${m.lastName}`,
        profilePhotoUrl: m.profilePhotoBlobPath || m.profilePhotoUrl,
        role: m.role,
      }));

    return NextResponse.json({
      crew: {
        id: crew.id,
        name: crew.name,
        color: crew.color,
        leader: leader
          ? {
              id: leader.id,
              name: `${leader.firstName} ${leader.lastName}`,
              profilePhotoUrl: leader.profilePhotoBlobPath || leader.profilePhotoUrl,
            }
          : null,
        members: formattedMembers,
        memberCount: members.length,
      },
    });
  } catch (error) {
    console.error('Error fetching worker crew:', error);
    return NextResponse.json(
      { error: 'Failed to fetch crew' },
      { status: 500 }
    );
  }
}
