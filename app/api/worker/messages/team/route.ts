import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/worker/messages/team
 * Fetch team messages for a worker
 * Supports: team-wide, direct messages, and crew messages
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const recipientId = searchParams.get('recipientId');
    const crewId = searchParams.get('crewId');

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

    let whereClause: any;

    if (crewId) {
      // Crew messages
      whereClause = {
        provider_id: worker.providerId,
        crew_id: crewId,
      };
    } else if (!recipientId || recipientId === 'team') {
      // Team-wide messages (no crew, no recipient)
      whereClause = {
        provider_id: worker.providerId,
        recipient_user_id: null,
        crew_id: null,
      };
    } else {
      // Direct messages between two users
      whereClause = {
        provider_id: worker.providerId,
        crew_id: null,
        OR: [
          { sender_user_id: userId, recipient_user_id: recipientId },
          { sender_user_id: recipientId, recipient_user_id: userId },
        ],
      };
    }

    const messages = await prisma.team_messages.findMany({
      where: whereClause,
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            profilePhotoUrl: true,
          },
        },
      },
      orderBy: { created_at: 'asc' },
      take: 100,
    });

    // Mark messages as read
    if (crewId) {
      // For crew messages, add userId to read_by array
      const unreadMessages = messages.filter(
        m => m.sender_user_id !== userId && !m.read_by.includes(userId)
      );
      if (unreadMessages.length > 0) {
        await Promise.all(
          unreadMessages.map(msg =>
            prisma.team_messages.update({
              where: { id: msg.id },
              data: { read_by: { push: userId } },
            })
          )
        );
      }
    } else if (!recipientId || recipientId === 'team') {
      // For team messages, add userId to read_by array
      const unreadMessages = messages.filter(
        m => m.sender_user_id !== userId && !m.read_by.includes(userId)
      );
      if (unreadMessages.length > 0) {
        await Promise.all(
          unreadMessages.map(msg =>
            prisma.team_messages.update({
              where: { id: msg.id },
              data: { read_by: { push: userId } },
            })
          )
        );
      }
    } else {
      // Direct messages use the simple read flag
      await prisma.team_messages.updateMany({
        where: {
          provider_id: worker.providerId,
          sender_user_id: recipientId,
          recipient_user_id: userId,
          read: false,
        },
        data: { read: true },
      });
    }

    const formattedMessages = messages.map((msg) => ({
      id: msg.id,
      content: msg.content,
      senderUserId: msg.sender_user_id,
      senderName: `${msg.sender.firstName} ${msg.sender.lastName}`,
      senderRole: msg.sender.role,
      senderAvatar: msg.sender.profilePhotoUrl,
      recipientUserId: msg.recipient_user_id,
      crewId: msg.crew_id,
      read: msg.read,
      readBy: msg.read_by,
      createdAt: msg.created_at.toISOString(),
    }));

    return NextResponse.json({ messages: formattedMessages });
  } catch (error) {
    console.error('[Worker Team Messages API] GET Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team messages' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/worker/messages/team
 * Send a team message from a worker
 * Supports: team-wide, direct messages, and crew messages
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, recipientUserId, crewId, content } = body;

    if (!userId || !content?.trim()) {
      return NextResponse.json(
        { error: 'User ID and content are required' },
        { status: 400 }
      );
    }

    // Get worker's provider
    const worker = await prisma.providerUser.findUnique({
      where: { id: userId },
      select: { providerId: true },
    });

    if (!worker?.providerId) {
      return NextResponse.json({ error: 'Worker not found' }, { status: 404 });
    }

    // If sending to a crew, verify membership
    if (crewId) {
      const crew = await prisma.crew.findFirst({
        where: {
          id: crewId,
          providerId: worker.providerId,
          OR: [
            { userIds: { has: userId } },
            { leaderId: userId },
          ],
        },
      });

      if (!crew) {
        return NextResponse.json({ error: 'Not a member of this crew' }, { status: 403 });
      }
    }

    // If sending to a specific user, verify they exist
    if (recipientUserId && !crewId) {
      const recipient = await prisma.providerUser.findFirst({
        where: {
          id: recipientUserId,
          providerId: worker.providerId,
        },
      });

      if (!recipient) {
        return NextResponse.json({ error: 'Recipient not found' }, { status: 404 });
      }
    }

    // Create the message
    const message = await prisma.team_messages.create({
      data: {
        provider_id: worker.providerId,
        sender_user_id: userId,
        recipient_user_id: crewId ? null : (recipientUserId || null),
        crew_id: crewId || null,
        content: content.trim(),
        read_by: [userId], // Sender has read their own message
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            profilePhotoUrl: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: {
        id: message.id,
        content: message.content,
        senderUserId: message.sender_user_id,
        senderName: `${message.sender.firstName} ${message.sender.lastName}`,
        senderRole: message.sender.role,
        senderAvatar: message.sender.profilePhotoUrl,
        recipientUserId: message.recipient_user_id,
        crewId: message.crew_id,
        read: message.read,
        readBy: message.read_by,
        createdAt: message.created_at.toISOString(),
      },
    });
  } catch (error) {
    console.error('[Worker Team Messages API] POST Error:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
