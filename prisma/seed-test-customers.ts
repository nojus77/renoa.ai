import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Provider ID for Elite Climate Control - adjust if needed
const PROVIDER_ID = process.env.SEED_PROVIDER_ID || '25555c94-c1e0-40b9-af19-21a56c9e11bd';

// Test customers for Elite Climate Control
// Chicago area addresses - Edison Park, Sauganash, Beverly, Mount Greenwood
const testCustomers = [
  {
    name: 'TEST - Michael O\'Brien',
    email: 'test.mobrien@example.com',
    phone: '(773) 555-0101',
    address: '6234 N Oleander Ave, Chicago, IL 60631', // Edison Park
    notes: 'Test customer - Edison Park neighborhood. 2-story colonial, gas furnace.',
    tags: ['test', 'residential', 'hvac'],
  },
  {
    name: 'TEST - Susan Kowalczyk',
    email: 'test.skowalczyk@example.com',
    phone: '(773) 555-0102',
    address: '5847 N Kostner Ave, Chicago, IL 60646', // Sauganash
    notes: 'Test customer - Sauganash area. Ranch style home, central AC unit from 2018.',
    tags: ['test', 'residential', 'hvac'],
  },
  {
    name: 'TEST - Robert & Linda Murphy',
    email: 'test.murphy@example.com',
    phone: '(773) 555-0103',
    address: '10234 S Longwood Dr, Chicago, IL 60643', // Beverly
    notes: 'Test customer - Beverly neighborhood. Victorian home, boiler heating system.',
    tags: ['test', 'residential', 'hvac', 'boiler'],
  },
  {
    name: 'TEST - James Fitzgerald',
    email: 'test.jfitzgerald@example.com',
    phone: '(773) 555-0104',
    address: '3456 W 111th St, Chicago, IL 60655', // Mount Greenwood
    notes: 'Test customer - Mount Greenwood. Bi-level home, needs annual HVAC maintenance.',
    tags: ['test', 'residential', 'hvac', 'maintenance'],
  },
  {
    name: 'TEST - Patricia Nowak',
    email: 'test.pnowak@example.com',
    phone: '(773) 555-0105',
    address: '6712 N Olcott Ave, Chicago, IL 60631', // Edison Park
    notes: 'Test customer - Edison Park. Cape Cod style, dual zone HVAC system.',
    tags: ['test', 'residential', 'hvac'],
  },
  {
    name: 'TEST - Thomas & Maria Garcia',
    email: 'test.garcia@example.com',
    phone: '(773) 555-0106',
    address: '9876 S Hamilton Ave, Chicago, IL 60643', // Beverly
    notes: 'Test customer - Beverly. Bungalow, older furnace may need replacement soon.',
    tags: ['test', 'residential', 'hvac', 'priority'],
  },
  {
    name: 'TEST - Daniel McCarthy',
    email: 'test.dmccarthy@example.com',
    phone: '(773) 555-0107',
    address: '5423 N Keeler Ave, Chicago, IL 60630', // Jefferson Park
    notes: 'Test customer - Jefferson Park area. Georgian style, high-efficiency furnace.',
    tags: ['test', 'residential', 'hvac'],
  },
  {
    name: 'TEST - Elite Hardware Store',
    email: 'test.elitehardware@example.com',
    phone: '(773) 555-0108',
    address: '6543 N Northwest Hwy, Chicago, IL 60631', // Edison Park commercial
    notes: 'Test customer - COMMERCIAL. Hardware store, rooftop HVAC unit.',
    tags: ['test', 'commercial', 'hvac', 'rooftop'],
  },
  {
    name: 'TEST - Jennifer Walsh',
    email: 'test.jwalsh@example.com',
    phone: '(773) 555-0109',
    address: '11234 S Homan Ave, Chicago, IL 60655', // Mount Greenwood
    notes: 'Test customer - Mount Greenwood. Split ranch, heat pump system.',
    tags: ['test', 'residential', 'hvac', 'heat-pump'],
  },
  {
    name: 'TEST - St. Patrick Parish',
    email: 'test.stpatrick@example.com',
    phone: '(773) 555-0110',
    address: '9567 S Hoyne Ave, Chicago, IL 60643', // Beverly
    notes: 'Test customer - COMMERCIAL. Church and rectory, multiple HVAC units.',
    tags: ['test', 'commercial', 'hvac', 'multi-unit'],
  },
];

async function seedTestCustomers() {
  console.log('🌱 Seeding test customers for Elite Climate Control...\n');

  // Verify provider exists
  const provider = await prisma.provider.findUnique({
    where: { id: PROVIDER_ID },
    select: { id: true, businessName: true },
  });

  if (!provider) {
    console.error(`❌ Provider not found with ID: ${PROVIDER_ID}`);
    console.log('Please set SEED_PROVIDER_ID environment variable or update the script.');
    process.exit(1);
  }

  console.log(`✅ Found provider: ${provider.businessName}\n`);
  console.log('📋 Creating test customers...\n');

  let created = 0;
  let skipped = 0;

  for (const customer of testCustomers) {
    // Check if customer already exists (by email or name+address)
    const existing = await prisma.customer.findFirst({
      where: {
        providerId: PROVIDER_ID,
        OR: [
          { email: customer.email },
          { AND: [{ name: customer.name }, { address: customer.address }] },
        ],
      },
    });

    if (existing) {
      console.log(`⏭️  Skipped (exists): ${customer.name}`);
      skipped++;
      continue;
    }

    await prisma.customer.create({
      data: {
        providerId: PROVIDER_ID,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        notes: customer.notes,
        tags: customer.tags,
        source: 'test-seed',
      },
    });

    console.log(`✅ Created: ${customer.name}`);
    created++;
  }

  console.log('\n════════════════════════════════════════════');
  console.log('📊 SUMMARY');
  console.log('════════════════════════════════════════════');
  console.log(`   Provider: ${provider.businessName}`);
  console.log(`   Created: ${created} customers`);
  console.log(`   Skipped: ${skipped} customers (already exist)`);
  console.log(`   Total test customers: ${testCustomers.length}`);
  console.log('════════════════════════════════════════════\n');

  // List all test customers
  const allTestCustomers = await prisma.customer.findMany({
    where: {
      providerId: PROVIDER_ID,
      tags: { has: 'test' },
    },
    select: {
      id: true,
      name: true,
      address: true,
      phone: true,
    },
    orderBy: { name: 'asc' },
  });

  console.log('📋 All test customers in database:\n');
  console.log('ID | Name | Phone | Address');
  console.log('─'.repeat(80));
  for (const c of allTestCustomers) {
    console.log(`${c.id.substring(0, 8)}... | ${c.name.padEnd(30)} | ${c.phone} | ${c.address.substring(0, 30)}...`);
  }

  console.log('\n✨ Done! Test customers are ready for job assignments.\n');
}

seedTestCustomers()
  .catch((e) => {
    console.error('Error seeding test customers:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
