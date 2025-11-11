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

    // Fetch all leads/jobs for this provider to create conversations
    const leads = await prisma.lead.findMany({
      where: { assignedProviderId: providerId },
      orderBy: { updatedAt: 'desc' },
    });

    // Group by customer (email as unique identifier) and create mock conversations
    const conversationMap = new Map();

    leads.forEach(lead => {
      const customerId = lead.email.toLowerCase();
      const customerName = `${lead.firstName} ${lead.lastName}`;

      if (!conversationMap.has(customerId)) {
        // Create mock conversation with last message
        const lastMessage = lead.status === 'converted'
          ? 'Thank you! The job looks great.'
          : lead.status === 'accepted'
          ? 'Looking forward to working with you!'
          : 'I\'m interested in your services.';

        conversationMap.set(customerId, {
          id: lead.id,
          customerId: lead.id,
          customerName,
          jobReference: lead.providerProposedDate
            ? `Re: ${lead.serviceInterest} on ${new Date(lead.providerProposedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
            : `Re: ${lead.serviceInterest}`,
          jobDate: lead.providerProposedDate,
          lastMessage,
          lastMessageTime: lead.updatedAt.toISOString(),
          unread: lead.status === 'matched', // New matched leads are unread
          source: 'renoa' as const,
        });
      }
    });

    const conversations = Array.from(conversationMap.values());

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
    const formData = await request.formData();
    const conversationId = formData.get('conversationId') as string;
    const providerId = formData.get('providerId') as string;
    const content = formData.get('content') as string;
    const photo = formData.get('photo') as File | null;

    if (!conversationId || !providerId || (!content && !photo)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // TODO: Store message in a dedicated messages table
    // For now, we'll just return success and append to lead notes
    const lead = await prisma.lead.findUnique({
      where: { id: conversationId },
    });

    if (!lead) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Append message to notes as temporary storage
    const timestamp = new Date().toISOString();
    const messageEntry = `[${timestamp}] Provider: ${content}`;
    const updatedNotes = lead.notes
      ? `${lead.notes}\n\n${messageEntry}`
      : messageEntry;

    await prisma.lead.update({
      where: { id: conversationId },
      data: {
        notes: updatedNotes,
        updatedAt: new Date(),
      },
    });

    // TODO: Send SMS/Email notification to customer

    return NextResponse.json({
      success: true,
      message: {
        id: Date.now().toString(),
        conversationId,
        senderId: providerId,
        senderType: 'provider',
        content,
        timestamp,
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
