import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const PROVIDER_ID = '25555c94-c1e0-40b9-af19-21a56c9e11bd'

async function cleanup() {
  // Delete ALL jobs before Dec 12
  const deleted = await prisma.job.deleteMany({
    where: {
      providerId: PROVIDER_ID,
      startTime: { lt: new Date('2025-12-12') }
    }
  })

  console.log(`✅ Deleted ${deleted.count} old jobs`)

  // Show remaining jobs
  const remaining = await prisma.job.findMany({
    where: { providerId: PROVIDER_ID },
    select: {
      serviceType: true,
      startTime: true,
      endTime: true,
      status: true,
      assignedUserIds: true
    },
    orderBy: { startTime: 'asc' }
  })

  console.log(`\n📋 Remaining ${remaining.length} jobs:`)
  remaining.forEach(j => {
    const start = new Date(j.startTime)
    const assigned = j.assignedUserIds?.length || 0
    console.log(`   ${j.serviceType}: ${start.toISOString()} - ${j.status} - ${assigned > 0 ? 'Assigned' : 'Unassigned'}`)
  })
}

cleanup()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
