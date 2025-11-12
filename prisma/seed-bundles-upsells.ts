import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding service bundles and upsells...');

  // Seed Service Bundles
  const bundles = [
    {
      name: 'Spring Refresh Package',
      description:
        'Get your property ready for spring with our comprehensive outdoor refresh package. Includes lawn care, hedge trimming, fresh mulching, and gutter cleaning to ensure your home looks its best for the season.',
      serviceTypes: ['Lawn Care', 'Hedge Trimming', 'Mulching', 'Gutter Cleaning'],
      regularPrice: 599,
      bundlePrice: 499,
      savings: 100,
      season: 'spring',
      active: true,
      displayOrder: 1,
    },
    {
      name: 'Fall Cleanup Bundle',
      description:
        'Prepare your property for winter with our fall cleanup bundle. Professional leaf removal, gutter cleaning, sprinkler winterization, and driveway pressure washing.',
      serviceTypes: ['Leaf Removal', 'Gutter Cleaning', 'Winterize Sprinklers', 'Pressure Washing'],
      regularPrice: 474,
      bundlePrice: 399,
      savings: 75,
      season: 'fall',
      active: true,
      displayOrder: 2,
    },
    {
      name: 'Home Exterior Package',
      description:
        'Transform your home\'s curb appeal with our complete exterior package. Includes pressure washing, window cleaning, gutter cleaning, and exterior painting touch-ups.',
      serviceTypes: ['Pressure Washing', 'Window Cleaning', 'Gutter Cleaning', 'Exterior Painting'],
      regularPrice: 724,
      bundlePrice: 599,
      savings: 125,
      season: null, // year-round
      active: true,
      displayOrder: 3,
    },
    {
      name: 'Summer Maintenance Bundle',
      description:
        'Keep your property pristine all summer long with weekly lawn mowing, bi-weekly hedge trimming, monthly fertilization, and seasonal weed control.',
      serviceTypes: ['Lawn Mowing', 'Hedge Trimming', 'Fertilization', 'Weed Control'],
      regularPrice: 549,
      bundlePrice: 449,
      savings: 100,
      season: 'summer',
      active: true,
      displayOrder: 4,
    },
    {
      name: 'Winter Property Care',
      description:
        'Protect your investment during winter months with snow removal, ice management, gutter de-icing, and seasonal property inspection.',
      serviceTypes: ['Snow Removal', 'Ice Management', 'Gutter De-icing', 'Property Inspection'],
      regularPrice: 424,
      bundlePrice: 349,
      savings: 75,
      season: 'winter',
      active: true,
      displayOrder: 5,
    },
  ];

  console.log('Creating service bundles...');
  for (const bundle of bundles) {
    await prisma.serviceBundle.upsert({
      where: { id: bundle.name.replace(/\s+/g, '-').toLowerCase() },
      update: bundle,
      create: bundle,
    });
    console.log(`✅ Created/Updated: ${bundle.name}`);
  }

  // Seed Service Upsells
  const upsells = [
    // Lawn Care Upsells
    {
      baseService: 'Lawn Care',
      upsellService: 'Fertilization',
      upsellPrice: 45,
      description: 'Professional fertilization to keep your lawn green and healthy',
      displayOrder: 1,
      conversionRate: 0.32,
    },
    {
      baseService: 'Lawn Care',
      upsellService: 'Weed Control',
      upsellPrice: 35,
      description: 'Target and eliminate weeds for a pristine lawn',
      displayOrder: 2,
      conversionRate: 0.28,
    },
    {
      baseService: 'Lawn Care',
      upsellService: 'Aeration',
      upsellPrice: 85,
      description: 'Core aeration to improve soil health and grass growth',
      displayOrder: 3,
      conversionRate: 0.18,
    },
    {
      baseService: 'Lawn Care',
      upsellService: 'Hedge Trimming',
      upsellPrice: 65,
      description: 'Shape and trim hedges and shrubs while we\'re there',
      displayOrder: 4,
      conversionRate: 0.25,
    },

    // Painting Upsells
    {
      baseService: 'Painting',
      upsellService: 'Pressure Washing',
      upsellPrice: 120,
      description: 'Prep surfaces with professional pressure washing',
      displayOrder: 1,
      conversionRate: 0.42,
    },
    {
      baseService: 'Painting',
      upsellService: 'Gutter Cleaning',
      upsellPrice: 75,
      description: 'Clean gutters while we have equipment on-site',
      displayOrder: 2,
      conversionRate: 0.31,
    },
    {
      baseService: 'Painting',
      upsellService: 'Minor Repairs',
      upsellPrice: 150,
      description: 'Fix small cracks and holes before painting',
      displayOrder: 3,
      conversionRate: 0.38,
    },

    // HVAC Upsells
    {
      baseService: 'HVAC',
      upsellService: 'Air Duct Cleaning',
      upsellPrice: 150,
      description: 'Improve air quality with thorough duct cleaning',
      displayOrder: 1,
      conversionRate: 0.29,
    },
    {
      baseService: 'HVAC',
      upsellService: 'Thermostat Installation',
      upsellPrice: 200,
      description: 'Upgrade to a smart thermostat for better efficiency',
      displayOrder: 2,
      conversionRate: 0.22,
    },
    {
      baseService: 'HVAC',
      upsellService: 'Filter Replacement',
      upsellPrice: 45,
      description: 'Premium air filter installation included',
      displayOrder: 3,
      conversionRate: 0.51,
    },

    // Landscaping Upsells
    {
      baseService: 'Landscaping',
      upsellService: 'Tree Trimming',
      upsellPrice: 200,
      description: 'Professional tree trimming and branch removal',
      displayOrder: 1,
      conversionRate: 0.26,
    },
    {
      baseService: 'Landscaping',
      upsellService: 'Mulching',
      upsellPrice: 65,
      description: 'Fresh mulch for garden beds and landscaped areas',
      displayOrder: 2,
      conversionRate: 0.35,
    },
    {
      baseService: 'Landscaping',
      upsellService: 'Irrigation System Check',
      upsellPrice: 95,
      description: 'Inspect and optimize your irrigation system',
      displayOrder: 3,
      conversionRate: 0.19,
    },

    // Plumbing Upsells
    {
      baseService: 'Plumbing',
      upsellService: 'Water Heater Flush',
      upsellPrice: 80,
      description: 'Extend water heater life with professional flushing',
      displayOrder: 1,
      conversionRate: 0.24,
    },
    {
      baseService: 'Plumbing',
      upsellService: 'Drain Cleaning',
      upsellPrice: 95,
      description: 'Prevent future clogs with main line cleaning',
      displayOrder: 2,
      conversionRate: 0.33,
    },
    {
      baseService: 'Plumbing',
      upsellService: 'Leak Detection',
      upsellPrice: 125,
      description: 'Comprehensive leak inspection and detection',
      displayOrder: 3,
      conversionRate: 0.21,
    },

    // Electrical Upsells
    {
      baseService: 'Electrical',
      upsellService: 'Outlet Installation',
      upsellPrice: 85,
      description: 'Add additional outlets where you need them',
      displayOrder: 1,
      conversionRate: 0.28,
    },
    {
      baseService: 'Electrical',
      upsellService: 'Surge Protection',
      upsellPrice: 175,
      description: 'Whole-home surge protector installation',
      displayOrder: 2,
      conversionRate: 0.19,
    },
    {
      baseService: 'Electrical',
      upsellService: 'Smoke Detector Update',
      upsellPrice: 120,
      description: 'Replace old smoke detectors with new models',
      displayOrder: 3,
      conversionRate: 0.31,
    },

    // Pressure Washing Upsells
    {
      baseService: 'Pressure Washing',
      upsellService: 'Deck Sealing',
      upsellPrice: 180,
      description: 'Seal and protect deck after pressure washing',
      displayOrder: 1,
      conversionRate: 0.37,
    },
    {
      baseService: 'Pressure Washing',
      upsellService: 'Window Cleaning',
      upsellPrice: 95,
      description: 'Clean windows for complete exterior refresh',
      displayOrder: 2,
      conversionRate: 0.29,
    },
    {
      baseService: 'Pressure Washing',
      upsellService: 'Gutter Cleaning',
      upsellPrice: 75,
      description: 'Clean gutters while equipment is on-site',
      displayOrder: 3,
      conversionRate: 0.34,
    },

    // Pool Service Upsells
    {
      baseService: 'Pool Service',
      upsellService: 'Pool Equipment Inspection',
      upsellPrice: 65,
      description: 'Comprehensive check of pumps, filters, and heaters',
      displayOrder: 1,
      conversionRate: 0.26,
    },
    {
      baseService: 'Pool Service',
      upsellService: 'Tile Cleaning',
      upsellPrice: 110,
      description: 'Remove calcium buildup from pool tiles',
      displayOrder: 2,
      conversionRate: 0.22,
    },
    {
      baseService: 'Pool Service',
      upsellService: 'Chemical Balance',
      upsellPrice: 45,
      description: 'Premium chemical treatment and balancing',
      displayOrder: 3,
      conversionRate: 0.44,
    },
  ];

  console.log('\nCreating service upsells...');
  for (const upsell of upsells) {
    await prisma.serviceUpsell.create({
      data: upsell,
    });
    console.log(`✅ Created: ${upsell.baseService} → ${upsell.upsellService}`);
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
