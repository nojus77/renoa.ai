import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/worker/messages/unread-count
 * Get unread message counts for worker nav badge
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get worker's provider
    const worker = await prisma.providerUser.findUnique({
      where: { id: userId },
      select: { providerId: true },
    });

    if (!worker?.providerId) {
      return NextResponse.json(
        { error: 'Worker not found' },
        { status: 404 }
      );
    }

    const providerId = worker.providerId;

    // Get crews this worker is a member of
    const workerCrews = await prisma.crew.findMany({
      where: {
        providerId: providerId,
        OR: [
          { userIds: { has: userId } },
          { leaderId: userId },
        ],
      },
      select: { id: true },
    });
    const workerCrewIds = workerCrews.map(c => c.id);

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

    // Count unread crew messages (only for crews worker is member of)
    const crewUnread = workerCrewIds.length > 0
      ? await prisma.team_messages.count({
          where: {
            provider_id: providerId,
            sender_user_id: { not: userId },
            crew_id: { in: workerCrewIds },
            NOT: { read_by: { has: userId } },
          },
        })
      : 0;

    const teamUnread = dmUnread + broadcastUnread + crewUnread;

    // Get customer IDs from jobs assigned to this worker
    const assignedJobs = await prisma.job.findMany({
      where: {
        assignedUserIds: { has: userId },
        status: { not: 'cancelled' },
      },
      select: { customerId: true },
    });

    const customerIds = Array.from(new Set(assignedJobs.map(job => job.customerId)));

    // Count unread customer messages for these customers
    const customerUnread = customerIds.length > 0
      ? await prisma.provider_customer_messages.count({
          where: {
            provider_id: providerId,
            customer_id: { in: customerIds },
            direction: 'received',
            status: { not: 'read' },
          },
        })
      : 0;

    return NextResponse.json({
      team: teamUnread,
      customers: customerUnread,
      total: teamUnread + customerUnread,
    });
  } catch (error) {
    console.error('[Worker Unread Count API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch unread count' },
      { status: 500 }
    );
  }
}
