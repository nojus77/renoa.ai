import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/worker/messages/team/conversations
 * Get list of team conversations for a worker
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get worker's provider
    const worker = await prisma.providerUser.findUnique({
      where: { id: userId },
      select: { providerId: true },
    });

    if (!worker?.providerId) {
      return NextResponse.json({ error: 'Worker not found' }, { status: 404 });
    }

    // Get all active team members (excluding self)
    const teamMembers = await prisma.providerUser.findMany({
      where: {
        providerId: worker.providerId,
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
      orderBy: [
        { role: 'asc' },
        { firstName: 'asc' },
      ],
    });

    // Get unread count for team-wide messages
    const teamUnread = await prisma.team_messages.count({
      where: {
        provider_id: worker.providerId,
        recipient_user_id: null,
        sender_user_id: { not: userId },
        read: false,
      },
    });

    // Get last team message
    const lastTeamMessage = await prisma.team_messages.findFirst({
      where: {
        provider_id: worker.providerId,
        recipient_user_id: null,
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

    // Get unread counts and last messages for each team member
    const conversations = await Promise.all(
      teamMembers.map(async (member) => {
        const unreadCount = await prisma.team_messages.count({
          where: {
            provider_id: worker.providerId,
            sender_user_id: member.id,
            recipient_user_id: userId,
            read: false,
          },
        });

        const lastMessage = await prisma.team_messages.findFirst({
          where: {
            provider_id: worker.providerId,
            OR: [
              { sender_user_id: userId, recipient_user_id: member.id },
              { sender_user_id: member.id, recipient_user_id: userId },
            ],
          },
          orderBy: { created_at: 'desc' },
        });

        return {
          id: member.id,
          name: `${member.firstName} ${member.lastName}`,
          email: member.email,
          role: member.role,
          avatar: member.profilePhotoUrl,
          lastMessage: lastMessage?.content || null,
          lastMessageAt: lastMessage?.created_at?.toISOString() || null,
          unreadCount,
        };
      })
    );

    // Sort by last message time
    conversations.sort((a, b) => {
      if (!a.lastMessageAt && !b.lastMessageAt) return 0;
      if (!a.lastMessageAt) return 1;
      if (!b.lastMessageAt) return -1;
      return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
    });

    return NextResponse.json({
      teamChat: {
        id: 'team',
        name: 'Team Chat',
        unreadCount: teamUnread,
        lastMessage: lastTeamMessage
          ? `${lastTeamMessage.sender.firstName}: ${lastTeamMessage.content}`
          : null,
        lastMessageAt: lastTeamMessage?.created_at?.toISOString() || null,
      },
      conversations,
    });
  } catch (error) {
    console.error('[Worker Team Conversations API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team conversations' },
      { status: 500 }
    );
  }
}
