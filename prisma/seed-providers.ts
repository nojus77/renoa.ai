import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const fakeProviders = [
  {
    businessName: "Green Thumb Landscaping",
    ownerName: "Mike Johnson",
    email: "mike@greenthumb.com",
    phone: "(312) 555-0101",
    serviceTypes: ["Landscaping", "Lawn Care"],
    serviceAreas: ["Lincoln Park", "Lakeview", "Wicker Park"],
    yearsInBusiness: 12,
    status: "active",
    leadCapacity: 20,
    currentLeadCount: 15,
    rating: 4.8,
    totalLeadsSent: 450,
    leadsAccepted: 380,
    leadsConverted: 290,
    totalRevenue: 145000,
    commissionRate: 0.15,
    averageJobValue: 500,
  },
  {
    businessName: "Windy City Roofing Co",
    ownerName: "Sarah Martinez",
    email: "sarah@windycityroofing.com",
    phone: "(773) 555-0202",
    serviceTypes: ["Roofing", "Gutters"],
    serviceAreas: ["Loop", "West Loop", "River North"],
    yearsInBusiness: 8,
    status: "active",
    leadCapacity: 15,
    currentLeadCount: 8,
    rating: 4.9,
    totalLeadsSent: 320,
    leadsAccepted: 300,
    leadsConverted: 245,
    totalRevenue: 980000,
    commissionRate: 0.20,
    averageJobValue: 4000,
  },
  {
    businessName: "Chicago HVAC Pros",
    ownerName: "David Chen",
    email: "david@chicagohvac.com",
    phone: "(312) 555-0303",
    serviceTypes: ["HVAC", "Furnace Repair"],
    serviceAreas: ["Gold Coast", "Old Town", "Lincoln Square"],
    yearsInBusiness: 15,
    status: "active",
    leadCapacity: 25,
    currentLeadCount: 22,
    rating: 4.7,
    totalLeadsSent: 680,
    leadsAccepted: 650,
    leadsConverted: 520,
    totalRevenue: 780000,
    commissionRate: 0.18,
    averageJobValue: 1500,
  },
  {
    businessName: "Perfect Lawn Services",
    ownerName: "James Wilson",
    email: "james@perfectlawn.com",
    phone: "(773) 555-0404",
    serviceTypes: ["Landscaping", "Snow Removal"],
    serviceAreas: ["Hyde Park", "Bronzeville", "Kenwood"],
    yearsInBusiness: 5,
    status: "paused",
    leadCapacity: 10,
    currentLeadCount: 10,
    rating: 4.3,
    totalLeadsSent: 180,
    leadsAccepted: 150,
    leadsConverted: 95,
    totalRevenue: 47500,
    commissionRate: 0.15,
    averageJobValue: 500,
  },
  {
    businessName: "Top Tier Roofing",
    ownerName: "Emily Rodriguez",
    email: "emily@toptierroofing.com",
    phone: "(312) 555-0505",
    serviceTypes: ["Roofing", "Siding"],
    serviceAreas: ["Pilsen", "Little Italy", "Chinatown"],
    yearsInBusiness: 20,
    status: "active",
    leadCapacity: 30,
    currentLeadCount: 18,
    rating: 5.0,
    totalLeadsSent: 890,
    leadsAccepted: 850,
    leadsConverted: 720,
    totalRevenue: 2880000,
    commissionRate: 0.22,
    averageJobValue: 4000,
  },
  {
    businessName: "Precision Plumbing Chicago",
    ownerName: "Robert Taylor",
    email: "rob@precisionplumbing.com",
    phone: "(773) 555-0606",
    serviceTypes: ["Plumbing", "Water Heaters"],
    serviceAreas: ["Andersonville", "Edgewater", "Rogers Park"],
    yearsInBusiness: 10,
    status: "active",
    leadCapacity: 18,
    currentLeadCount: 12,
    rating: 4.6,
    totalLeadsSent: 420,
    leadsAccepted: 380,
    leadsConverted: 310,
    totalRevenue: 310000,
    commissionRate: 0.17,
    averageJobValue: 1000,
  },
];

async function seedProviders() {
  console.log('Seeding providers...');
  
  for (const provider of fakeProviders) {
    await prisma.provider.create({
      data: provider,
    });
  }
  
  console.log('✅ Providers seeded successfully!');
}

seedProviders()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
  