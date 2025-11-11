import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Fetch messages for a specific conversation
export async function GET(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('providerId');

    if (!providerId) {
      return NextResponse.json({ error: 'Provider ID is required' }, { status: 400 });
    }

    // Fetch the lead/job
    const lead = await prisma.lead.findUnique({
      where: { id: params.conversationId },
    });

    if (!lead) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Generate mock message thread
    const messages = [];

    // Initial customer inquiry
    messages.push({
      id: '1',
      conversationId: params.conversationId,
      senderId: lead.email,
      senderType: 'customer' as const,
      content: `Hi! I'm interested in ${lead.serviceInterest} services. Can you help?`,
      timestamp: new Date(lead.createdAt).toISOString(),
      read: true,
    });

    // System message: Lead matched
    messages.push({
      id: '2',
      conversationId: params.conversationId,
      senderId: 'system',
      senderType: 'system' as const,
      content: `Lead matched with ${lead.firstName} ${lead.lastName}`,
      timestamp: new Date(new Date(lead.createdAt).getTime() + 60000).toISOString(),
      read: true,
    });

    if (lead.status !== 'matched') {
      // Provider accepted
      messages.push({
        id: '3',
        conversationId: params.conversationId,
        senderId: providerId,
        senderType: 'provider' as const,
        content: 'Hello! I\'d be happy to help with your project. Let me know when works best for you.',
        timestamp: new Date(new Date(lead.createdAt).getTime() + 300000).toISOString(),
        read: true,
      });

      // Customer response
      messages.push({
        id: '4',
        conversationId: params.conversationId,
        senderId: lead.email,
        senderType: 'customer' as const,
        content: lead.customerPreferredDate
          ? `Great! Would ${new Date(lead.customerPreferredDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' })} work for you?`
          : 'Thank you! When are you available?',
        timestamp: new Date(new Date(lead.createdAt).getTime() + 600000).toISOString(),
        read: true,
      });

      if (lead.providerProposedDate) {
        // System message: Booking confirmed
        messages.push({
          id: '5',
          conversationId: params.conversationId,
          senderId: 'system',
          senderType: 'system' as const,
          content: `Booking confirmed for ${new Date(lead.providerProposedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`,
          timestamp: new Date(new Date(lead.createdAt).getTime() + 900000).toISOString(),
          read: true,
        });
      }

      if (lead.status === 'converted') {
        // Provider: Job day
        messages.push({
          id: '6',
          conversationId: params.conversationId,
          senderId: providerId,
          senderType: 'provider' as const,
          content: 'On my way! See you soon.',
          timestamp: new Date(new Date(lead.providerProposedDate || lead.createdAt).getTime() + 86400000).toISOString(),
          read: true,
        });

        // System message: Provider on the way
        messages.push({
          id: '7',
          conversationId: params.conversationId,
          senderId: 'system',
          senderType: 'system' as const,
          content: 'Provider is on the way',
          timestamp: new Date(new Date(lead.providerProposedDate || lead.createdAt).getTime() + 86460000).toISOString(),
          read: true,
        });

        // Provider: Job completed
        messages.push({
          id: '8',
          conversationId: params.conversationId,
          senderId: providerId,
          senderType: 'provider' as const,
          content: 'Job completed! Everything looks great. Thank you for your business!',
          timestamp: new Date(new Date(lead.providerProposedDate || lead.createdAt).getTime() + 90000000).toISOString(),
          read: true,
        });

        // System message: Job complete
        messages.push({
          id: '9',
          conversationId: params.conversationId,
          senderId: 'system',
          senderType: 'system' as const,
          content: `Job marked complete${lead.contractValue ? ` • Invoice sent: $${lead.contractValue}` : ''}`,
          timestamp: new Date(new Date(lead.providerProposedDate || lead.createdAt).getTime() + 90060000).toISOString(),
          read: true,
        });

        // Customer: Thank you
        messages.push({
          id: '10',
          conversationId: params.conversationId,
          senderId: lead.email,
          senderType: 'customer' as const,
          content: 'Thank you so much! The job looks fantastic. Will definitely hire you again!',
          timestamp: new Date(new Date(lead.providerProposedDate || lead.createdAt).getTime() + 93600000).toISOString(),
          read: true,
        });
      }
    }

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}
