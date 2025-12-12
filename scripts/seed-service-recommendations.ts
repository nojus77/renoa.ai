import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

const serviceRecommendations = [
  // Landscaping base service
  {
    id: crypto.randomUUID(),
    base_service: 'Landscaping',
    recommended_service: 'Tree Trimming',
    recommended_price: 250.00,
    display_order: 1,
    description: 'Keep your trees healthy and looking great with professional trimming',
    badge: 'Most popular add-on',
    updated_at: new Date(),
  },
  {
    id: crypto.randomUUID(),
    base_service: 'Landscaping',
    recommended_service: 'Sprinkler Check',
    recommended_price: 125.00,
    display_order: 2,
    description: 'Ensure your irrigation system is working efficiently',
    badge: null,
    updated_at: new Date(),
  },
  {
    id: crypto.randomUUID(),
    base_service: 'Landscaping',
    recommended_service: 'Seasonal Planting',
    recommended_price: 180.00,
    display_order: 3,
    description: 'Add color and curb appeal with seasonal flowers and plants',
    badge: 'Seasonal favorite',
    updated_at: new Date(),
  },

  // Lawn Care base service
  {
    id: crypto.randomUUID(),
    base_service: 'Lawn Care',
    recommended_service: 'Fertilization',
    recommended_price: 95.00,
    display_order: 1,
    description: 'Give your lawn the nutrients it needs for healthy growth',
    badge: 'Most popular add-on',
    updated_at: new Date(),
  },
  {
    id: crypto.randomUUID(),
    base_service: 'Lawn Care',
    recommended_service: 'Weed Control',
    recommended_price: 85.00,
    display_order: 2,
    description: 'Eliminate weeds and prevent them from coming back',
    badge: null,
    updated_at: new Date(),
  },
  {
    id: crypto.randomUUID(),
    base_service: 'Lawn Care',
    recommended_service: 'Aeration',
    recommended_price: 120.00,
    display_order: 3,
    description: 'Improve soil health and water absorption',
    badge: 'Seasonal favorite',
    updated_at: new Date(),
  },

  // House Cleaning base service
  {
    id: crypto.randomUUID(),
    base_service: 'House Cleaning',
    recommended_service: 'Deep Clean',
    recommended_price: 275.00,
    display_order: 1,
    description: 'Thorough cleaning of every corner of your home',
    badge: 'Most popular add-on',
    updated_at: new Date(),
  },
  {
    id: crypto.randomUUID(),
    base_service: 'House Cleaning',
    recommended_service: 'Window Washing',
    recommended_price: 150.00,
    display_order: 2,
    description: 'Crystal clear windows inside and out',
    badge: null,
    updated_at: new Date(),
  },
  {
    id: crypto.randomUUID(),
    base_service: 'House Cleaning',
    recommended_service: 'Carpet Cleaning',
    recommended_price: 185.00,
    display_order: 3,
    description: 'Professional steam cleaning for fresh, clean carpets',
    badge: null,
    updated_at: new Date(),
  },

  // Pool Service base service
  {
    id: crypto.randomUUID(),
    base_service: 'Pool Service',
    recommended_service: 'Pool Equipment Check',
    recommended_price: 125.00,
    display_order: 1,
    description: 'Inspect pumps, filters, and heaters for optimal performance',
    badge: 'Most popular add-on',
    updated_at: new Date(),
  },
  {
    id: crypto.randomUUID(),
    base_service: 'Pool Service',
    recommended_service: 'Green Pool Recovery',
    recommended_price: 350.00,
    display_order: 2,
    description: 'Restore your pool from green to clean',
    badge: null,
    updated_at: new Date(),
  },
  {
    id: crypto.randomUUID(),
    base_service: 'Pool Service',
    recommended_service: 'Pool Tile Cleaning',
    recommended_price: 200.00,
    display_order: 3,
    description: 'Remove calcium buildup and stains from pool tiles',
    badge: null,
    updated_at: new Date(),
  },

  // Gutter Cleaning base service
  {
    id: crypto.randomUUID(),
    base_service: 'Gutter Cleaning',
    recommended_service: 'Roof Inspection',
    recommended_price: 150.00,
    display_order: 1,
    description: 'Check for damage, leaks, and potential issues',
    badge: 'Most popular add-on',
    updated_at: new Date(),
  },
  {
    id: crypto.randomUUID(),
    base_service: 'Gutter Cleaning',
    recommended_service: 'Gutter Guard Installation',
    recommended_price: 450.00,
    display_order: 2,
    description: 'Prevent future clogs with professional gutter guards',
    badge: null,
    updated_at: new Date(),
  },
  {
    id: crypto.randomUUID(),
    base_service: 'Gutter Cleaning',
    recommended_service: 'Pressure Washing',
    recommended_price: 225.00,
    display_order: 3,
    description: 'Clean your driveway, walkways, and siding',
    badge: 'Seasonal favorite',
    updated_at: new Date(),
  },

  // Tree Service base service
  {
    id: crypto.randomUUID(),
    base_service: 'Tree Service',
    recommended_service: 'Stump Grinding',
    recommended_price: 175.00,
    display_order: 1,
    description: 'Remove unsightly stumps from your property',
    badge: 'Most popular add-on',
    updated_at: new Date(),
  },
  {
    id: crypto.randomUUID(),
    base_service: 'Tree Service',
    recommended_service: 'Emergency Tree Removal',
    recommended_price: 800.00,
    display_order: 2,
    description: '24/7 service for fallen or hazardous trees',
    badge: null,
    updated_at: new Date(),
  },
  {
    id: crypto.randomUUID(),
    base_service: 'Tree Service',
    recommended_service: 'Tree Health Assessment',
    recommended_price: 125.00,
    display_order: 3,
    description: 'Professional evaluation of tree health and disease',
    badge: null,
    updated_at: new Date(),
  },

  // Pressure Washing base service
  {
    id: crypto.randomUUID(),
    base_service: 'Pressure Washing',
    recommended_service: 'Deck Staining',
    recommended_price: 425.00,
    display_order: 1,
    description: 'Protect and beautify your deck with professional staining',
    badge: 'Most popular add-on',
    updated_at: new Date(),
  },
  {
    id: crypto.randomUUID(),
    base_service: 'Pressure Washing',
    recommended_service: 'Fence Cleaning',
    recommended_price: 185.00,
    display_order: 2,
    description: 'Restore your fence to like-new condition',
    badge: null,
    updated_at: new Date(),
  },
  {
    id: crypto.randomUUID(),
    base_service: 'Pressure Washing',
    recommended_service: 'Gutter Cleaning',
    recommended_price: 145.00,
    display_order: 3,
    description: 'Clean gutters while we have the equipment out',
    badge: 'Bundle & save',
    updated_at: new Date(),
  },

  // HVAC Service base service
  {
    id: crypto.randomUUID(),
    base_service: 'HVAC Service',
    recommended_service: 'Air Duct Cleaning',
    recommended_price: 295.00,
    display_order: 1,
    description: 'Improve air quality and system efficiency',
    badge: 'Most popular add-on',
    updated_at: new Date(),
  },
  {
    id: crypto.randomUUID(),
    base_service: 'HVAC Service',
    recommended_service: 'Thermostat Upgrade',
    recommended_price: 225.00,
    display_order: 2,
    description: 'Save energy with a smart thermostat installation',
    badge: null,
    updated_at: new Date(),
  },
  {
    id: crypto.randomUUID(),
    base_service: 'HVAC Service',
    recommended_service: 'Filter Replacement Service',
    recommended_price: 85.00,
    display_order: 3,
    description: 'Regular filter changes for optimal performance',
    badge: 'Subscribe & save',
    updated_at: new Date(),
  },

  // Plumbing base service
  {
    id: crypto.randomUUID(),
    base_service: 'Plumbing',
    recommended_service: 'Water Heater Maintenance',
    recommended_price: 150.00,
    display_order: 1,
    description: 'Extend the life of your water heater with annual maintenance',
    badge: 'Most popular add-on',
    updated_at: new Date(),
  },
  {
    id: crypto.randomUUID(),
    base_service: 'Plumbing',
    recommended_service: 'Drain Cleaning',
    recommended_price: 135.00,
    display_order: 2,
    description: 'Prevent clogs with professional drain cleaning',
    badge: null,
    updated_at: new Date(),
  },
  {
    id: crypto.randomUUID(),
    base_service: 'Plumbing',
    recommended_service: 'Leak Detection',
    recommended_price: 195.00,
    display_order: 3,
    description: 'Find hidden leaks before they cause damage',
    badge: null,
    updated_at: new Date(),
  },

  // Electrical base service
  {
    id: crypto.randomUUID(),
    base_service: 'Electrical',
    recommended_service: 'Electrical Panel Inspection',
    recommended_price: 125.00,
    display_order: 1,
    description: 'Ensure your electrical panel is safe and up to code',
    badge: 'Most popular add-on',
    updated_at: new Date(),
  },
  {
    id: crypto.randomUUID(),
    base_service: 'Electrical',
    recommended_service: 'Smoke Detector Installation',
    recommended_price: 95.00,
    display_order: 2,
    description: 'Upgrade to modern smoke and CO detectors',
    badge: null,
    updated_at: new Date(),
  },
  {
    id: crypto.randomUUID(),
    base_service: 'Electrical',
    recommended_service: 'Surge Protection',
    recommended_price: 275.00,
    display_order: 3,
    description: 'Protect your electronics with whole-home surge protection',
    badge: null,
    updated_at: new Date(),
  },
];

async function main() {
  console.log('Starting to seed service recommendations...');

  // Clear existing recommendations
  await prisma.service_recommendations.deleteMany({});
  console.log('Cleared existing service recommendations');

  // Create recommendations
  for (const recommendation of serviceRecommendations) {
    await prisma.service_recommendations.create({
      data: recommendation,
    });
  }

  console.log(`Successfully seeded ${serviceRecommendations.length} service recommendations`);

  // Print summary by base service
  const baseServices = Array.from(new Set(serviceRecommendations.map(r => r.base_service)));
  console.log('\nRecommendations by service:');
  for (const baseService of baseServices) {
    const count = serviceRecommendations.filter(r => r.base_service === baseService).length;
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
