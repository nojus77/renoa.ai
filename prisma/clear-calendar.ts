import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🗑️  Clearing calendar test data...')

  // Delete all jobs that were seeded
  const jobs = await prisma.job.deleteMany({
    where: {
      source: 'seed'
    }
  })
  console.log(`✅ Deleted ${jobs.count} seeded jobs`)

  // Delete all customers that were seeded
  const customers = await prisma.customer.deleteMany({
    where: {
      source: 'seed'
    }
  })
  console.log(`✅ Deleted ${customers.count} seeded customers`)

  console.log('\n✅ Calendar test data cleared!')
}

main()
  .catch((e) => {
    console.error('❌ Clear failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
