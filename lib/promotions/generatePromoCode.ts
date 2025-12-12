import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

/**
 * Generates a unique promo code
 * Format: PREFIX + 6 random alphanumeric characters (e.g., SAVE15ABC123)
 */
export async function generatePromoCode(prefix: string = 'SAVE'): Promise<string> {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  let attempts = 0;
  while (attempts < 10) {
    // Generate 6 random characters
    let randomPart = '';
    for (let i = 0; i < 6; i++) {
      randomPart += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    const code = `${prefix}${randomPart}`;

    // Check if code already exists
    const existing = await prisma.customer_promotions.findUnique({
      where: { promo_code: code }
    });

    if (!existing) {
      return code;
    }

    attempts++;
  }

  // Fallback: use timestamp
  const timestamp = Date.now().toString(36).toUpperCase();
  return `${prefix}${timestamp}`;
}

/**
 * Create an inactivity promotion based on days inactive
 */
export async function createInactivityPromotion(
  customerId: string,
  daysInactive: number
): Promise<{ promoCode: string; discountPercent: number; expiresAt: Date; message: string }> {
  let discountPercent = 15;
  let expiresInHours = 48;
  let triggerType = 'inactivity';
  let message = '';
  let prefix = 'SAVE15';

  if (daysInactive >= 90) {
    // Winback promotion
    discountPercent = 25;
    expiresInHours = 168; // 1 week
    triggerType = 'winback';
    prefix = 'WINBACK25';
    message = 'We want you back! Get 25% off any service. This exclusive offer expires in 1 week.';
  } else if (daysInactive >= 60) {
    // Strong incentive
    discountPercent = 20;
    expiresInHours = 72;
    triggerType = 'inactivity';
    prefix = 'SAVE20';
    message = 'Come back! Enjoy 20% off your next service. Limited time offer - expires in 3 days!';
  } else if (daysInactive >= 30) {
    // Initial nudge
    discountPercent = 15;
    expiresInHours = 48;
    triggerType = 'inactivity';
    prefix = 'SAVE15';
    message = 'We miss you! Get 15% off your next service. This offer expires in 48 hours!';
  }

  const promoCode = await generatePromoCode(prefix);
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + expiresInHours);

  // Create the promotion
  await prisma.customer_promotions.create({
    data: {
      id: crypto.randomUUID(),
      customer_id: customerId,
      promo_code: promoCode,
      discount_percent: discountPercent,
      expires_at: expiresAt,
      trigger_type: triggerType,
      message,
      status: 'active',
      updated_at: new Date(),
    }
  });

  return { promoCode, discountPercent, expiresAt, message };
}
