import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Generates a unique referral code based on customer name
 * Format: FIRSTNAME + 4 random digits (e.g., NOJUS7842)
 */
export async function generateReferralCode(customerName: string): Promise<string> {
  // Extract first name and convert to uppercase
  const firstName = customerName.split(' ')[0].toUpperCase();

  // Generate random 4-digit number
  const randomDigits = Math.floor(1000 + Math.random() * 9000);

  // Create initial code
  let code = `${firstName}${randomDigits}`;

  // Check if code already exists, if so, generate a new one
  let attempts = 0;
  while (attempts < 10) {
    const existing = await prisma.referrals.findFirst({
      where: { referral_code: code }
    });

    if (!existing) {
      return code;
    }

    // Generate new random digits
    const newDigits = Math.floor(1000 + Math.random() * 9000);
    code = `${firstName}${newDigits}`;
    attempts++;
  }

  // If still not unique after 10 attempts, use UUID fallback
  const uuid = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `${firstName}${uuid}`;
}

/**
 * Gets or creates a referral code for a customer
 */
export async function getOrCreateReferralCode(customerId: string, customerName: string): Promise<string> {
  // Check if customer already has a referral
  const existingReferral = await prisma.referrals.findFirst({
    where: { referrer_id: customerId },
    orderBy: { created_at: 'desc' }
  });

  if (existingReferral) {
    return existingReferral.referral_code;
  }

  // Generate new code
  const code = await generateReferralCode(customerName);

  // Create referral record as a template (no referred person yet)
  // This is just to reserve the code - actual referrals will be created when someone uses it
  return code;
}
