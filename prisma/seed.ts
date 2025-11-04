import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// All Chicago zip codes
const CHICAGO_ZIPS = [
  '60601', '60602', '60603', '60604', '60605', '60606', '60607', '60608', '60609', '60610',
  '60611', '60612', '60613', '60614', '60615', '60616', '60617', '60618', '60619', '60620',
  '60621', '60622', '60623', '60624', '60625', '60626', '60628', '60629', '60630', '60631',
  '60632', '60633', '60634', '60636', '60637', '60638', '60639', '60640', '60641', '60642',
  '60643', '60644', '60645', '60646', '60647', '60649', '60651', '60652', '60653', '60654',
  '60655', '60656', '60657', '60659', '60660', '60661', '60664', '60666', '60668', '60669',
  '60670', '60673', '60674', '60675', '60677', '60678', '60680', '60681', '60682', '60684',
  '60685', '60686', '60687', '60688', '60689', '60690', '60691', '60693', '60694', '60695',
  '60696', '60697', '60699', '60701'
];

async function main() {
  console.log('🌱 Starting seed...');

  // Clear existing data
  console.log('🗑️  Clearing existing data...');
  await prisma.leadNote.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.provider.deleteMany();

  // Create providers - ALL cover ALL Chicago zips
  console.log('👥 Creating providers...');
  
  const provider1 = await prisma.provider.create({
    data: {
      businessName: 'Elite Landscaping Co',
      ownerName: 'John Smith',
      email: 'john@elitelandscaping.com',
      phone: '312-555-0100',
      serviceTypes: ['landscaping', 'lawn_care', 'hardscaping'],
      serviceAreas: CHICAGO_ZIPS,  // ✅ ALL CHICAGO ZIPS
      yearsInBusiness: 15,
      status: 'active',
      leadCapacity: 20,
      currentLeadCount: 3,
      rating: 4.8,
      totalLeadsSent: 150,
      leadsAccepted: 120,
      leadsConverted: 95,
      totalRevenue: 475000,
      commissionRate: 0.15,
      averageJobValue: 5000,
      workingHours: {
        monday: [{ start: '08:00', end: '18:00' }],
        tuesday: [{ start: '08:00', end: '18:00' }],
        wednesday: [{ start: '08:00', end: '18:00' }],
        thursday: [{ start: '08:00', end: '18:00' }],
        friday: [{ start: '08:00', end: '18:00' }],
        saturday: [{ start: '09:00', end: '15:00' }],
        sunday: [],
      },
    },
  });

  const provider2 = await prisma.provider.create({
    data: {
      businessName: 'Green Thumb Gardens',
      ownerName: 'Sarah Johnson',
      email: 'sarah@greenthumb.com',
      phone: '312-555-0101',
      serviceTypes: ['landscaping', 'lawn_care'],
      serviceAreas: CHICAGO_ZIPS,  // ✅ ALL CHICAGO ZIPS
      yearsInBusiness: 8,
      status: 'active',
      leadCapacity: 15,
      currentLeadCount: 2,
      rating: 4.6,
      totalLeadsSent: 80,
      leadsAccepted: 65,
      leadsConverted: 52,
      totalRevenue: 260000,
      commissionRate: 0.15,
      averageJobValue: 5000,
      workingHours: {
        monday: [{ start: '09:00', end: '17:00' }],
        tuesday: [{ start: '09:00', end: '17:00' }],
        wednesday: [{ start: '09:00', end: '17:00' }],
        thursday: [{ start: '09:00', end: '17:00' }],
        friday: [{ start: '09:00', end: '17:00' }],
        saturday: [],
        sunday: [],
      },
    },
  });

  const provider3 = await prisma.provider.create({
    data: {
      businessName: 'Premium Tree Service',
      ownerName: 'Mike Davis',
      email: 'mike@premiumtree.com',
      phone: '312-555-0102',
      serviceTypes: ['landscaping', 'lawn_care', 'hardscaping'],
      serviceAreas: CHICAGO_ZIPS,  // ✅ ALL CHICAGO ZIPS
      yearsInBusiness: 12,
      status: 'active',
      leadCapacity: 10,
      currentLeadCount: 1,
      rating: 4.9,
      totalLeadsSent: 120,
      leadsAccepted: 110,
      leadsConverted: 98,
      totalRevenue: 490000,
      commissionRate: 0.15,
      averageJobValue: 5000,
      workingHours: {
        monday: [{ start: '07:00', end: '17:00' }],
        tuesday: [{ start: '07:00', end: '17:00' }],
        wednesday: [{ start: '07:00', end: '17:00' }],
        thursday: [{ start: '07:00', end: '17:00' }],
        friday: [{ start: '07:00', end: '17:00' }],
        saturday: [{ start: '08:00', end: '14:00' }],
        sunday: [],
      },
    },
  });

  console.log('✅ Providers created with ALL Chicago zip codes');

  // Create leads
  console.log('📋 Creating leads...');

  const lead1 = await prisma.lead.create({
    data: {
      firstName: 'Emily',
      lastName: 'Rodriguez',
      email: 'emily.r@email.com',
      phone: '555-1001',
      address: '123 Oak Street',
      city: 'Chicago',
      state: 'IL',
      zip: '60601',
      propertyType: 'single_family',
      propertyValue: 425000,
      serviceInterest: 'landscaping',
      leadSource: 'website',
      leadScore: 85,
      tier: 1,
      urgencyScore: 90,
      propertyScore: 85,
      financialScore: 80,
      status: 'accepted',
      assignedProviderId: provider1.id,
      customerPreferredDate: new Date('2025-11-15T10:00:00Z'),
      schedulingStatus: 'confirmed',
      providerProposedDate: new Date('2025-11-15T10:00:00Z'),
      notes: 'Need complete backyard renovation',
    },
  });

  const lead2 = await prisma.lead.create({
    data: {
      firstName: 'David',
      lastName: 'Chen',
      email: 'david.chen@email.com',
      phone: '555-1002',
      address: '456 Maple Avenue',
      city: 'Chicago',
      state: 'IL',
      zip: '60602',
      propertyType: 'single_family',
      propertyValue: 380000,
      serviceInterest: 'landscaping',
      leadSource: 'referral',
      leadScore: 72,
      tier: 2,
      urgencyScore: 70,
      propertyScore: 75,
      financialScore: 70,
      status: 'converted',
      assignedProviderId: provider1.id,
      contractValue: 8500,
      notes: 'Front yard landscaping update',
    },
  });

  const lead3 = await prisma.lead.create({
    data: {
      firstName: 'Jennifer',
      lastName: 'Williams',
      email: 'jennifer.w@email.com',
      phone: '555-1003',
      address: '789 Pine Road',
      city: 'Chicago',
      state: 'IL',
      zip: '60603',
      propertyType: 'single_family',
      propertyValue: 520000,
      serviceInterest: 'landscaping',
      leadSource: 'google_ads',
      leadScore: 68,
      tier: 2,
      urgencyScore: 65,
      propertyScore: 80,
      financialScore: 75,
      status: 'accepted',
      assignedProviderId: provider1.id,
      customerPreferredDate: new Date('2025-11-20T14:00:00Z'),
      notes: 'Garden maintenance and design',
    },
  });

  const lead4 = await prisma.lead.create({
    data: {
      firstName: 'Amanda',
      lastName: 'Martinez',
      email: 'amanda.m@email.com',
      phone: '555-1004',
      address: '321 Elm Drive',
      city: 'Chicago',
      state: 'IL',
      zip: '60605',
      propertyType: 'single_family',
      propertyValue: 395000,
      serviceInterest: 'landscaping',
      leadSource: 'facebook_ads',
      leadScore: 78,
      tier: 2,
      urgencyScore: 80,
      propertyScore: 75,
      financialScore: 78,
      status: 'matched',
      assignedProviderId: provider2.id,
      notes: 'Spring cleanup and mulching',
    },
  });

  const lead5 = await prisma.lead.create({
    data: {
      firstName: 'Robert',
      lastName: 'Taylor',
      email: 'robert.t@email.com',
      phone: '555-1005',
      address: '654 Birch Lane',
      city: 'Chicago',
      state: 'IL',
      zip: '60607',
      propertyType: 'single_family',
      propertyValue: 445000,
      serviceInterest: 'landscaping',
      leadSource: 'website',
      leadScore: 92,
      tier: 1,
      urgencyScore: 95,
      propertyScore: 90,
      financialScore: 90,
      status: 'new',
      notes: 'Large tree removal needed',
    },
  });

  console.log('✅ Leads created');

  console.log('🎉 Seed completed successfully!');
  console.log('📊 Summary:');
  console.log('  - Providers: 3 (all covering ALL Chicago zips)');
  console.log('  - Leads: 5');
  console.log(`  - Total zip codes per provider: ${CHICAGO_ZIPS.length}`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });