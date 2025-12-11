import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const providerId = '25555c94-c1e0-40b9-af19-21a56c9e11bd';

  // Find or create the "Planting (Shrubs)" skill
  let skill = await prisma.skill.findFirst({
    where: { name: 'Planting (Shrubs)' }
  });

  if (!skill) {
    skill = await prisma.skill.create({
      data: {
        name: 'Planting (Shrubs)',
        category: 'Landscaping',
        description: 'Ability to plant and care for shrubs'
      }
    });
    console.log('✅ Created skill: Planting (Shrubs)');
  } else {
    console.log('✅ Skill already exists: Planting (Shrubs)');
  }

  // Get all field workers for this provider
  const workers = await prisma.providerUser.findMany({
    where: {
      providerId,
      role: 'field',
      status: 'active'
    }
  });

  console.log(`Found ${workers.length} field workers`);

  // Add the skill to all workers
  let added = 0;
  for (const worker of workers) {
    // Check if worker already has this skill
    const existing = await prisma.providerUserSkill.findFirst({
      where: {
        userId: worker.id,
        skillId: skill.id
      }
    });

    if (!existing) {
      await prisma.providerUserSkill.create({
        data: {
          userId: worker.id,
          skillId: skill.id,
          level: 'intermediate'
        }
      });
      added++;
      console.log(`  ✅ Added skill to ${worker.firstName} ${worker.lastName}`);
    }
  }

  console.log(`\n✅ Added Planting (Shrubs) skill to ${added} workers`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
