import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/provider/notifications
 * Fetch notifications for a provider
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const providerId = searchParams.get('providerId');
    const userId = searchParams.get('userId');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    if (!providerId) {
      return NextResponse.json(
        { error: 'Provider ID required' },
        { status: 400 }
      );
    }

    // Build where clause
    const whereClause: Record<string, unknown> = {
      providerId,
    };

    // Filter by read status if requested
    if (unreadOnly) {
      whereClause.read = false;
    }

    // If userId is provided, get notifications for that user OR general notifications
    if (userId) {
      whereClause.OR = [{ userId }, { userId: null }];
    }

    // Fetch notifications
    const [notifications, totalCount, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.notification.count({ where: whereClause }),
      prisma.notification.count({
        where: {
          ...whereClause,
          read: false,
        },
      }),
    ]);

    return NextResponse.json({
      notifications,
      totalCount,
      unreadCount,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/provider/notifications
 * Mark all notifications as read
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { providerId, userId } = body;

    if (!providerId) {
      return NextResponse.json(
        { error: 'Provider ID required' },
        { status: 400 }
      );
    }

    const whereClause: Record<string, unknown> = {
      providerId,
      read: false,
    };

    if (userId) {
      whereClause.OR = [{ userId }, { userId: null }];
    }

    const result = await prisma.notification.updateMany({
      where: whereClause,
      data: { read: true },
    });

    return NextResponse.json({
      success: true,
      count: result.count,
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark notifications as read' },
      { status: 500 }
    );
  }
}
