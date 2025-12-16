import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/provider/messages/team/members
 * Get members of a team chat or crew chat
 * Query params:
 * - providerId: provider ID
 * - userId: current user ID
 * - type: 'team' | 'crew'
 * - crewId: (optional) crew ID if type is 'crew'
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('providerId');
    const userId = searchParams.get('userId');
    const type = searchParams.get('type') || 'team';
    const crewId = searchParams.get('crewId');

    if (!providerId || !userId) {
      return NextResponse.json(
        { error: 'Provider ID and User ID are required' },
        { status: 400 }
      );
    }

    // Verify user belongs to provider
    const user = await prisma.providerUser.findFirst({
      where: {
        id: userId,
        providerId: providerId,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (type === 'crew' && crewId) {
      // Get crew members
      const crew = await prisma.crew.findFirst({
        where: {
          id: crewId,
          providerId: providerId,
        },
      });

      if (!crew) {
        return NextResponse.json({ error: 'Crew not found' }, { status: 404 });
      }

      // Get all member IDs (userIds + leaderId)
      const memberIds = new Set([...crew.userIds, ...(crew.leaderId ? [crew.leaderId] : [])]);

      const members = await prisma.providerUser.findMany({
        where: {
          id: { in: Array.from(memberIds) },
          providerId: providerId,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          profilePhotoUrl: true,
        },
        orderBy: [
          { role: 'asc' },
          { firstName: 'asc' },
        ],
      });

      // Format members with lead indicator
      const formattedMembers = members.map((member) => ({
        id: member.id,
        name: `${member.firstName} ${member.lastName}`,
        email: member.email,
        role: member.role,
        avatar: member.profilePhotoUrl,
        isLead: member.id === crew.leaderId,
      }));

      // Sort to put lead first
      formattedMembers.sort((a, b) => {
        if (a.isLead && !b.isLead) return -1;
        if (!a.isLead && b.isLead) return 1;
        return 0;
      });

      return NextResponse.json({
        type: 'crew',
        name: crew.name,
        color: crew.color,
        memberCount: formattedMembers.length,
        createdAt: crew.createdAt.toISOString(),
        members: formattedMembers,
      });
    } else {
      // Get all team members (for team-wide chat)
      const members = await prisma.providerUser.findMany({
        where: {
          providerId: providerId,
          status: 'active',
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          profilePhotoUrl: true,
        },
        orderBy: [
          { role: 'asc' },
          { firstName: 'asc' },
        ],
      });

      // Sort by role order: owner, office, field
      const roleOrder: Record<string, number> = { owner: 0, office: 1, field: 2 };
      const sortedMembers = [...members].sort((a, b) => {
        const roleA = roleOrder[a.role] ?? 3;
        const roleB = roleOrder[b.role] ?? 3;
        if (roleA !== roleB) return roleA - roleB;
        return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
      });

      const formattedMembers = sortedMembers.map((member) => ({
        id: member.id,
        name: `${member.firstName} ${member.lastName}`,
        email: member.email,
        role: member.role,
        avatar: member.profilePhotoUrl,
        isCurrentUser: member.id === userId,
      }));

      return NextResponse.json({
        type: 'team',
        name: 'Team Chat',
        memberCount: formattedMembers.length,
        members: formattedMembers,
      });
    }
  } catch (error) {
    console.error('[Provider Team Members API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team members' },
      { status: 500 }
    );
  }
}
