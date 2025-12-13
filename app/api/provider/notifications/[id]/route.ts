import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/provider/notifications/[id]
 * Mark a single notification as read
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Notification ID required' },
        { status: 400 }
      );
    }

    const notification = await prisma.notification.update({
      where: { id },
      data: { read: true },
    });

    return NextResponse.json({
      success: true,
      notification,
    });
  } catch (error: unknown) {
    console.error('Error marking notification as read:', error);

    // Handle not found error
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/provider/notifications/[id]
 * Delete a notification
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Notification ID required' },
        { status: 400 }
      );
    }

    await prisma.notification.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error: unknown) {
    console.error('Error deleting notification:', error);

    // Handle not found error
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete notification' },
      { status: 500 }
    );
  }
}
