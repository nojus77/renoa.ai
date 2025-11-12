import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();

// PATCH - Update subscription (pause, resume, cancel)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const session = cookieStore.get('customer-session');

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { customerId } = JSON.parse(session.value);
    const subscriptionId = params.id;
    const body = await request.json();
    const { action, pausedUntil } = body;

    // Verify subscription belongs to customer
    const subscription = await prisma.customerSubscription.findFirst({
      where: {
        id: subscriptionId,
        customerId,
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    let updateData: any = {};

    switch (action) {
      case 'pause':
        if (!pausedUntil) {
          return NextResponse.json(
            { error: 'pausedUntil date required for pause action' },
            { status: 400 }
          );
        }
        updateData = {
          status: 'paused',
          pausedUntil: new Date(pausedUntil),
        };
        break;

      case 'resume':
        // Calculate next scheduled date from today
        const resumeDate = new Date();
        let nextScheduledDate = new Date(resumeDate);

        switch (subscription.frequency) {
          case 'weekly':
            nextScheduledDate.setDate(nextScheduledDate.getDate() + 7);
            break;
          case 'biweekly':
            nextScheduledDate.setDate(nextScheduledDate.getDate() + 14);
            break;
          case 'monthly':
            nextScheduledDate.setMonth(nextScheduledDate.getMonth() + 1);
            break;
        }

        updateData = {
          status: 'active',
          pausedUntil: null,
          nextScheduledDate,
        };
        break;

      case 'cancel':
        updateData = {
          status: 'cancelled',
        };
        break;

      case 'skip':
        // Skip next scheduled date and move to following one
        let skippedDate = new Date(subscription.nextScheduledDate);

        switch (subscription.frequency) {
          case 'weekly':
            skippedDate.setDate(skippedDate.getDate() + 7);
            break;
          case 'biweekly':
            skippedDate.setDate(skippedDate.getDate() + 14);
            break;
          case 'monthly':
            skippedDate.setMonth(skippedDate.getMonth() + 1);
            break;
        }

        updateData = {
          nextScheduledDate: skippedDate,
        };
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    const updatedSubscription = await prisma.customerSubscription.update({
      where: { id: subscriptionId },
      data: updateData,
      include: {
        provider: {
          select: {
            id: true,
            businessName: true,
            phone: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ subscription: updatedSubscription });
  } catch (error) {
    console.error('Error updating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    );
  }
}

// DELETE - Delete subscription
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const session = cookieStore.get('customer-session');

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { customerId } = JSON.parse(session.value);
    const subscriptionId = params.id;

    // Verify subscription belongs to customer
    const subscription = await prisma.customerSubscription.findFirst({
      where: {
        id: subscriptionId,
        customerId,
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    await prisma.customerSubscription.delete({
      where: { id: subscriptionId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting subscription:', error);
    return NextResponse.json(
      { error: 'Failed to delete subscription' },
      { status: 500 }
    );
  }
}
