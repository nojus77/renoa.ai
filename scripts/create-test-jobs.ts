import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const PROVIDER_ID = '25555c94-c1e0-40b9-af19-21a56c9e11bd'

async function createTestJobs() {
  // Get a customer
  const customer = await prisma.customer.findFirst({
    where: { providerId: PROVIDER_ID }
  })

  if (!customer) {
    console.log('❌ No customer found')
    return
  }

  // Dec 12, 2025 is a Friday
  // Chicago is UTC-6 in winter
  // 9am Chicago = 15:00 UTC, 10am = 16:00 UTC, etc.

  const jobTypes = [
    'Lawn Mowing',
    'Lawn Edging',
    'Leaf Removal',
    'Mulching',
    'Planting',
    'Tree Trimming',
    'Hedge Trimming',
    'Spring Cleanup',
    'Landscaping',
    'Aeration'
  ]

  const addresses = [
    { address: '123 Main St, Chicago, IL 60601', lat: 41.8781, lng: -87.6298 },
    { address: '456 Oak Ave, Chicago, IL 60602', lat: 41.8831, lng: -87.6324 },
    { address: '789 Pine St, Chicago, IL 60603', lat: 41.8791, lng: -87.6271 },
    { address: '321 Elm Rd, Chicago, IL 60604', lat: 41.8811, lng: -87.6310 },
    { address: '654 Maple Dr, Chicago, IL 60605', lat: 41.8751, lng: -87.6285 },
    { address: '987 Cedar Ln, Chicago, IL 60606', lat: 41.8821, lng: -87.6340 },
    { address: '147 Birch Way, Chicago, IL 60607', lat: 41.8771, lng: -87.6260 },
    { address: '258 Walnut St, Chicago, IL 60608', lat: 41.8801, lng: -87.6315 },
    { address: '369 Cherry Ave, Chicago, IL 60609', lat: 41.8761, lng: -87.6275 },
    { address: '741 Spruce Rd, Chicago, IL 60610', lat: 41.8841, lng: -87.6350 }
  ]

  console.log('Creating 10 test jobs...\n')

  for (let i = 0; i < 10; i++) {
    const startHour = 9 + i  // 9am, 10am, 11am... 6pm
    const duration = 60  // 1 hour each

    // Create UTC time: 9am Chicago = 15:00 UTC (9 + 6)
    const startTime = new Date(`2025-12-12T${String(startHour + 6).padStart(2, '0')}:00:00.000Z`)
    const endTime = new Date(startTime)
    endTime.setMinutes(endTime.getMinutes() + duration)

    const job = await prisma.job.create({
      data: {
        providerId: PROVIDER_ID,
        customerId: customer.id,
        serviceType: jobTypes[i],
        status: 'scheduled',
        estimatedValue: 100 + (i * 25),
        address: addresses[i].address,
        latitude: addresses[i].lat,
        longitude: addresses[i].lng,
        startTime: startTime,
        endTime: endTime,
        crewSizeRequired: 1,
        jobPriority: 5,  // Normal priority (1-10 scale)
        jobCategory: 'maintenance'
      }
    })

    console.log(`✅ ${job.serviceType} at ${startHour}:00 AM Chicago (${startTime.toISOString()})`)
  }

  console.log('\n✅ Created 10 test jobs for Dec 12, 2025!')
}

createTestJobs()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
