import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Renoa platform promotions...');

  // Create Renoa promotions
  const promotions = [
    {
      id: crypto.randomUUID(),
      title: '15% Off Your First Service',
      description: 'Welcome to Renoa! Get 15% off your first service booking with any provider on our platform.',
      code: 'FIRST15',
      discount_type: 'percentage',
      discount_value: 15,
      is_renoa_promo: true,
      provider_id: null,
      service_type: null, // Applies to all services
      valid_from: new Date(),
      valid_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      max_uses: 1000,
      current_uses: 0,
      is_active: true,
      terms: 'Valid for new customers only. One use per customer. Cannot be combined with other offers.',
      updated_at: new Date(),
    },
    {
      id: crypto.randomUUID(),
      title: 'Leave a Review, Get 10% Off Next Service',
      description: 'Share your experience! Leave a review after completing your service and get 10% off your next booking.',
      code: 'THANKS10',
      discount_type: 'percentage',
      discount_value: 10,
      is_renoa_promo: true,
      provider_id: null,
      service_type: null,
      valid_from: new Date(),
      valid_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      max_uses: null, // Unlimited
      current_uses: 0,
      is_active: true,
      terms: 'Valid for 30 days after receiving the code. Must leave a review to qualify.',
      updated_at: new Date(),
    },
    {
      id: crypto.randomUUID(),
      title: 'Premium Review Bonus - 15% Off',
      description: 'Rated your service 4+ stars? Here\'s an extra thank you - enjoy 15% off your next service!',
      code: 'THANKS15',
      discount_type: 'percentage',
      discount_value: 15,
      is_renoa_promo: true,
      provider_id: null,
      service_type: null,
      valid_from: new Date(),
      valid_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      max_uses: null,
      current_uses: 0,
      is_active: true,
      terms: 'Valid for 30 days after receiving the code. Must rate service 4 or 5 stars.',
      updated_at: new Date(),
    },
    {
      id: crypto.randomUUID(),
      title: 'Spring Cleaning Special',
      description: 'Spring into action! Get $50 off any cleaning service booked this month.',
      code: 'SPRING2025',
      discount_type: 'fixed',
      discount_value: 50,
      is_renoa_promo: true,
      provider_id: null,
      service_type: 'House Cleaning',
      valid_from: new Date('2025-03-01'),
      valid_until: new Date('2025-05-31'),
      max_uses: 500,
      current_uses: 0,
      is_active: true,
      terms: 'Valid for House Cleaning services only. Minimum service value $200.',
      min_job_value: 200,
      updated_at: new Date(),
    },
    {
      id: crypto.randomUUID(),
      title: 'Lawn Care Season Kickoff',
      description: 'Get your lawn ready for summer! Enjoy 20% off lawn care services.',
      code: 'LAWN20',
      discount_type: 'percentage',
      discount_value: 20,
      is_renoa_promo: true,
      provider_id: null,
      service_type: 'Lawn Care',
      valid_from: new Date('2025-04-01'),
      valid_until: new Date('2025-06-30'),
      max_uses: 300,
      current_uses: 0,
      is_active: true,
      terms: 'Valid for Lawn Care services only.',
      updated_at: new Date(),
    },
    {
      id: crypto.randomUUID(),
      title: 'Refer a Friend - Both Get $25',
      description: 'Love Renoa? Refer a friend and you both get $25 off your next service!',
      code: 'REFER25',
      discount_type: 'fixed',
      discount_value: 25,
      is_renoa_promo: true,
      provider_id: null,
      service_type: null,
      valid_from: new Date(),
      valid_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      max_uses: null,
      current_uses: 0,
      is_active: true,
      terms: 'Both referrer and referee must complete a service. Valid for 60 days.',
      updated_at: new Date(),
    },
  ];

  for (const promo of promotions) {
    const existing = await prisma.promotions.findFirst({
      where: { code: promo.code },
    });

    if (existing) {
      console.log(`⏭️  Skipping ${promo.code} - already exists`);
      continue;
    }

    await prisma.promotions.create({
      data: promo,
    });
    console.log(`✅ Created promotion: ${promo.title} (${promo.code})`);
  }

  console.log('✨ Renoa promotions seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding promotions:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
