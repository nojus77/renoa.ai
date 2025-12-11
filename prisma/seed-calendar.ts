import { PrismaClient } from '@prisma/client'
import { addDays, addHours, setHours, startOfWeek } from 'date-fns'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding calendar test data...')

  // Get the provider (assumes you have one)
  const provider = await prisma.provider.findFirst()

  if (!provider) {
    console.error('❌ No provider found. Create a provider first.')
    return
  }

  console.log(`✅ Using provider: ${provider.businessName}`)

  // ═══════════════════════════════════════════════════════════════
  // STEP 1: Create Test Customers
  // ═══════════════════════════════════════════════════════════════

  const customerData = [
    { name: 'Smith Residence', phone: '555-0101', address: '123 Oak Street, Chicago, IL' },
    { name: 'Johnson Family', phone: '555-0102', address: '456 Maple Ave, Chicago, IL' },
    { name: 'Williams Property', phone: '555-0103', address: '789 Pine Road, Chicago, IL' },
    { name: 'Brown Estate', phone: '555-0104', address: '321 Elm Drive, Chicago, IL' },
    { name: 'Jones Home', phone: '555-0105', address: '654 Cedar Lane, Chicago, IL' },
    { name: 'Garcia Residence', phone: '555-0106', address: '987 Birch Court, Chicago, IL' },
    { name: 'Miller Family', phone: '555-0107', address: '147 Willow Street, Chicago, IL' },
    { name: 'Davis Property', phone: '555-0108', address: '258 Spruce Ave, Chicago, IL' },
    { name: 'Rodriguez Home', phone: '555-0109', address: '369 Ash Road, Chicago, IL' },
    { name: 'Martinez Estate', phone: '555-0110', address: '741 Poplar Drive, Chicago, IL' },
    { name: 'Hernandez Residence', phone: '555-0111', address: '852 Cherry Lane, Chicago, IL' },
    { name: 'Lopez Family', phone: '555-0112', address: '963 Walnut Court, Chicago, IL' },
    { name: 'Wilson Property', phone: '555-0113', address: '159 Hickory Street, Chicago, IL' },
    { name: 'Anderson Home', phone: '555-0114', address: '267 Sycamore Ave, Chicago, IL' },
    { name: 'Thomas Estate', phone: '555-0115', address: '378 Chestnut Road, Chicago, IL' },
  ]

  console.log('📋 Creating test customers...')
  const customers = await Promise.all(
    customerData.map(data =>
      prisma.customer.create({
        data: {
          providerId: provider.id,
          name: data.name,
          phone: data.phone,
          address: data.address,
          email: `${data.name.split(' ')[0].toLowerCase()}@email.com`,
          source: 'seed',
        }
      })
    )
  )
  console.log(`✅ Created ${customers.length} customers`)

  // ═══════════════════════════════════════════════════════════════
  // STEP 2: Get Team Members
  // ═══════════════════════════════════════════════════════════════

  const workers = await prisma.providerUser.findMany({
    where: {
      providerId: provider.id,
      status: 'active'
    }
  })

  if (workers.length === 0) {
    console.error('❌ No active workers found. Create team members first.')
    return
  }

  console.log(`✅ Found ${workers.length} active workers`)

  // ═══════════════════════════════════════════════════════════════
  // STEP 3: Create Realistic Jobs
  // ═══════════════════════════════════════════════════════════════

  const serviceTypes = [
    { type: 'Lawn Mowing', duration: 1.5, value: 75 },
    { type: 'Landscaping Install', duration: 6, value: 800 },
    { type: 'Tree Trimming', duration: 3, value: 350 },
    { type: 'Mulching', duration: 2, value: 200 },
    { type: 'Lawn Fertilization', duration: 1, value: 100 },
    { type: 'Irrigation Repair', duration: 2.5, value: 250 },
    { type: 'Hedge Trimming', duration: 2, value: 150 },
    { type: 'Leaf Removal', duration: 2, value: 125 },
    { type: 'Garden Cleanup', duration: 3, value: 225 },
    { type: 'Aeration', duration: 1.5, value: 125 },
    { type: 'Seeding', duration: 2, value: 175 },
    { type: 'Hardscaping', duration: 8, value: 1200 },
  ]

  // Get this week's date range
  const today = new Date()
  const weekStart = startOfWeek(today, { weekStartsOn: 1 }) // Monday

  console.log('📅 Creating jobs for this week and next week...')

  const jobs: Array<{
    providerId: string
    customerId: string
    serviceType: string
    address: string
    startTime: Date
    endTime: Date
    status: string
    estimatedValue: number
    source: string
    assignedUserIds: string[]
    internalNotes: string
  }> = []

  // Generate jobs across this week and next week (14 days)
  for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
    const currentDay = addDays(weekStart, dayOffset)
    const dayOfWeek = currentDay.getDay()

    // Skip Sunday (day 0)
    if (dayOfWeek === 0) continue

    // Fewer jobs on Saturday
    const isSaturday = dayOfWeek === 6

    // Number of jobs per day (more on mid-week)
    let jobsPerDay: number
    if (isSaturday) {
      jobsPerDay = 4
    } else if (dayOfWeek === 2 || dayOfWeek === 3 || dayOfWeek === 4) {
      // Tue, Wed, Thu - busy days
      jobsPerDay = 12
    } else {
      // Mon, Fri - moderate
      jobsPerDay = 8
    }

    for (let jobNum = 0; jobNum < jobsPerDay; jobNum++) {
      // Random service type
      const service = serviceTypes[Math.floor(Math.random() * serviceTypes.length)]

      // Random customer
      const customer = customers[Math.floor(Math.random() * customers.length)]

      // Random start time between 7 AM and 5 PM
      const startHour = 7 + Math.floor(Math.random() * 10)
      const startMinutes = [0, 15, 30, 45][Math.floor(Math.random() * 4)]
      const startTime = setHours(new Date(currentDay), startHour)
      startTime.setMinutes(startMinutes)
      startTime.setSeconds(0)
      startTime.setMilliseconds(0)

      const endTime = addHours(startTime, service.duration)

      // Assign strategy:
      // 65% assigned to random workers
      // 20% assigned to first worker (to create overbook)
      // 15% unassigned

      const assignmentRoll = Math.random()
      let assignedUserIds: string[] = []

      if (assignmentRoll < 0.65) {
        // Assign to 1-2 workers based on job size
        const numWorkers = service.duration > 4 ? Math.min(2, workers.length) : 1
        const shuffled = [...workers].sort(() => Math.random() - 0.5)
        assignedUserIds = shuffled.slice(0, numWorkers).map(w => w.id)
      } else if (assignmentRoll < 0.85) {
        // Assign to first worker to create some overbook/conflicts
        assignedUserIds = [workers[0].id]
      }
      // else: leave unassigned (15%)

      jobs.push({
        providerId: provider.id,
        customerId: customer.id,
        serviceType: service.type,
        address: customer.address,
        startTime,
        endTime,
        status: 'scheduled',
        estimatedValue: service.value,
        source: 'seed',
        assignedUserIds,
        internalNotes: `Test job ${jobNum + 1} for ${customer.name}`,
      })
    }
  }

  console.log(`📝 Creating ${jobs.length} jobs...`)

  // Batch create jobs
  const createdJobs = await prisma.job.createMany({
    data: jobs
  })

  console.log(`✅ Created ${createdJobs.count} jobs`)

  // ═══════════════════════════════════════════════════════════════
  // STEP 4: Create Summary Stats
  // ═══════════════════════════════════════════════════════════════

  const assignedCount = jobs.filter(j => j.assignedUserIds.length > 0).length
  const unassignedCount = jobs.filter(j => j.assignedUserIds.length === 0).length

  console.log('\n📊 SEED SUMMARY:')
  console.log(`   Customers: ${customers.length}`)
  console.log(`   Workers: ${workers.length}`)
  console.log(`   Total Jobs: ${jobs.length}`)
  console.log(`   Assigned: ${assignedCount}`)
  console.log(`   Unassigned: ${unassignedCount}`)
  console.log(`   Week Range: ${weekStart.toLocaleDateString()} - ${addDays(weekStart, 13).toLocaleDateString()}`)
  console.log('\n✅ Calendar test data seeded successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
