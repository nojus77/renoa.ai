import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding retention features data...\n');

  // ═══════════════════════════════════════════════════════════════════════
  // SEASONAL CAMPAIGNS
  // ═══════════════════════════════════════════════════════════════════════

  console.log('📅 Creating seasonal campaigns...');

  const campaigns = [
    {
      season: 'spring',
      campaignName: 'Spring Refresh Package',
      serviceTypes: ['Lawn Care', 'Landscaping', 'Mulching', 'Fertilization'],
      discountPercent: 15,
      emailSubject: '🌸 Spring Refresh: Get Your Yard Ready!',
      emailBody:
        "Spring is here! Time to refresh your lawn with professional care. Book now and save 15% on our Spring Refresh Package. Let's make your yard the envy of the neighborhood!",
      startMonth: 3, // March
      endMonth: 5, // May
      active: true,
    },
    {
      season: 'summer',
      campaignName: 'Summer Lawn Care Special',
      serviceTypes: ['Lawn Care', 'Irrigation', 'Tree Trimming', 'Landscaping'],
      discountPercent: 10,
      emailSubject: "☀️ Keep Your Lawn Green All Summer",
      emailBody:
        "Don't let the heat damage your lawn. Schedule regular maintenance and save 10%. Our summer package includes lawn care, irrigation checks, and more!",
      startMonth: 6, // June
      endMonth: 8, // August
      active: true,
    },
    {
      season: 'fall',
      campaignName: 'Fall Cleanup Bundle',
      serviceTypes: ['Leaf Removal', 'Gutter Cleaning', 'Winterization', 'Lawn Care'],
      discountPercent: 20,
      emailSubject: '🍂 Fall Cleanup Checklist for Your Home',
      emailBody:
        'Prepare your home for winter! Bundle leaf removal, gutter cleaning, and winterization services. Save 20% on our comprehensive fall cleanup package.',
      startMonth: 9, // September
      endMonth: 11, // November
      active: true,
    },
    {
      season: 'winter',
      campaignName: 'Winter Home Maintenance',
      serviceTypes: ['HVAC', 'Snow Removal', 'Winter Prep', 'Gutter Cleaning'],
      discountPercent: 15,
      emailSubject: '❄️ Winter Home Maintenance Essentials',
      emailBody:
        'Keep your home safe and warm this winter. Schedule HVAC maintenance, prepare your gutters, and be ready for snow. Save 15% on winter services!',
      startMonth: 12, // December
      endMonth: 2, // February
      active: true,
    },
  ];

  // Delete existing campaigns first
  await prisma.seasonalCampaign.deleteMany({});

  for (const campaign of campaigns) {
    await prisma.seasonalCampaign.create({
      data: campaign,
    });
    console.log(`  ✓ ${campaign.season} campaign`);
  }

  console.log('\n💎 Creating loyalty rewards...');

  const rewards = [
    {
      name: '$25 Service Credit',
      description:
        'Redeem for $25 off any service. Perfect for small jobs or to supplement a larger booking!',
      pointsCost: 250,
      rewardValue: 25,
      rewardType: 'discount_fixed',
      active: true,
    },
    {
      name: '$50 Service Credit',
      description:
        'Save $50 on your next service! Great value for regular maintenance or one-time projects.',
      pointsCost: 500,
      rewardValue: 50,
      rewardType: 'discount_fixed',
      active: true,
    },
    {
      name: '$100 Service Credit',
      description:
        'Our most popular reward! Use $100 towards any service and maximize your savings.',
      pointsCost: 1000,
      rewardValue: 100,
      rewardType: 'discount_fixed',
      active: true,
    },
    {
      name: 'Free Basic Service (up to $150)',
      description:
        'Get a complete service on us! Perfect for lawn mowing, basic landscaping, or house cleaning.',
      pointsCost: 1500,
      rewardValue: 150,
      rewardType: 'free_service',
      active: true,
    },
    {
      name: 'Priority Scheduling',
      description:
        'Jump the queue! Get priority booking for the next 90 days and choose your preferred time slots.',
      pointsCost: 2000,
      rewardValue: 0,
      rewardType: 'priority',
      active: true,
    },
    {
      name: 'VIP Service Package (up to $300)',
      description:
        'Our ultimate reward! Get a comprehensive service package or multiple services worth up to $300.',
      pointsCost: 3000,
      rewardValue: 300,
      rewardType: 'free_service',
      active: true,
    },
  ];

  // Delete existing rewards first
  await prisma.loyaltyReward.deleteMany({});

  for (const reward of rewards) {
    await prisma.loyaltyReward.create({
      data: reward,
    });
    console.log(`  ✓ ${reward.name} (${reward.pointsCost} points)`);
  }

  console.log('\n✅ Retention features seeded successfully!\n');
  console.log('Summary:');
  console.log(`  • ${campaigns.length} seasonal campaigns created`);
  console.log(`  • ${rewards.length} loyalty rewards created`);
}

main()
  .catch((e) => {
    console.error('Error seeding retention features:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
