import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/worker/messages/team
 * Fetch team messages for a worker
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const recipientId = searchParams.get('recipientId');

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

    if (!recipientId || recipientId === 'team') {
      // Team-wide messages
      whereClause = {
        provider_id: worker.providerId,
        recipient_user_id: null,
      };
    } else {
      // Direct messages between two users
      whereClause = {
        provider_id: worker.providerId,
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
    if (!recipientId || recipientId === 'team') {
      await prisma.team_messages.updateMany({
        where: {
          provider_id: worker.providerId,
          recipient_user_id: null,
          sender_user_id: { not: userId },
          read: false,
        },
        data: { read: true },
      });
    } else {
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
      read: msg.read,
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
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, recipientUserId, content } = body;

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

    // If sending to a specific user, verify they exist
    if (recipientUserId) {
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
        recipient_user_id: recipientUserId || null,
        content: content.trim(),
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
        read: message.read,
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
