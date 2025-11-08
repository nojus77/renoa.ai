import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const TRANSPARENT_PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64'
);

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  const trackingToken = params.token.replace('.png', '');

  try {
    const message = await prisma.message.findUnique({
      where: { trackingToken },
      select: { id: true, leadId: true },
    });

    if (!message) {
      // Token not found - still return pixel (common for test requests)
      return new NextResponse(TRANSPARENT_PIXEL, {
        status: 200,
        headers: { 
          'Content-Type': 'image/png',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
    }

    // Check if already opened to avoid duplicate events
    const existingOpen = await prisma.emailEvent.findFirst({
      where: {
        messageId: message.id,
        eventType: 'OPENED',
      },
    });

    if (!existingOpen) {
      await prisma.emailEvent.create({
        data: {
          messageId: message.id,
          eventType: 'OPENED',
          ipAddress: request.headers.get('x-forwarded-for') || null,
          userAgent: request.headers.get('user-agent') || null,
        },
      });
    }

    return new NextResponse(TRANSPARENT_PIXEL, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    // Always return pixel even on error to avoid breaking email clients
    console.error('Tracking pixel error:', error);
    return new NextResponse(TRANSPARENT_PIXEL, {
      status: 200,
      headers: { 
        'Content-Type': 'image/png',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  }
}
