import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  const trackingToken = params.token;
  const targetUrl = request.nextUrl.searchParams.get('url');
  const decodedUrl = targetUrl ? decodeURIComponent(targetUrl) : null;

  if (!decodedUrl) {
    return NextResponse.json({ error: 'Missing URL' }, { status: 400 });
  }

  try {
    const message = await prisma.message.findUnique({
      where: { trackingToken },
    });

    if (message) {
      await prisma.emailEvent.create({
        data: {
          messageId: message.id,
          eventType: 'CLICKED',
          clickUrl: decodedUrl,
          ipAddress: request.headers.get('x-forwarded-for') || null,
          userAgent: request.headers.get('user-agent') || null,
        },
      });
    }

    return NextResponse.redirect(decodedUrl, 302);
  } catch (error) {
    // Always redirect even on error to maintain user experience
    console.error('Click tracking error:', error);
    return NextResponse.redirect(decodedUrl, 302);
  }
}
