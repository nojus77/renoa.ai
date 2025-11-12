import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Renoa platform promotions...');

  // Create Renoa promotions
  const promotions = [
    {
      title: '15% Off Your First Service',
      description: 'Welcome to Renoa! Get 15% off your first service booking with any provider on our platform.',
      code: 'FIRST15',
      discountType: 'percentage',
      discountValue: 15,
      isRenoaPromo: true,
      providerId: null,
      serviceType: null, // Applies to all services
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      maxUses: 1000,
      currentUses: 0,
      isActive: true,
      terms: 'Valid for new customers only. One use per customer. Cannot be combined with other offers.',
    },
    {
      title: 'Leave a Review, Get 10% Off Next Service',
      description: 'Share your experience! Leave a review after completing your service and get 10% off your next booking.',
      code: 'THANKS10',
      discountType: 'percentage',
      discountValue: 10,
      isRenoaPromo: true,
      providerId: null,
      serviceType: null,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      maxUses: null, // Unlimited
      currentUses: 0,
      isActive: true,
      terms: 'Valid for 30 days after receiving the code. Must leave a review to qualify.',
    },
    {
      title: 'Premium Review Bonus - 15% Off',
      description: 'Rated your service 4+ stars? Here\'s an extra thank you - enjoy 15% off your next service!',
      code: 'THANKS15',
      discountType: 'percentage',
      discountValue: 15,
      isRenoaPromo: true,
      providerId: null,
      serviceType: null,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      maxUses: null,
      currentUses: 0,
      isActive: true,
      terms: 'Valid for 30 days after receiving the code. Must rate service 4 or 5 stars.',
    },
    {
      title: 'Spring Cleaning Special',
      description: 'Spring into action! Get $50 off any cleaning service booked this month.',
      code: 'SPRING2025',
      discountType: 'fixed',
      discountValue: 50,
      isRenoaPromo: true,
      providerId: null,
      serviceType: 'House Cleaning',
      validFrom: new Date('2025-03-01'),
      validUntil: new Date('2025-05-31'),
      maxUses: 500,
      currentUses: 0,
      isActive: true,
      terms: 'Valid for House Cleaning services only. Minimum service value $200.',
      minJobValue: 200,
    },
    {
      title: 'Lawn Care Season Kickoff',
      description: 'Get your lawn ready for summer! Enjoy 20% off lawn care services.',
      code: 'LAWN20',
      discountType: 'percentage',
      discountValue: 20,
      isRenoaPromo: true,
      providerId: null,
      serviceType: 'Lawn Care',
      validFrom: new Date('2025-04-01'),
      validUntil: new Date('2025-06-30'),
      maxUses: 300,
      currentUses: 0,
      isActive: true,
      terms: 'Valid for Lawn Care services only.',
    },
    {
      title: 'Refer a Friend - Both Get $25',
      description: 'Love Renoa? Refer a friend and you both get $25 off your next service!',
      code: 'REFER25',
      discountType: 'fixed',
      discountValue: 25,
      isRenoaPromo: true,
      providerId: null,
      serviceType: null,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      maxUses: null,
      currentUses: 0,
      isActive: true,
      terms: 'Both referrer and referee must complete a service. Valid for 60 days.',
    },
  ];

  for (const promo of promotions) {
    const existing = await prisma.promotion.findFirst({
      where: { code: promo.code },
    });

    if (existing) {
      console.log(`⏭️  Skipping ${promo.code} - already exists`);
      continue;
    }

    await prisma.promotion.create({
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
