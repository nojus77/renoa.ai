import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/worker/messages/[customerId]
 * Get all messages for a specific conversation
 * Workers can only view messages for customers they're assigned to
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    const { customerId } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get worker to find their provider
    const worker = await prisma.providerUser.findUnique({
      where: { id: userId },
      select: { providerId: true },
    });

    if (!worker) {
      return NextResponse.json({ error: 'Worker not found' }, { status: 404 });
    }

    // Verify worker is assigned to at least one job with this customer
    const assignedJob = await prisma.job.findFirst({
      where: {
        customerId,
        assignedUserIds: { has: userId },
      },
    });

    if (!assignedJob) {
      return NextResponse.json(
        { error: 'You can only view messages for customers you are assigned to' },
        { status: 403 }
      );
    }

    // Get customer info
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
      },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Fetch all messages for this conversation
    const messages = await prisma.provider_customer_messages.findMany({
      where: {
        provider_id: worker.providerId,
        customer_id: customerId,
      },
      orderBy: { created_at: 'asc' },
    });

    // Mark received messages as read
    await prisma.provider_customer_messages.updateMany({
      where: {
        provider_id: worker.providerId,
        customer_id: customerId,
        direction: 'received',
        status: { not: 'read' },
      },
      data: {
        status: 'read',
        updated_at: new Date(),
      },
    });

    // Format messages for frontend
    const formattedMessages = messages.map(msg => ({
      id: msg.id,
      customerId: msg.customer_id,
      customerName: customer.name,
      senderId: msg.direction === 'sent' ? worker.providerId : customerId,
      senderType: msg.direction === 'sent' ? 'worker' : 'customer',
      content: msg.content,
      direction: msg.direction,
      type: msg.type,
      status: msg.status,
      timestamp: msg.created_at.toISOString(),
      read: msg.status === 'read',
    }));

    return NextResponse.json({
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
      },
      messages: formattedMessages,
    });
  } catch (error) {
    console.error('Error fetching worker conversation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversation' },
      { status: 500 }
    );
  }
}
