import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';
import { stripe } from '@/lib/stripe-server';

const prisma = new PrismaClient();

// Pricing constants (in cents)
export const PRICING = {
  MONTHLY_PER_SEAT: 3000, // $30/month
  ANNUAL_PER_SEAT: 2000,  // $20/month ($240/year)
};

/**
 * Update Stripe subscription quantity when seats change
 */
export async function updateSubscriptionSeats(
  providerId: string,
  newSeatCount: number
): Promise<{ success: boolean; subscription?: Stripe.Subscription; error?: string }> {
  try {
    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
      select: {
        stripeSubscriptionId: true,
        stripeCustomerId: true,
        planType: true,
      },
    });

    if (!provider) {
      return { success: false, error: 'Provider not found' };
    }

    if (!provider.stripeSubscriptionId) {
      return { success: false, error: 'No active subscription found' };
    }

    // Update subscription quantity in Stripe
    // Stripe automatically handles proration
    const subscription = await stripe.subscriptions.update(
      provider.stripeSubscriptionId,
      {
        items: [
          {
            id: (await stripe.subscriptions.retrieve(provider.stripeSubscriptionId)).items.data[0].id,
            quantity: newSeatCount,
          },
        ],
        proration_behavior: 'always_invoice', // Create invoice for prorated amount immediately
      }
    );

    // Update provider record
    await prisma.provider.update({
      where: { id: providerId },
      data: {
        activeSeats: newSeatCount,
        currentPeriodEnd: new Date((subscription as unknown as { current_period_end: number }).current_period_end * 1000),
      },
    });

    return { success: true, subscription };
  } catch (error: any) {
    console.error('Error updating subscription seats:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Calculate prorated cost for adding a seat mid-cycle
 */
export function calculateProratedCost(
  pricePerSeat: number,
  daysRemaining: number,
  totalDays: number
): number {
  if (totalDays === 0) return pricePerSeat;
  return Math.round((pricePerSeat * daysRemaining) / totalDays);
}

/**
 * Get current seat usage information
 * 50-seat soft limit with enterprise upgrade path
 */
export async function getSeatUsage(providerId: string): Promise<{
  activeSeats: number;
  maxSeats: number;
  pricePerSeat: number;
  planType: string | null;
  currentPeriodEnd: Date | null;
  canAddSeats: boolean;
  subscriptionStatus: string | null;
  isNearingLimit: boolean; // 45+ seats (approaching enterprise)
  isAtLimit: boolean; // 50 seats (enterprise pricing unlocks)
}> {
  const provider = await prisma.provider.findUnique({
    where: { id: providerId },
    select: {
      activeSeats: true,
      maxSeats: true,
      pricePerSeat: true,
      planType: true,
      currentPeriodEnd: true,
      subscriptionStatus: true,
    },
  });

  if (!provider) {
    throw new Error('Provider not found');
  }

  // Count actual active users
  const activeUserCount = await prisma.providerUser.count({
    where: {
      providerId,
      status: 'active',
    },
  });

  const isAtLimit = activeUserCount >= provider.maxSeats;
  const isNearingLimit = activeUserCount >= 45;

  return {
    activeSeats: activeUserCount,
    maxSeats: provider.maxSeats,
    pricePerSeat: provider.pricePerSeat || PRICING.MONTHLY_PER_SEAT,
    planType: provider.planType,
    currentPeriodEnd: provider.currentPeriodEnd,
    canAddSeats: !isAtLimit, // Can add until we hit the limit
    subscriptionStatus: provider.subscriptionStatus,
    isNearingLimit,
    isAtLimit,
  };
}

/**
 * Create a new Stripe subscription for a provider
 */
export async function createSubscription(
  providerId: string,
  planType: 'monthly' | 'annual',
  seatCount: number = 1
): Promise<{ success: boolean; subscription?: Stripe.Subscription; error?: string }> {
  try {
    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
      select: {
        stripeCustomerId: true,
        email: true,
        businessName: true,
      },
    });

    if (!provider) {
      return { success: false, error: 'Provider not found' };
    }

    let customerId = provider.stripeCustomerId;

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: provider.email,
        name: provider.businessName,
        metadata: {
          providerId,
        },
      });
      customerId = customer.id;

      await prisma.provider.update({
        where: { id: providerId },
        data: { stripeCustomerId: customerId },
      });
    }

    // Create price if doesn't exist (you should create these in Stripe Dashboard)
    // For now, we'll create them programmatically
    const priceAmount = planType === 'monthly' ? PRICING.MONTHLY_PER_SEAT : PRICING.ANNUAL_PER_SEAT;
    const interval = planType === 'monthly' ? 'month' : 'year';

    const price = await stripe.prices.create({
      unit_amount: priceAmount,
      currency: 'usd',
      recurring: { interval: interval as 'month' | 'year' },
      product_data: {
        name: `Renoa ${planType === 'monthly' ? 'Monthly' : 'Annual'} Plan`,
      },
    });

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [
        {
          price: price.id,
          quantity: seatCount,
        },
      ],
      metadata: {
        providerId,
      },
    });

    // Update provider record
    await prisma.provider.update({
      where: { id: providerId },
      data: {
        stripeSubscriptionId: subscription.id,
        subscriptionStatus: subscription.status,
        planType,
        pricePerSeat: priceAmount,
        activeSeats: seatCount,
        currentPeriodEnd: new Date((subscription as unknown as { current_period_end: number }).current_period_end * 1000),
      },
    });

    return { success: true, subscription };
  } catch (error: any) {
    console.error('Error creating subscription:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(
  providerId: string,
  immediately: boolean = false
): Promise<{ success: boolean; error?: string }> {
  try {
    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
      select: { stripeSubscriptionId: true },
    });

    if (!provider?.stripeSubscriptionId) {
      return { success: false, error: 'No active subscription found' };
    }

    if (immediately) {
      await stripe.subscriptions.cancel(provider.stripeSubscriptionId);
      await prisma.provider.update({
        where: { id: providerId },
        data: { subscriptionStatus: 'cancelled' },
      });
    } else {
      await stripe.subscriptions.update(provider.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });
      await prisma.provider.update({
        where: { id: providerId },
        data: { subscriptionStatus: 'canceling' },
      });
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error canceling subscription:', error);
    return { success: false, error: error.message };
  }
}
