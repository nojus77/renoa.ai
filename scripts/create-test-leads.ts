import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PROVIDER_ID = '25555c94-c1e0-40b9-af19-21a56c9e11bd'; // Premier Outdoor Solutions

// Helper to get date for next week (starting from Monday)
function getDateNextWeek(dayOffset: number, hour: number = 10): Date {
  const today = new Date();
  const currentDay = today.getDay(); // 0 = Sunday
  const daysUntilNextMonday = currentDay === 0 ? 1 : 8 - currentDay;

  const nextMonday = new Date(today);
  nextMonday.setDate(today.getDate() + daysUntilNextMonday + dayOffset);
  nextMonday.setHours(hour, 0, 0, 0);

  return nextMonday;
}

// Sample lead data with variety
const testLeads = [
  {
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.johnson@email.com',
    phone: '555-0101',
    address: '123 Maple Street',
    city: 'Chicago',
    state: 'IL',
    zip: '60601',
    propertyType: 'single_family' as const,
    serviceInterest: 'landscaping' as const,
    leadSource: 'website',
    tier: 1,
    notes: 'Need weekly lawn mowing service for residential property. Prefer early morning schedule.',
    dayOffset: 0,
    hour: 9,
  },
  {
    firstName: 'Michael',
    lastName: 'Chen',
    email: 'mchen@email.com',
    phone: '555-0102',
    address: '456 Oak Avenue',
    city: 'Chicago',
    state: 'IL',
    zip: '60602',
    propertyType: 'single_family' as const,
    serviceInterest: 'tree_service' as const,
    leadSource: 'website',
    tier: 1,
    notes: 'Large oak tree needs removal. Located in backyard, about 40 feet tall.',
    dayOffset: 1,
    hour: 10,
  },
  {
    firstName: 'Emily',
    lastName: 'Rodriguez',
    email: 'emily.r@email.com',
    phone: '555-0103',
    address: '789 Pine Road',
    city: 'Naperville',
    state: 'IL',
    zip: '60540',
    propertyType: 'single_family' as const,
    serviceInterest: 'landscaping' as const,
    leadSource: 'website',
    tier: 2,
    notes: 'Looking for complete backyard redesign with patio, flower beds, and privacy hedges.',
    dayOffset: 1,
    hour: 14,
  },
  {
    firstName: 'David',
    lastName: 'Park',
    email: 'dpark@email.com',
    phone: '555-0104',
    address: '321 Birch Lane',
    city: 'Evanston',
    state: 'IL',
    zip: '60201',
    propertyType: 'single_family' as const,
    serviceInterest: 'lawn_care' as const,
    leadSource: 'website',
    tier: 1,
    notes: 'Need snow removal service for driveway and walkways this winter season.',
    dayOffset: 2,
    hour: 11,
  },
  {
    firstName: 'Jennifer',
    lastName: 'Smith',
    email: 'jsmith@email.com',
    phone: '555-0105',
    address: '654 Cedar Court',
    city: 'Oak Park',
    state: 'IL',
    zip: '60302',
    propertyType: 'single_family' as const,
    serviceInterest: 'landscaping' as const,
    leadSource: 'website',
    tier: 2,
    notes: 'Need professional hedge trimming for front yard privacy hedges. About 100 linear feet.',
    dayOffset: 3,
    hour: 9,
  },
  {
    firstName: 'Robert',
    lastName: 'Martinez',
    email: 'rmartinez@email.com',
    phone: '555-0106',
    address: '987 Elm Street',
    city: 'Skokie',
    state: 'IL',
    zip: '60076',
    propertyType: 'single_family' as const,
    serviceInterest: 'lawn_care' as const,
    leadSource: 'website',
    tier: 1,
    notes: 'Spring fertilization and weed control needed for entire lawn.',
    dayOffset: 3,
    hour: 15,
  },
  {
    firstName: 'Amanda',
    lastName: 'Lee',
    email: 'alee@email.com',
    phone: '555-0107',
    address: '147 Willow Way',
    city: 'Wilmette',
    state: 'IL',
    zip: '60091',
    propertyType: 'single_family' as const,
    serviceInterest: 'landscaping' as const,
    leadSource: 'website',
    tier: 2,
    notes: 'Need fresh mulch installed in all garden beds. Approximately 15 cubic yards.',
    dayOffset: 4,
    hour: 10,
  },
  {
    firstName: 'Christopher',
    lastName: 'Brown',
    email: 'cbrown@email.com',
    phone: '555-0108',
    address: '258 Spruce Drive',
    city: 'Winnetka',
    state: 'IL',
    zip: '60093',
    propertyType: 'single_family' as const,
    serviceInterest: 'lawn_care' as const,
    leadSource: 'website',
    tier: 1,
    notes: 'Large property needs bi-weekly mowing. Have riding mower access if needed.',
    dayOffset: 4,
    hour: 13,
  },
  {
    firstName: 'Jessica',
    lastName: 'Taylor',
    email: 'jtaylor@email.com',
    phone: '555-0109',
    address: '369 Ash Boulevard',
    city: 'Glencoe',
    state: 'IL',
    zip: '60022',
    propertyType: 'single_family' as const,
    serviceInterest: 'landscaping' as const,
    leadSource: 'website',
    tier: 2,
    notes: 'Complete front yard renovation with new plantings, stone walkway, and irrigation system.',
    dayOffset: 5,
    hour: 11,
  },
  {
    firstName: 'Daniel',
    lastName: 'White',
    email: 'dwhite@email.com',
    phone: '555-0110',
    address: '741 Poplar Place',
    city: 'Highland Park',
    state: 'IL',
    zip: '60035',
    propertyType: 'single_family' as const,
    serviceInterest: 'lawn_care' as const,
    leadSource: 'website',
    tier: 2,
    notes: 'Fall lawn aeration and overseeding for healthier grass next spring.',
    dayOffset: 6,
    hour: 10,
  },
];

async function createTestLeads() {
  console.log('🌱 Creating 10 test leads for Premier Outdoor Solutions...\n');

  for (const lead of testLeads) {
    const scheduledDate = getDateNextWeek(lead.dayOffset, lead.hour);

    try {
      const created = await prisma.lead.create({
        data: {
          firstName: lead.firstName,
          lastName: lead.lastName,
          email: lead.email,
          phone: lead.phone,
          address: lead.address,
          city: lead.city,
          state: lead.state,
          zip: lead.zip,
          propertyType: lead.propertyType,
          serviceInterest: lead.serviceInterest,
          leadSource: lead.leadSource,
          tier: lead.tier,
          notes: lead.notes,
          status: 'new',
          assignedProviderId: PROVIDER_ID,
          createdAt: scheduledDate,
          updatedAt: scheduledDate,
        },
      });

      console.log(`✅ Created lead: ${lead.firstName} ${lead.lastName} - ${lead.serviceInterest}`);
      console.log(`   📅 Scheduled for: ${scheduledDate.toLocaleString()}`);
      console.log(`   📍 ${lead.address}, ${lead.city}\n`);
    } catch (error) {
      console.error(`❌ Failed to create lead for ${lead.firstName} ${lead.lastName}:`, error);
    }
  }

  console.log('\n✨ Done! All test leads created.');
}

createTestLeads()
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
