import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

interface SNSMessage {
  Type: string;
  MessageId: string;
  TopicArn: string;
  Message: string;
  Timestamp: string;
  SubscribeURL?: string;
}

interface SESEvent {
  eventType: 'Delivery' | 'Bounce' | 'Complaint' | 'Send';
  mail: {
    messageId: string;
    timestamp: string;
    source: string;
    destination: string[];
    tags?: {
      MessageId?: string[];
      TrackingToken?: string[];
    };
  };
  delivery?: {
    timestamp: string;
    recipients: string[];
  };
  bounce?: {
    bounceType: 'Permanent' | 'Transient' | 'Undetermined';
    bounceSubType: string;
    bouncedRecipients: Array<{
      emailAddress: string;
      status: string;
      diagnosticCode: string;
    }>;
    timestamp: string;
  };
  complaint?: {
    complainedRecipients: Array<{
      emailAddress: string;
    }>;
    timestamp: string;
    complaintFeedbackType?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as SNSMessage;

    // Handle SNS subscription confirmation
    if (body.Type === 'SubscriptionConfirmation') {
      console.log('📩 SNS Subscription - Visit URL to confirm:', body.SubscribeURL);
      
      if (body.SubscribeURL) {
        const response = await fetch(body.SubscribeURL);
        if (response.ok) {
          console.log('✅ SNS Subscription confirmed');
        }
      }
      
      return NextResponse.json({ message: 'Subscription confirmed' });
    }

    // Handle notification
    if (body.Type === 'Notification') {
      const sesEvent: SESEvent = JSON.parse(body.Message);
      
      console.log(`📬 SES Event: ${sesEvent.eventType}`);

      const messageId = sesEvent.mail.tags?.MessageId?.[0];
      
      if (!messageId) {
        console.warn('⚠️ No MessageId in SES event');
        return NextResponse.json({ message: 'No message ID' });
      }

      const message = await prisma.message.findUnique({
        where: { id: messageId },
      });

      if (!message) {
        console.warn(`⚠️ Message not found: ${messageId}`);
        return NextResponse.json({ message: 'Message not found' });
      }

      switch (sesEvent.eventType) {
        case 'Delivery':
          await prisma.$transaction([
            prisma.emailEvent.create({
              data: {
                messageId: message.id,
                eventType: 'DELIVERED',
                timestamp: new Date(sesEvent.delivery!.timestamp),
              },
            }),
            prisma.message.update({
              where: { id: message.id },
              data: { status: 'DELIVERED' },
            }),
          ]);
          console.log(`✅ Delivered: ${message.id}`);
          break;
        
        case 'Bounce':
          const bounceType = sesEvent.bounce!.bounceType;
          await prisma.$transaction([
            prisma.emailEvent.create({
              data: {
                messageId: message.id,
                eventType: 'BOUNCED',
                bounceType,
                timestamp: new Date(sesEvent.bounce!.timestamp),
                metadata: sesEvent.bounce,
              },
            }),
            prisma.message.update({
              where: { id: message.id },
              data: { status: 'BOUNCED' },
            }),
          ]);
          console.log(`⚠️ Bounced (${bounceType}): ${message.id}`);
          break;
        
        case 'Complaint':
          await prisma.$transaction([
            prisma.emailEvent.create({
              data: {
                messageId: message.id,
                eventType: 'COMPLAINED',
                timestamp: new Date(sesEvent.complaint!.timestamp),
                metadata: sesEvent.complaint,
              },
            }),
            prisma.message.update({
              where: { id: message.id },
              data: { status: 'COMPLAINED' },
            }),
          ]);
          console.log(`🚨 Complaint: ${message.id}`);
          break;
      }

      return NextResponse.json({ message: 'Event processed' });
    }

    return NextResponse.json({ message: 'Unknown type' }, { status: 400 });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'SES webhook active',
    timestamp: new Date().toISOString(),
  });
}
