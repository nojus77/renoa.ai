import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding retention features data...\n');

  // ═══════════════════════════════════════════════════════════════════════
  // SEASONAL CAMPAIGNS
  // ═══════════════════════════════════════════════════════════════════════

  console.log('📅 Creating seasonal campaigns...');

  const campaigns = [
    {
      id: crypto.randomUUID(),
      season: 'spring',
      campaign_name: 'Spring Refresh Package',
      service_types: ['Lawn Care', 'Landscaping', 'Mulching', 'Fertilization'],
      discount_percent: 15,
      email_subject: '🌸 Spring Refresh: Get Your Yard Ready!',
      email_body:
        "Spring is here! Time to refresh your lawn with professional care. Book now and save 15% on our Spring Refresh Package. Let's make your yard the envy of the neighborhood!",
      start_month: 3, // March
      end_month: 5, // May
      active: true,
      updated_at: new Date(),
    },
    {
      id: crypto.randomUUID(),
      season: 'summer',
      campaign_name: 'Summer Lawn Care Special',
      service_types: ['Lawn Care', 'Irrigation', 'Tree Trimming', 'Landscaping'],
      discount_percent: 10,
      email_subject: "☀️ Keep Your Lawn Green All Summer",
      email_body:
        "Don't let the heat damage your lawn. Schedule regular maintenance and save 10%. Our summer package includes lawn care, irrigation checks, and more!",
      start_month: 6, // June
      end_month: 8, // August
      active: true,
      updated_at: new Date(),
    },
    {
      id: crypto.randomUUID(),
      season: 'fall',
      campaign_name: 'Fall Cleanup Bundle',
      service_types: ['Leaf Removal', 'Gutter Cleaning', 'Winterization', 'Lawn Care'],
      discount_percent: 20,
      email_subject: '🍂 Fall Cleanup Checklist for Your Home',
      email_body:
        'Prepare your home for winter! Bundle leaf removal, gutter cleaning, and winterization services. Save 20% on our comprehensive fall cleanup package.',
      start_month: 9, // September
      end_month: 11, // November
      active: true,
      updated_at: new Date(),
    },
    {
      id: crypto.randomUUID(),
      season: 'winter',
      campaign_name: 'Winter Home Maintenance',
      service_types: ['HVAC', 'Snow Removal', 'Winter Prep', 'Gutter Cleaning'],
      discount_percent: 15,
      email_subject: '❄️ Winter Home Maintenance Essentials',
      email_body:
        'Keep your home safe and warm this winter. Schedule HVAC maintenance, prepare your gutters, and be ready for snow. Save 15% on winter services!',
      start_month: 12, // December
      end_month: 2, // February
      active: true,
      updated_at: new Date(),
    },
  ];

  // Delete existing campaigns first
  await prisma.seasonal_campaigns.deleteMany({});

  for (const campaign of campaigns) {
    await prisma.seasonal_campaigns.create({
      data: campaign,
    });
    console.log(`  ✓ ${campaign.season} campaign`);
  }

  console.log('\n💎 Creating loyalty rewards...');

  const rewards = [
    {
      id: crypto.randomUUID(),
      name: '$25 Service Credit',
      description:
        'Redeem for $25 off any service. Perfect for small jobs or to supplement a larger booking!',
      points_cost: 250,
      reward_value: 25,
      reward_type: 'discount_fixed',
      active: true,
      updated_at: new Date(),
    },
    {
      id: crypto.randomUUID(),
      name: '$50 Service Credit',
      description:
        'Save $50 on your next service! Great value for regular maintenance or one-time projects.',
      points_cost: 500,
      reward_value: 50,
      reward_type: 'discount_fixed',
      active: true,
      updated_at: new Date(),
    },
    {
      id: crypto.randomUUID(),
      name: '$100 Service Credit',
      description:
        'Our most popular reward! Use $100 towards any service and maximize your savings.',
      points_cost: 1000,
      reward_value: 100,
      reward_type: 'discount_fixed',
      active: true,
      updated_at: new Date(),
    },
    {
      id: crypto.randomUUID(),
      name: 'Free Basic Service (up to $150)',
      description:
        'Get a complete service on us! Perfect for lawn mowing, basic landscaping, or house cleaning.',
      points_cost: 1500,
      reward_value: 150,
      reward_type: 'free_service',
      active: true,
      updated_at: new Date(),
    },
    {
      id: crypto.randomUUID(),
      name: 'Priority Scheduling',
      description:
        'Jump the queue! Get priority booking for the next 90 days and choose your preferred time slots.',
      points_cost: 2000,
      reward_value: 0,
      reward_type: 'priority',
      active: true,
      updated_at: new Date(),
    },
    {
      id: crypto.randomUUID(),
      name: 'VIP Service Package (up to $300)',
      description:
        'Our ultimate reward! Get a comprehensive service package or multiple services worth up to $300.',
      points_cost: 3000,
      reward_value: 300,
      reward_type: 'free_service',
      active: true,
      updated_at: new Date(),
    },
  ];

  // Delete existing rewards first
  await prisma.loyalty_rewards.deleteMany({});

  for (const reward of rewards) {
    await prisma.loyalty_rewards.create({
      data: reward,
    });
    console.log(`  ✓ ${reward.name} (${reward.points_cost} points)`);
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
