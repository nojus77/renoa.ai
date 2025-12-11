import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const PROVIDER_ID = '25555c94-c1e0-40b9-af19-21a56c9e11bd' // Premier Outdoor Solutions

const testWorkers = [
  {
    firstName: 'Carlos',
    lastName: 'Rodriguez',
    email: 'carlos@test.com',
    skills: ['Lawn Mowing', 'Edging & Trimming', 'Zero-Turn Mower', 'Spanish Speaking'],
    color: '#10b981'
  },
  {
    firstName: 'James',
    lastName: 'Wilson',
    email: 'james@test.com',
    skills: ['Tree Trimming', 'Tree Removal', 'Chainsaw', 'ISA Certified Arborist'],
    color: '#3b82f6'
  },
  {
    firstName: 'Maria',
    lastName: 'Santos',
    email: 'maria@test.com',
    skills: ['Garden Bed Maintenance', 'Planting (Flowers)', 'Planting (Shrubs)', 'Mulching'],
    color: '#ec4899'
  },
  {
    firstName: 'David',
    lastName: 'Chen',
    email: 'david.chen@test.com',
    skills: ['Paver Installation', 'Retaining Wall (Block)', 'Concrete Work', 'Skid Steer'],
    color: '#f59e0b'
  },
  {
    firstName: 'Marcus',
    lastName: 'Johnson',
    email: 'marcus@test.com',
    skills: ['Sprinkler Installation', 'Sprinkler Repair', 'Drip Irrigation', 'Backflow Testing'],
    color: '#06b6d4'
  },
  {
    firstName: 'Emily',
    lastName: 'Brown',
    email: 'emily@test.com',
    skills: ['Lawn Mowing', 'Leaf Removal', 'Spring Cleanup', 'Fall Cleanup'],
    color: '#8b5cf6'
  },
  {
    firstName: 'Roberto',
    lastName: 'Mendez',
    email: 'roberto@test.com',
    skills: ['Tree Trimming', 'Stump Grinding', 'Wood Chipper', 'CDL License (Class B)'],
    color: '#ef4444'
  },
  {
    firstName: 'Kevin',
    lastName: 'O\'Brien',
    email: 'kevin@test.com',
    skills: ['Fertilization', 'Weed Control', 'Pesticide Applicator License', 'Spray Equipment'],
    color: '#84cc16'
  },
  {
    firstName: 'Ana',
    lastName: 'Garcia',
    email: 'ana@test.com',
    skills: ['Hedge Trimming', 'Bush/Shrub Pruning', 'Pruning', 'Hedge Trimmer'],
    color: '#f97316'
  },
  {
    firstName: 'Tyler',
    lastName: 'Smith',
    email: 'tyler@test.com',
    skills: ['Snow Plowing', 'Salt/Ice Melt Application', 'Dump Truck', 'Skid Steer'],
    color: '#64748b'
  },
  {
    firstName: 'Jessica',
    lastName: 'Lee',
    email: 'jessica@test.com',
    skills: ['Landscape Design', 'Planting (Trees)', 'Irrigation System Design', 'Customer Communication'],
    color: '#a855f7'
  },
  {
    firstName: 'Miguel',
    lastName: 'Hernandez',
    email: 'miguel@test.com',
    skills: ['Lawn Mowing', 'Aeration', 'Dethatching', 'Aerator Machine', 'Spanish Speaking'],
    color: '#14b8a6'
  },
  {
    firstName: 'Brandon',
    lastName: 'Taylor',
    email: 'brandon@test.com',
    skills: ['Tree Removal', 'Emergency Tree Service', 'Crane Operation', 'Bucket Truck', 'OSHA 30 Training'],
    color: '#dc2626'
  },
  {
    firstName: 'Sarah',
    lastName: 'Martinez',
    email: 'sarah@test.com',
    skills: ['Sod Installation', 'Seeding & Overseeding', 'Grading & Leveling', 'Crew Leader', 'First Aid/CPR'],
    color: '#0891b2'
  }
]

async function seedTestWorkers() {
  console.log('Seeding 14 test workers for Premier Outdoor Solutions...\n')

  const passwordHash = await bcrypt.hash('testpass123', 10)

  let created = 0
  let skipped = 0

  for (const worker of testWorkers) {
    // Check if worker already exists
    const existing = await prisma.providerUser.findFirst({
      where: { email: worker.email, providerId: PROVIDER_ID }
    })

    if (existing) {
      console.log(`⏭️  Skipping ${worker.firstName} ${worker.lastName} - already exists`)
      skipped++
      continue
    }

    // Create the worker
    const newWorker = await prisma.providerUser.create({
      data: {
        firstName: worker.firstName,
        lastName: worker.lastName,
        email: worker.email,
        passwordHash,
        role: 'field',
        status: 'active',
        color: worker.color,
        hourlyRate: 18 + Math.floor(Math.random() * 12), // $18-30/hr
        providerId: PROVIDER_ID
      }
    })

    console.log(`✅ Created: ${worker.firstName} ${worker.lastName}`)
    created++

    // Add skills
    let skillsAdded = 0
    for (const skillName of worker.skills) {
      const skill = await prisma.skill.findFirst({
        where: {
          name: skillName,
          providerId: PROVIDER_ID
        }
      })

      if (skill) {
        await prisma.providerUserSkill.create({
          data: {
            userId: newWorker.id,
            skillId: skill.id,
            level: Math.random() > 0.7 ? 'expert' : Math.random() > 0.4 ? 'intermediate' : 'basic'
          }
        })
        skillsAdded++
      } else {
        console.log(`   ⚠️  Skill not found: ${skillName}`)
      }
    }
    console.log(`   → Added ${skillsAdded}/${worker.skills.length} skills`)
  }

  console.log('\n════════════════════════════════════')
  console.log(`✅ Created: ${created} workers`)
  console.log(`⏭️  Skipped: ${skipped} workers (already existed)`)
  console.log('════════════════════════════════════')
  console.log('\nPassword for all test workers: testpass123')
}

seedTestWorkers()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
