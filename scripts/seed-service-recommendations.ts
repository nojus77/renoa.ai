import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const serviceRecommendations = [
  // Landscaping base service
  {
    baseService: 'Landscaping',
    recommendedService: 'Tree Trimming',
    recommendedPrice: 250.00,
    displayOrder: 1,
    description: 'Keep your trees healthy and looking great with professional trimming',
    badge: 'Most popular add-on',
  },
  {
    baseService: 'Landscaping',
    recommendedService: 'Sprinkler Check',
    recommendedPrice: 125.00,
    displayOrder: 2,
    description: 'Ensure your irrigation system is working efficiently',
    badge: null,
  },
  {
    baseService: 'Landscaping',
    recommendedService: 'Seasonal Planting',
    recommendedPrice: 180.00,
    displayOrder: 3,
    description: 'Add color and curb appeal with seasonal flowers and plants',
    badge: 'Seasonal favorite',
  },

  // Lawn Care base service
  {
    baseService: 'Lawn Care',
    recommendedService: 'Fertilization',
    recommendedPrice: 95.00,
    displayOrder: 1,
    description: 'Give your lawn the nutrients it needs for healthy growth',
    badge: 'Most popular add-on',
  },
  {
    baseService: 'Lawn Care',
    recommendedService: 'Weed Control',
    recommendedPrice: 85.00,
    displayOrder: 2,
    description: 'Eliminate weeds and prevent them from coming back',
    badge: null,
  },
  {
    baseService: 'Lawn Care',
    recommendedService: 'Aeration',
    recommendedPrice: 120.00,
    displayOrder: 3,
    description: 'Improve soil health and water absorption',
    badge: 'Seasonal favorite',
  },

  // House Cleaning base service
  {
    baseService: 'House Cleaning',
    recommendedService: 'Deep Clean',
    recommendedPrice: 275.00,
    displayOrder: 1,
    description: 'Thorough cleaning of every corner of your home',
    badge: 'Most popular add-on',
  },
  {
    baseService: 'House Cleaning',
    recommendedService: 'Window Washing',
    recommendedPrice: 150.00,
    displayOrder: 2,
    description: 'Crystal clear windows inside and out',
    badge: null,
  },
  {
    baseService: 'House Cleaning',
    recommendedService: 'Carpet Cleaning',
    recommendedPrice: 185.00,
    displayOrder: 3,
    description: 'Professional steam cleaning for fresh, clean carpets',
    badge: null,
  },

  // Pool Service base service
  {
    baseService: 'Pool Service',
    recommendedService: 'Pool Equipment Check',
    recommendedPrice: 125.00,
    displayOrder: 1,
    description: 'Inspect pumps, filters, and heaters for optimal performance',
    badge: 'Most popular add-on',
  },
  {
    baseService: 'Pool Service',
    recommendedService: 'Green Pool Recovery',
    recommendedPrice: 350.00,
    displayOrder: 2,
    description: 'Restore your pool from green to clean',
    badge: null,
  },
  {
    baseService: 'Pool Service',
    recommendedService: 'Pool Tile Cleaning',
    recommendedPrice: 200.00,
    displayOrder: 3,
    description: 'Remove calcium buildup and stains from pool tiles',
    badge: null,
  },

  // Gutter Cleaning base service
  {
    baseService: 'Gutter Cleaning',
    recommendedService: 'Roof Inspection',
    recommendedPrice: 150.00,
    displayOrder: 1,
    description: 'Check for damage, leaks, and potential issues',
    badge: 'Most popular add-on',
  },
  {
    baseService: 'Gutter Cleaning',
    recommendedService: 'Gutter Guard Installation',
    recommendedPrice: 450.00,
    displayOrder: 2,
    description: 'Prevent future clogs with professional gutter guards',
    badge: null,
  },
  {
    baseService: 'Gutter Cleaning',
    recommendedService: 'Pressure Washing',
    recommendedPrice: 225.00,
    displayOrder: 3,
    description: 'Clean your driveway, walkways, and siding',
    badge: 'Seasonal favorite',
  },

  // Tree Service base service
  {
    baseService: 'Tree Service',
    recommendedService: 'Stump Grinding',
    recommendedPrice: 175.00,
    displayOrder: 1,
    description: 'Remove unsightly stumps from your property',
    badge: 'Most popular add-on',
  },
  {
    baseService: 'Tree Service',
    recommendedService: 'Emergency Tree Removal',
    recommendedPrice: 800.00,
    displayOrder: 2,
    description: '24/7 service for fallen or hazardous trees',
    badge: null,
  },
  {
    baseService: 'Tree Service',
    recommendedService: 'Tree Health Assessment',
    recommendedPrice: 125.00,
    displayOrder: 3,
    description: 'Professional evaluation of tree health and disease',
    badge: null,
  },

  // Pressure Washing base service
  {
    baseService: 'Pressure Washing',
    recommendedService: 'Deck Staining',
    recommendedPrice: 425.00,
    displayOrder: 1,
    description: 'Protect and beautify your deck with professional staining',
    badge: 'Most popular add-on',
  },
  {
    baseService: 'Pressure Washing',
    recommendedService: 'Fence Cleaning',
    recommendedPrice: 185.00,
    displayOrder: 2,
    description: 'Restore your fence to like-new condition',
    badge: null,
  },
  {
    baseService: 'Pressure Washing',
    recommendedService: 'Gutter Cleaning',
    recommendedPrice: 145.00,
    displayOrder: 3,
    description: 'Clean gutters while we have the equipment out',
    badge: 'Bundle & save',
  },

  // HVAC Service base service
  {
    baseService: 'HVAC Service',
    recommendedService: 'Air Duct Cleaning',
    recommendedPrice: 295.00,
    displayOrder: 1,
    description: 'Improve air quality and system efficiency',
    badge: 'Most popular add-on',
  },
  {
    baseService: 'HVAC Service',
    recommendedService: 'Thermostat Upgrade',
    recommendedPrice: 225.00,
    displayOrder: 2,
    description: 'Save energy with a smart thermostat installation',
    badge: null,
  },
  {
    baseService: 'HVAC Service',
    recommendedService: 'Filter Replacement Service',
    recommendedPrice: 85.00,
    displayOrder: 3,
    description: 'Regular filter changes for optimal performance',
    badge: 'Subscribe & save',
  },

  // Plumbing base service
  {
    baseService: 'Plumbing',
    recommendedService: 'Water Heater Maintenance',
    recommendedPrice: 150.00,
    displayOrder: 1,
    description: 'Extend the life of your water heater with annual maintenance',
    badge: 'Most popular add-on',
  },
  {
    baseService: 'Plumbing',
    recommendedService: 'Drain Cleaning',
    recommendedPrice: 135.00,
    displayOrder: 2,
    description: 'Prevent clogs with professional drain cleaning',
    badge: null,
  },
  {
    baseService: 'Plumbing',
    recommendedService: 'Leak Detection',
    recommendedPrice: 195.00,
    displayOrder: 3,
    description: 'Find hidden leaks before they cause damage',
    badge: null,
  },

  // Electrical base service
  {
    baseService: 'Electrical',
    recommendedService: 'Electrical Panel Inspection',
    recommendedPrice: 125.00,
    displayOrder: 1,
    description: 'Ensure your electrical panel is safe and up to code',
    badge: 'Most popular add-on',
  },
  {
    baseService: 'Electrical',
    recommendedService: 'Smoke Detector Installation',
    recommendedPrice: 95.00,
    displayOrder: 2,
    description: 'Upgrade to modern smoke and CO detectors',
    badge: null,
  },
  {
    baseService: 'Electrical',
    recommendedService: 'Surge Protection',
    recommendedPrice: 275.00,
    displayOrder: 3,
    description: 'Protect your electronics with whole-home surge protection',
    badge: null,
  },
];

async function main() {
  console.log('Starting to seed service recommendations...');

  // Clear existing recommendations
  await prisma.serviceRecommendation.deleteMany({});
  console.log('Cleared existing service recommendations');

  // Create recommendations
  for (const recommendation of serviceRecommendations) {
    await prisma.serviceRecommendation.create({
      data: recommendation,
    });
  }

  console.log(`✅ Successfully seeded ${serviceRecommendations.length} service recommendations`);

  // Print summary by base service
  const baseServices = [...new Set(serviceRecommendations.map(r => r.baseService))];
  console.log('\nRecommendations by service:');
  for (const baseService of baseServices) {
    const count = serviceRecommendations.filter(r => r.baseService === baseService).length;
    console.log(`  ${baseService}: ${count} recommendations`);
  }
}

main()
  .catch((e) => {
    console.error('Error seeding service recommendations:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
