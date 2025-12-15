import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/worker/messages
 * Get all conversations for a worker
 * Workers can only message customers for jobs they're assigned to
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get the worker to find their provider
    const worker = await prisma.providerUser.findUnique({
      where: { id: userId },
      select: { providerId: true },
    });

    if (!worker) {
      return NextResponse.json({ error: 'Worker not found' }, { status: 404 });
    }

    // Get all jobs this worker is assigned to
    const assignedJobs = await prisma.job.findMany({
      where: {
        assignedUserIds: { has: userId },
        status: { not: 'cancelled' },
      },
      select: {
        id: true,
        customerId: true,
        serviceType: true,
        startTime: true,
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
      },
      orderBy: { startTime: 'desc' },
    });

    // Get unique customer IDs
    const customerIds = Array.from(new Set(assignedJobs.map(job => job.customerId)));

    if (customerIds.length === 0) {
      return NextResponse.json({ conversations: [] });
    }

    // Get messages for these customers
    const messages = await prisma.provider_customer_messages.findMany({
      where: {
        provider_id: worker.providerId,
        customer_id: { in: customerIds },
      },
      orderBy: { created_at: 'desc' },
    });

    // Build conversation list - one per customer
    const conversationMap = new Map();

    for (const customerId of customerIds) {
      const customer = assignedJobs.find(job => job.customerId === customerId)?.customer;
      if (!customer) continue;

      const customerMessages = messages.filter(m => m.customer_id === customerId);
      const latestMessage = customerMessages[0];
      const unreadCount = customerMessages.filter(
        m => m.direction === 'received' && m.status !== 'read'
      ).length;

      // Find the most recent job for this customer
      const recentJob = assignedJobs.find(job => job.customerId === customerId);

      conversationMap.set(customerId, {
        id: customerId,
        customerId: customer.id,
        customerName: customer.name,
        customerPhone: customer.phone,
        lastMessage: latestMessage?.content || null,
        lastMessageTime: latestMessage?.created_at?.toISOString() || recentJob?.startTime?.toISOString() || new Date().toISOString(),
        unread: unreadCount > 0,
        unreadCount,
        jobReference: recentJob ? `${recentJob.serviceType} - ${new Date(recentJob.startTime).toLocaleDateString()}` : null,
      });
    }

    const conversations = Array.from(conversationMap.values())
      .sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('Error fetching worker conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/worker/messages
 * Send a message to a customer
 * Workers can only message customers for jobs they're assigned to
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, customerId, content } = body;

    if (!userId || !customerId || !content) {
      return NextResponse.json(
        { error: 'User ID, Customer ID, and message content are required' },
        { status: 400 }
      );
    }

    // Get worker and verify they're assigned to a job with this customer
    const worker = await prisma.providerUser.findUnique({
      where: { id: userId },
      select: {
        id: true,
        providerId: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!worker) {
      return NextResponse.json({ error: 'Worker not found' }, { status: 404 });
    }

    // Check if worker is assigned to any job with this customer
    const assignedJob = await prisma.job.findFirst({
      where: {
        customerId,
        assignedUserIds: { has: userId },
      },
    });

    if (!assignedJob) {
      return NextResponse.json(
        { error: 'You can only message customers for jobs you are assigned to' },
        { status: 403 }
      );
    }

    // Create the message
    const message = await prisma.provider_customer_messages.create({
      data: {
        id: crypto.randomUUID(),
        provider_id: worker.providerId,
        customer_id: customerId,
        content,
        direction: 'sent',
        type: 'sms',
        status: 'sent',
        updated_at: new Date(),
      },
    });

    // Get customer info
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { name: true },
    });

    return NextResponse.json({
      success: true,
      message: {
        id: message.id,
        customerId: message.customer_id,
        customerName: customer?.name || 'Customer',
        senderId: userId,
        senderType: 'worker',
        senderName: `${worker.firstName} ${worker.lastName}`.trim(),
        content: message.content,
        direction: message.direction,
        type: message.type,
        status: message.status,
        timestamp: message.created_at.toISOString(),
        read: false,
      },
    });
  } catch (error) {
    console.error('Error sending worker message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
