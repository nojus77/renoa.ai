import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();

// GET - Fetch all messages for customer
export async function GET(request: NextRequest) {
  try {
    // Get customer session
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('customer-session');

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    const customerId = session.customerId;

    // Get all messages for this customer (grouped by provider)
    const messages = await prisma.providerCustomerMessage.findMany({
      where: {
        customerId,
      },
      include: {
        provider: {
          select: {
            id: true,
            businessName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group messages by provider
    const groupedMessages: Record<string, any> = {};

    messages.forEach(msg => {
      const providerId = msg.providerId;
      if (!groupedMessages[providerId]) {
        groupedMessages[providerId] = {
          providerId,
          providerName: msg.provider.businessName,
          messages: [],
        };
      }
      groupedMessages[providerId].messages.push({
        id: msg.id,
        content: msg.content,
        direction: msg.direction,
        type: msg.type,
        status: msg.status,
        createdAt: msg.createdAt,
      });
    });

    return NextResponse.json({
      conversations: Object.values(groupedMessages)
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

// POST - Send a new message
export async function POST(request: NextRequest) {
  try {
    // Get customer session
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('customer-session');

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    const customerId = session.customerId;

    const body = await request.json();
    const { providerId, content } = body;

    if (!providerId || !content) {
      return NextResponse.json(
        { error: 'Provider ID and content are required' },
        { status: 400 }
      );
    }

    // Create the message
    const message = await prisma.providerCustomerMessage.create({
      data: {
        providerId,
        customerId,
        content,
        direction: 'received', // From customer's perspective, they are sending but provider receives
        type: 'sms',
        status: 'sent',
      },
      include: {
        provider: {
          select: {
            businessName: true,
          },
        },
      },
    });

    return NextResponse.json({ message });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
