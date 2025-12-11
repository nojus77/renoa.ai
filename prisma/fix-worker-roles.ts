import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixWorkerRoles() {
  const PROVIDER_ID = '25555c94-c1e0-40b9-af19-21a56c9e11bd'

  console.log('Fixing worker roles for Premier Outdoor Solutions...\n')

  // Update all test workers to have role='field'
  const result = await prisma.providerUser.updateMany({
    where: {
      providerId: PROVIDER_ID,
      email: { endsWith: '@test.com' },
      role: { not: 'field' }
    },
    data: {
      role: 'field'
    }
  })

  console.log(`✅ Updated ${result.count} test workers to role='field'`)

  // Also fix any that might have 'field_worker'
  const result2 = await prisma.providerUser.updateMany({
    where: {
      providerId: PROVIDER_ID,
      role: 'field_worker'
    },
    data: {
      role: 'field'
    }
  })

  console.log(`✅ Fixed ${result2.count} workers with 'field_worker' role`)

  // Verify
  const workers = await prisma.providerUser.findMany({
    where: { providerId: PROVIDER_ID },
    select: { firstName: true, lastName: true, role: true, email: true },
    orderBy: { createdAt: 'asc' }
  })

  console.log('\n════════════════════════════════════')
  console.log('Current workers:')
  console.log('════════════════════════════════════')
  workers.forEach(w => {
    const roleLabel = w.role === 'field' ? '👷 Field Worker' :
                      w.role === 'office' ? '📋 Office' :
                      w.role === 'owner' ? '👑 Owner' : `❓ ${w.role}`
    console.log(`  ${roleLabel.padEnd(18)} - ${w.firstName} ${w.lastName} (${w.email})`)
  })
  console.log('════════════════════════════════════')
}

fixWorkerRoles()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
