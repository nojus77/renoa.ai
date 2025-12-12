import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding service bundles and upsells...');

  // Seed Service Bundles
  const bundles = [
    {
      id: 'spring-refresh-package',
      name: 'Spring Refresh Package',
      description:
        'Get your property ready for spring with our comprehensive outdoor refresh package. Includes lawn care, hedge trimming, fresh mulching, and gutter cleaning to ensure your home looks its best for the season.',
      service_types: ['Lawn Care', 'Hedge Trimming', 'Mulching', 'Gutter Cleaning'],
      regular_price: 599,
      bundle_price: 499,
      savings: 100,
      season: 'spring',
      active: true,
      display_order: 1,
      updated_at: new Date(),
    },
    {
      id: 'fall-cleanup-bundle',
      name: 'Fall Cleanup Bundle',
      description:
        'Prepare your property for winter with our fall cleanup bundle. Professional leaf removal, gutter cleaning, sprinkler winterization, and driveway pressure washing.',
      service_types: ['Leaf Removal', 'Gutter Cleaning', 'Winterize Sprinklers', 'Pressure Washing'],
      regular_price: 474,
      bundle_price: 399,
      savings: 75,
      season: 'fall',
      active: true,
      display_order: 2,
      updated_at: new Date(),
    },
    {
      id: 'home-exterior-package',
      name: 'Home Exterior Package',
      description:
        'Transform your home\'s curb appeal with our complete exterior package. Includes pressure washing, window cleaning, gutter cleaning, and exterior painting touch-ups.',
      service_types: ['Pressure Washing', 'Window Cleaning', 'Gutter Cleaning', 'Exterior Painting'],
      regular_price: 724,
      bundle_price: 599,
      savings: 125,
      season: null,
      active: true,
      display_order: 3,
      updated_at: new Date(),
    },
    {
      id: 'summer-maintenance-bundle',
      name: 'Summer Maintenance Bundle',
      description:
        'Keep your property pristine all summer long with weekly lawn mowing, bi-weekly hedge trimming, monthly fertilization, and seasonal weed control.',
      service_types: ['Lawn Mowing', 'Hedge Trimming', 'Fertilization', 'Weed Control'],
      regular_price: 549,
      bundle_price: 449,
      savings: 100,
      season: 'summer',
      active: true,
      display_order: 4,
      updated_at: new Date(),
    },
    {
      id: 'winter-property-care',
      name: 'Winter Property Care',
      description:
        'Protect your investment during winter months with snow removal, ice management, gutter de-icing, and seasonal property inspection.',
      service_types: ['Snow Removal', 'Ice Management', 'Gutter De-icing', 'Property Inspection'],
      regular_price: 424,
      bundle_price: 349,
      savings: 75,
      season: 'winter',
      active: true,
      display_order: 5,
      updated_at: new Date(),
    },
  ];

  console.log('Creating service bundles...');
  for (const bundle of bundles) {
    await prisma.service_bundles.upsert({
      where: { id: bundle.id },
      update: bundle,
      create: bundle,
    });
    console.log(`✅ Created/Updated: ${bundle.name}`);
  }

  // Seed Service Upsells
  const upsells = [
    // Lawn Care Upsells
    {
      id: crypto.randomUUID(),
      base_service: 'Lawn Care',
      upsell_service: 'Fertilization',
      upsell_price: 45,
      description: 'Professional fertilization to keep your lawn green and healthy',
      display_order: 1,
      conversion_rate: 0.32,
      updated_at: new Date(),
    },
    {
      id: crypto.randomUUID(),
      base_service: 'Lawn Care',
      upsell_service: 'Weed Control',
      upsell_price: 35,
      description: 'Target and eliminate weeds for a pristine lawn',
      display_order: 2,
      conversion_rate: 0.28,
      updated_at: new Date(),
    },
    {
      id: crypto.randomUUID(),
      base_service: 'Lawn Care',
      upsell_service: 'Aeration',
      upsell_price: 85,
      description: 'Core aeration to improve soil health and grass growth',
      display_order: 3,
      conversion_rate: 0.18,
      updated_at: new Date(),
    },
    {
      id: crypto.randomUUID(),
      base_service: 'Lawn Care',
      upsell_service: 'Hedge Trimming',
      upsell_price: 65,
      description: 'Shape and trim hedges and shrubs while we\'re there',
      display_order: 4,
      conversion_rate: 0.25,
      updated_at: new Date(),
    },

    // Painting Upsells
    {
      id: crypto.randomUUID(),
      base_service: 'Painting',
      upsell_service: 'Pressure Washing',
      upsell_price: 120,
      description: 'Prep surfaces with professional pressure washing',
      display_order: 1,
      conversion_rate: 0.42,
      updated_at: new Date(),
    },
    {
      id: crypto.randomUUID(),
      base_service: 'Painting',
      upsell_service: 'Gutter Cleaning',
      upsell_price: 75,
      description: 'Clean gutters while we have equipment on-site',
      display_order: 2,
      conversion_rate: 0.31,
      updated_at: new Date(),
    },
    {
      id: crypto.randomUUID(),
      base_service: 'Painting',
      upsell_service: 'Minor Repairs',
      upsell_price: 150,
      description: 'Fix small cracks and holes before painting',
      display_order: 3,
      conversion_rate: 0.38,
      updated_at: new Date(),
    },

    // Pressure Washing Upsells
    {
      id: crypto.randomUUID(),
      base_service: 'Pressure Washing',
      upsell_service: 'Deck Sealing',
      upsell_price: 180,
      description: 'Seal and protect deck after pressure washing',
      display_order: 1,
      conversion_rate: 0.37,
      updated_at: new Date(),
    },
    {
      id: crypto.randomUUID(),
      base_service: 'Pressure Washing',
      upsell_service: 'Window Cleaning',
      upsell_price: 95,
      description: 'Clean windows for complete exterior refresh',
      display_order: 2,
      conversion_rate: 0.29,
      updated_at: new Date(),
    },
    {
      id: crypto.randomUUID(),
      base_service: 'Pressure Washing',
      upsell_service: 'Gutter Cleaning',
      upsell_price: 75,
      description: 'Clean gutters while equipment is on-site',
      display_order: 3,
      conversion_rate: 0.34,
      updated_at: new Date(),
    },
  ];

  console.log('\nCreating service upsells...');
  // Clear existing upsells first
  await prisma.service_upsells.deleteMany({});

  for (const upsell of upsells) {
    await prisma.service_upsells.create({
      data: upsell,
    });
    console.log(`✅ Created: ${upsell.base_service} → ${upsell.upsell_service}`);
  }

  console.log('\n✨ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
