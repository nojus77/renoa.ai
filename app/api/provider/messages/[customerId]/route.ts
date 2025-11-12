import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Fetch all messages for a specific conversation
export async function GET(
  request: NextRequest,
  { params }: { params: { customerId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('providerId');
    const { customerId } = params;

    if (!providerId) {
      return NextResponse.json({ error: 'Provider ID is required' }, { status: 400 });
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

    // Fetch all messages for this conversation
    const messages = await prisma.providerCustomerMessage.findMany({
      where: {
        providerId,
        customerId,
      },
      orderBy: { createdAt: 'asc' }, // Chronological order for conversation thread
    });

    // Mark all received messages as read
    await prisma.providerCustomerMessage.updateMany({
      where: {
        providerId,
        customerId,
        direction: 'received',
        status: { not: 'read' },
      },
      data: {
        status: 'read',
      },
    });

    // Format messages for frontend
    const formattedMessages = messages.map(msg => ({
      id: msg.id,
      customerId: msg.customerId,
      customerName: customer.name,
      senderId: msg.direction === 'sent' ? providerId : customerId,
      senderType: msg.direction === 'sent' ? 'provider' : 'customer',
      content: msg.content,
      direction: msg.direction,
      type: msg.type,
      status: msg.status,
      timestamp: msg.createdAt.toISOString(),
      read: msg.status === 'read',
    }));

    return NextResponse.json({
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        source: customer.source,
      },
      messages: formattedMessages,
    });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversation' },
      { status: 500 }
    );
  }
}
