import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/provider/messages/team
 * Fetch team messages for a provider user
 * Supports: team-wide, direct messages, and crew messages
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('providerId');
    const userId = searchParams.get('userId');
    const recipientId = searchParams.get('recipientId');
    const crewId = searchParams.get('crewId');

    if (!providerId || !userId) {
      return NextResponse.json(
        { error: 'Provider ID and User ID are required' },
        { status: 400 }
      );
    }

    let whereClause: any;

    if (crewId) {
      // Crew messages
      whereClause = {
        provider_id: providerId,
        crew_id: crewId,
      };
    } else if (!recipientId || recipientId === 'team') {
      // Team-wide messages (no crew, no recipient)
      whereClause = {
        provider_id: providerId,
        recipient_user_id: null,
        crew_id: null,
      };
    } else {
      // Direct messages between two users
      whereClause = {
        provider_id: providerId,
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
          provider_id: providerId,
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
    console.error('[Provider Team Messages API] GET Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team messages' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/provider/messages/team
 * Send a team message from a provider user
 * Supports: team-wide, direct messages, and crew messages
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { providerId, userId, recipientUserId, crewId, content } = body;

    if (!providerId || !userId || !content?.trim()) {
      return NextResponse.json(
        { error: 'Provider ID, User ID, and content are required' },
        { status: 400 }
      );
    }

    // Verify the user belongs to this provider
    const user = await prisma.providerUser.findFirst({
      where: {
        id: userId,
        providerId: providerId,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // If sending to a crew, verify it exists
    if (crewId) {
      const crew = await prisma.crew.findFirst({
        where: {
          id: crewId,
          providerId: providerId,
        },
      });

      if (!crew) {
        return NextResponse.json({ error: 'Crew not found' }, { status: 404 });
      }
    }

    // If sending to a specific user, verify they exist
    if (recipientUserId && !crewId) {
      const recipient = await prisma.providerUser.findFirst({
        where: {
          id: recipientUserId,
          providerId: providerId,
        },
      });

      if (!recipient) {
        return NextResponse.json({ error: 'Recipient not found' }, { status: 404 });
      }
    }

    // Create the message
    const message = await prisma.team_messages.create({
      data: {
        provider_id: providerId,
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
    console.error('[Provider Team Messages API] POST Error:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
