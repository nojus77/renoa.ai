import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PROVIDER_ID = '25555c94-c1e0-40b9-af19-21a56c9e11bd'; // Premier Outdoor Solutions

async function addUniversalSkills() {
  console.log('Adding universal "Lawn Care" skill to all workers...\n');

  // Find or create "Lawn Care" skill
  let lawnCareSkill = await prisma.skill.findFirst({
    where: {
      providerId: PROVIDER_ID,
      name: 'Lawn Care'
    }
  });

  if (!lawnCareSkill) {
    lawnCareSkill = await prisma.skill.create({
      data: {
        providerId: PROVIDER_ID,
        name: 'Lawn Care',
        category: 'lawn_care'
      }
    });
    console.log('✅ Created "Lawn Care" skill\n');
  } else {
    console.log(`✅ Found existing "Lawn Care" skill (${lawnCareSkill.id})\n`);
  }

  // Get all field workers
  const workers = await prisma.providerUser.findMany({
    where: {
      providerId: PROVIDER_ID,
      role: 'field',
      status: 'active'
    },
    include: {
      workerSkills: {
        include: { skill: true }
      }
    }
  });

  console.log(`Found ${workers.length} active field workers\n`);

  let added = 0;
  let skipped = 0;

  for (const worker of workers) {
    // Check if already has Lawn Care or similar
    const hasLawnCare = worker.workerSkills.some(ws =>
      ws.skill.name.toLowerCase().includes('lawn care') ||
      ws.skill.name.toLowerCase() === 'lawn' ||
      ws.skill.name.toLowerCase() === 'lawn mowing'
    );

    if (hasLawnCare) {
      console.log(`✓ ${worker.firstName} ${worker.lastName} - already has lawn care skill`);
      skipped++;
      continue;
    }

    // Check if this exact skill is already assigned
    const hasExactSkill = worker.workerSkills.some(ws => ws.skillId === lawnCareSkill!.id);

    if (hasExactSkill) {
      console.log(`✓ ${worker.firstName} ${worker.lastName} - already has this exact skill`);
      skipped++;
      continue;
    }

    // Add Lawn Care skill
    await prisma.providerUserSkill.create({
      data: {
        userId: worker.id,
        skillId: lawnCareSkill.id,
        level: 'intermediate'
      }
    });

    added++;
    console.log(`✅ ${worker.firstName} ${worker.lastName} - added Lawn Care skill`);
  }

  console.log(`\n═══════════════════════════════════════════════════════`);
  console.log(`✅ Done!`);
  console.log(`   Added Lawn Care to ${added} workers`);
  console.log(`   Skipped ${skipped} workers (already had lawn care skill)`);
  console.log(`   Total workers processed: ${workers.length}`);
  console.log(`═══════════════════════════════════════════════════════\n`);
}

addUniversalSkills()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
