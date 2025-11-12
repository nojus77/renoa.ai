import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Fetch all conversations for a provider
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('providerId');

    if (!providerId) {
      return NextResponse.json({ error: 'Provider ID is required' }, { status: 400 });
    }

    // Get all messages for this provider
    const messages = await prisma.providerCustomerMessage.findMany({
      where: { providerId },
      include: {
        customer: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Group messages by customer to create conversation list
    const conversationMap = new Map();

    for (const message of messages) {
      const customerId = message.customerId;

      if (!conversationMap.has(customerId)) {
        // Count unread messages for this customer
        const unreadCount = messages.filter(
          m => m.customerId === customerId && m.direction === 'received' && m.status !== 'read'
        ).length;

        conversationMap.set(customerId, {
          id: customerId,
          customerId: customerId,
          customerName: message.customer.name,
          customerPhone: message.customer.phone,
          customerEmail: message.customer.email,
          lastMessage: message.content,
          lastMessageTime: message.createdAt.toISOString(),
          unread: unreadCount > 0,
          unreadCount,
          source: message.customer.source,
        });
      }
    }

    // Also include customers with no messages but who have jobs (potential conversations)
    const customersWithJobs = await prisma.customer.findMany({
      where: {
        providerId,
        NOT: {
          id: {
            in: Array.from(conversationMap.keys()),
          },
        },
      },
      include: {
        jobs: {
          orderBy: { startTime: 'desc' },
          take: 1,
        },
      },
    });

    // Add customers with jobs but no messages yet
    customersWithJobs.forEach(customer => {
      if (customer.jobs.length > 0) {
        conversationMap.set(customer.id, {
          id: customer.id,
          customerId: customer.id,
          customerName: customer.name,
          customerPhone: customer.phone,
          customerEmail: customer.email,
          lastMessage: null,
          lastMessageTime: customer.jobs[0]?.startTime?.toISOString() || customer.createdAt.toISOString(),
          unread: false,
          unreadCount: 0,
          source: customer.source,
          jobReference: `${customer.jobs[0]?.serviceType} - ${new Date(customer.jobs[0]?.startTime).toLocaleDateString()}`,
        });
      }
    });

    const conversations = Array.from(conversationMap.values())
      .sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}

// POST - Send a new message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { providerId, customerId, content, type = 'sms' } = body;

    if (!providerId || !customerId || !content) {
      return NextResponse.json(
        { error: 'Provider ID, Customer ID, and message content are required' },
        { status: 400 }
      );
    }

    // Verify the customer belongs to this provider
    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        providerId: providerId,
      },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found or unauthorized' }, { status: 404 });
    }

    // Create the message
    const message = await prisma.providerCustomerMessage.create({
      data: {
        providerId,
        customerId,
        content,
        direction: 'sent',
        type,
        status: 'sent',
      },
      include: {
        customer: true,
      },
    });

    // TODO: Send actual SMS/Email via Twilio/SendGrid here
    // For now, just save to database

    return NextResponse.json({
      success: true,
      message: {
        id: message.id,
        customerId: message.customerId,
        customerName: message.customer.name,
        senderId: providerId,
        senderType: 'provider',
        content: message.content,
        direction: message.direction,
        type: message.type,
        status: message.status,
        timestamp: message.createdAt.toISOString(),
        read: false,
      }
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
