import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/provider/messages/team/conversations
 * Get list of team conversations for a provider user with proper sorting:
 * - Conversations with messages: sorted by most recent first
 * - Office/Owner roles pinned at top (until they have messages)
 * - Crew chats the user belongs to
 * - Team chat
 * - Field workers without messages at bottom
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('providerId');
    const userId = searchParams.get('userId');

    if (!providerId || !userId) {
      return NextResponse.json(
        { error: 'Provider ID and User ID are required' },
        { status: 400 }
      );
    }

    // Get current user's role
    const currentUser = await prisma.providerUser.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    // Get all active team members (excluding self)
    const teamMembers = await prisma.providerUser.findMany({
      where: {
        providerId: providerId,
        status: 'active',
        id: { not: userId },
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

    // Get crews the user belongs to (for owners/office, get all crews)
    const crewsWhere = currentUser?.role === 'field'
      ? {
          providerId: providerId,
          OR: [
            { userIds: { has: userId } },
            { leaderId: userId },
          ],
        }
      : {
          providerId: providerId,
        };

    const crews = await prisma.crew.findMany({
      where: crewsWhere,
      select: {
        id: true,
        name: true,
        color: true,
        userIds: true,
        leaderId: true,
        createdAt: true,
      },
    });

    // Get unread count for team-wide messages (not sent by self, crew_id is null)
    const teamUnread = await prisma.team_messages.count({
      where: {
        provider_id: providerId,
        recipient_user_id: null,
        crew_id: null,
        sender_user_id: { not: userId },
        NOT: { read_by: { has: userId } },
      },
    });

    // Get last team message
    const lastTeamMessage = await prisma.team_messages.findFirst({
      where: {
        provider_id: providerId,
        recipient_user_id: null,
        crew_id: null,
      },
      orderBy: { created_at: 'desc' },
      include: {
        sender: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Get crew conversations with unread counts and last messages
    const crewConversations = await Promise.all(
      crews.map(async (crew) => {
        const unreadCount = await prisma.team_messages.count({
          where: {
            provider_id: providerId,
            crew_id: crew.id,
            sender_user_id: { not: userId },
            NOT: { read_by: { has: userId } },
          },
        });

        const lastMessage = await prisma.team_messages.findFirst({
          where: {
            provider_id: providerId,
            crew_id: crew.id,
          },
          orderBy: { created_at: 'desc' },
          include: {
            sender: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        });

        // Count members (unique userIds + leaderId)
        const memberIds = new Set([...crew.userIds, ...(crew.leaderId ? [crew.leaderId] : [])]);

        const summaryText = lastMessage?.content?.trim()
          ? lastMessage.content.trim()
          : lastMessage?.mediaUrl
            ? 'Photo'
            : '';

        return {
          id: `crew-${crew.id}`,
          crewId: crew.id,
          type: 'crew' as const,
          name: crew.name,
          color: crew.color,
          memberCount: memberIds.size,
          leaderId: crew.leaderId,
          lastMessage: summaryText
            ? `${lastMessage!.sender.firstName}: ${summaryText}`
            : null,
          lastMessageAt: lastMessage?.created_at?.toISOString() || null,
          unreadCount,
          createdAt: crew.createdAt.toISOString(),
        };
      })
    );

    // Get unread counts and last messages for each team member
    const memberConversations = await Promise.all(
      teamMembers.map(async (member) => {
        const unreadCount = await prisma.team_messages.count({
          where: {
            provider_id: providerId,
            sender_user_id: member.id,
            recipient_user_id: userId,
            read: false,
          },
        });

        const lastMessage = await prisma.team_messages.findFirst({
          where: {
            provider_id: providerId,
            crew_id: null,
            OR: [
              { sender_user_id: userId, recipient_user_id: member.id },
              { sender_user_id: member.id, recipient_user_id: userId },
            ],
          },
          orderBy: { created_at: 'desc' },
        });

        const summaryText = lastMessage?.content?.trim()
          ? lastMessage.content.trim()
          : lastMessage?.mediaUrl
            ? 'Photo'
            : '';

        return {
          id: member.id,
          type: 'member' as const,
          name: `${member.firstName} ${member.lastName}`,
          email: member.email,
          role: member.role,
          avatar: member.profilePhotoUrl,
          lastMessage: summaryText || null,
          lastMessageAt: lastMessage?.created_at?.toISOString() || null,
          unreadCount,
        };
      })
    );

    // Sort conversations:
    // 1. Conversations WITH messages: by most recent
    // 2. Conversations WITHOUT messages: office/owner first, then field workers
    const withMessages = memberConversations.filter(c => c.lastMessageAt);
    const withoutMessages = memberConversations.filter(c => !c.lastMessageAt);

    // Sort by most recent message
    withMessages.sort((a, b) => {
      return new Date(b.lastMessageAt!).getTime() - new Date(a.lastMessageAt!).getTime();
    });

    // Sort without messages: office/owner first, then alphabetically
    const roleOrder: Record<string, number> = { owner: 0, office: 1, field: 2 };
    withoutMessages.sort((a, b) => {
      const roleA = roleOrder[a.role] ?? 3;
      const roleB = roleOrder[b.role] ?? 3;
      if (roleA !== roleB) return roleA - roleB;
      return a.name.localeCompare(b.name);
    });

    // Sort crew conversations by last message (or creation date if no messages)
    crewConversations.sort((a, b) => {
      if (a.lastMessageAt && b.lastMessageAt) {
        return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
      }
      if (a.lastMessageAt) return -1;
      if (b.lastMessageAt) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return NextResponse.json({
      teamChat: {
        id: 'team',
        type: 'team',
        name: 'Team Chat',
        unreadCount: teamUnread,
        lastMessage: (() => {
          if (!lastTeamMessage) return null;
          const summaryText = lastTeamMessage.content?.trim()
            ? lastTeamMessage.content.trim()
            : lastTeamMessage.mediaUrl
              ? 'Photo'
              : '';
          return summaryText ? `${lastTeamMessage.sender.firstName}: ${summaryText}` : null;
        })(),
        lastMessageAt: lastTeamMessage?.created_at?.toISOString() || null,
      },
      crews: crewConversations,
      conversations: [...withMessages, ...withoutMessages],
    });
  } catch (error) {
    console.error('[Provider Team Conversations API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team conversations' },
      { status: 500 }
    );
  }
}
