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

    // Count unread team messages (DMs to this user + team broadcast + crew messages)
    const teamUnread = await prisma.team_messages.count({
      where: {
        provider_id: providerId,
        sender_user_id: { not: userId },
        OR: [
          // Direct messages to this user
          { recipient_user_id: userId, read: false },
          // Team broadcast messages not read by this user
          { recipient_user_id: null, crew_id: null, NOT: { read_by: { has: userId } } },
          // Crew messages not read by this user (user must be in crew)
          { crew_id: { not: null }, NOT: { read_by: { has: userId } } },
        ],
      },
    });

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
