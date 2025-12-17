import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/provider/messages/unread-count
 * Get unread message counts for provider nav badge
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

    // Get crews this user is a member of
    const userCrews = await prisma.crew.findMany({
      where: {
        providerId: providerId,
        OR: [
          { userIds: { has: userId } },
          { leaderId: userId },
        ],
      },
      select: { id: true },
    });
    const userCrewIds = userCrews.map(c => c.id);

    // Count unread DMs to this user
    const dmUnread = await prisma.team_messages.count({
      where: {
        provider_id: providerId,
        sender_user_id: { not: userId },
        recipient_user_id: userId,
        read: false,
      },
    });

    // Count unread team broadcast messages (not sent by self)
    const broadcastUnread = await prisma.team_messages.count({
      where: {
        provider_id: providerId,
        sender_user_id: { not: userId },
        recipient_user_id: null,
        crew_id: null,
        NOT: { read_by: { has: userId } },
      },
    });

    // Count unread crew messages (only for crews user is member of)
    const crewUnread = userCrewIds.length > 0
      ? await prisma.team_messages.count({
          where: {
            provider_id: providerId,
            sender_user_id: { not: userId },
            crew_id: { in: userCrewIds },
            NOT: { read_by: { has: userId } },
          },
        })
      : 0;

    const teamUnread = dmUnread + broadcastUnread + crewUnread;

    // Count unread customer messages (received from customers, not yet read)
    const customerUnread = await prisma.provider_customer_messages.count({
      where: {
        provider_id: providerId,
        direction: 'received',
        status: { not: 'read' },
      },
    });

    return NextResponse.json({
      team: teamUnread,
      customers: customerUnread,
      total: teamUnread + customerUnread,
    });
  } catch (error) {
    console.error('[Provider Unread Count API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch unread count' },
      { status: 500 }
    );
  }
}
