import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Default skills to seed for landscape service providers
 * Organized by category for better management
 */
const DEFAULT_SKILLS = [
  // Landscaping Skills
  {
    name: 'Lawn Mowing',
    category: 'landscaping',
    description: 'Cutting and maintaining grass and lawn areas',
  },
  {
    name: 'Lawn Edging',
    category: 'landscaping',
    description: 'Creating clean borders between lawn and other areas',
  },
  {
    name: 'Trimming & Pruning',
    category: 'landscaping',
    description: 'Shaping and maintaining shrubs, hedges, and small plants',
  },
  {
    name: 'Mulching',
    category: 'landscaping',
    description: 'Applying and spreading mulch in garden beds',
  },
  {
    name: 'Leaf Removal',
    category: 'landscaping',
    description: 'Raking, blowing, and removing fallen leaves',
  },
  {
    name: 'Weeding',
    category: 'landscaping',
    description: 'Identifying and removing unwanted plants',
  },
  {
    name: 'Planting',
    category: 'landscaping',
    description: 'Installing flowers, shrubs, and small trees',
  },
  {
    name: 'Garden Bed Maintenance',
    category: 'landscaping',
    description: 'Maintaining and caring for flower and plant beds',
  },

  // Tree Work Skills
  {
    name: 'Tree Trimming',
    category: 'tree_work',
    description: 'Pruning and shaping trees under 20 feet',
  },
  {
    name: 'Tree Removal',
    category: 'tree_work',
    description: 'Safely removing trees and stumps',
  },
  {
    name: 'Tree Climbing',
    category: 'tree_work',
    description: 'Climbing trees for maintenance and removal',
  },
  {
    name: 'Chainsaw Operation',
    category: 'tree_work',
    description: 'Safe operation of chainsaws for cutting',
  },
  {
    name: 'Stump Grinding',
    category: 'tree_work',
    description: 'Operating stump grinder equipment',
  },

  // Hardscaping Skills
  {
    name: 'Paver Installation',
    category: 'hardscaping',
    description: 'Installing pavers for patios and walkways',
  },
  {
    name: 'Retaining Wall Construction',
    category: 'hardscaping',
    description: 'Building and repairing retaining walls',
  },
  {
    name: 'Concrete Work',
    category: 'hardscaping',
    description: 'Pouring and finishing concrete',
  },
  {
    name: 'Stone Work',
    category: 'hardscaping',
    description: 'Working with natural stone for landscaping',
  },
  {
    name: 'Grading & Drainage',
    category: 'hardscaping',
    description: 'Proper land grading and water management',
  },

  // Irrigation Skills
  {
    name: 'Irrigation Installation',
    category: 'irrigation',
    description: 'Installing sprinkler systems and drip lines',
  },
  {
    name: 'Irrigation Repair',
    category: 'irrigation',
    description: 'Troubleshooting and fixing irrigation systems',
  },
  {
    name: 'Irrigation Programming',
    category: 'irrigation',
    description: 'Programming and scheduling irrigation controllers',
  },

  // Equipment Operation
  {
    name: 'Zero-Turn Mower',
    category: 'equipment',
    description: 'Operating zero-turn radius mowers',
  },
  {
    name: 'Walk-Behind Mower',
    category: 'equipment',
    description: 'Operating commercial walk-behind mowers',
  },
  {
    name: 'Leaf Blower',
    category: 'equipment',
    description: 'Operating backpack and handheld blowers',
  },
  {
    name: 'String Trimmer',
    category: 'equipment',
    description: 'Operating string trimmers and edgers',
  },
  {
    name: 'Skid Steer',
    category: 'equipment',
    description: 'Operating skid steer loaders',
  },
  {
    name: 'Mini Excavator',
    category: 'equipment',
    description: 'Operating mini excavators for digging',
  },
  {
    name: 'Dump Truck',
    category: 'equipment',
    description: 'Operating dump trucks for material hauling',
  },
  {
    name: 'Trailer Towing',
    category: 'equipment',
    description: 'Safely towing landscape trailers',
  },

  // Certifications & Licenses
  {
    name: 'Pesticide Applicator License',
    category: 'certification',
    description: 'Licensed to apply pesticides and herbicides',
  },
  {
    name: 'ISA Certified Arborist',
    category: 'certification',
    description: 'Certified by International Society of Arboriculture',
  },
  {
    name: 'CDL License',
    category: 'certification',
    description: 'Commercial Drivers License for large vehicles',
  },
  {
    name: 'First Aid/CPR',
    category: 'certification',
    description: 'Current first aid and CPR certification',
  },
  {
    name: 'OSHA Safety Training',
    category: 'certification',
    description: 'OSHA 10 or 30-hour safety certification',
  },
];

/**
 * Default service type to skill requirements mapping
 * Defines which skills are required or preferred for each service type
 */
const SERVICE_SKILL_REQUIREMENTS = [
  // Lawn Maintenance
  { serviceType: 'lawn_mowing', skillName: 'Lawn Mowing', required: true },
  { serviceType: 'lawn_mowing', skillName: 'Lawn Edging', required: false },
  { serviceType: 'lawn_mowing', skillName: 'Zero-Turn Mower', required: false },
  { serviceType: 'lawn_mowing', skillName: 'Walk-Behind Mower', required: true },

  // Trimming & Pruning
  { serviceType: 'trimming_pruning', skillName: 'Trimming & Pruning', required: true },
  { serviceType: 'trimming_pruning', skillName: 'String Trimmer', required: true },

  // Mulching
  { serviceType: 'mulching', skillName: 'Mulching', required: true },
  { serviceType: 'mulching', skillName: 'Garden Bed Maintenance', required: false },

  // Leaf Removal
  { serviceType: 'leaf_removal', skillName: 'Leaf Removal', required: true },
  { serviceType: 'leaf_removal', skillName: 'Leaf Blower', required: true },

  // Planting
  { serviceType: 'planting', skillName: 'Planting', required: true },
  { serviceType: 'planting', skillName: 'Garden Bed Maintenance', required: false },

  // Tree Services
  { serviceType: 'tree_trimming', skillName: 'Tree Trimming', required: true },
  { serviceType: 'tree_trimming', skillName: 'Chainsaw Operation', required: true },
  { serviceType: 'tree_trimming', skillName: 'ISA Certified Arborist', required: false },

  { serviceType: 'tree_removal', skillName: 'Tree Removal', required: true },
  { serviceType: 'tree_removal', skillName: 'Chainsaw Operation', required: true },
  { serviceType: 'tree_removal', skillName: 'Tree Climbing', required: false },

  // Hardscaping
  { serviceType: 'paver_installation', skillName: 'Paver Installation', required: true },
  { serviceType: 'paver_installation', skillName: 'Grading & Drainage', required: false },

  { serviceType: 'retaining_wall', skillName: 'Retaining Wall Construction', required: true },
  { serviceType: 'retaining_wall', skillName: 'Grading & Drainage', required: true },

  // Irrigation
  { serviceType: 'irrigation_install', skillName: 'Irrigation Installation', required: true },
  { serviceType: 'irrigation_install', skillName: 'Irrigation Programming', required: true },

  { serviceType: 'irrigation_repair', skillName: 'Irrigation Repair', required: true },
  { serviceType: 'irrigation_repair', skillName: 'Irrigation Programming', required: false },
];

async function main() {
  console.log('Starting skills seed...');

  // Get all providers to seed skills for each one
  const providers = await prisma.provider.findMany({
    select: { id: true, businessName: true },
  });

  console.log(`Found ${providers.length} provider(s)`);

  for (const provider of providers) {
    console.log(`\nSeeding skills for provider: ${provider.businessName} (${provider.id})`);

    // Create all skills for this provider
    const createdSkills = [];
    for (const skillData of DEFAULT_SKILLS) {
      try {
        const skill = await prisma.skill.upsert({
          where: {
            providerId_name: {
              providerId: provider.id,
              name: skillData.name,
            },
          },
          update: {
            category: skillData.category,
            description: skillData.description,
          },
          create: {
            providerId: provider.id,
            name: skillData.name,
            category: skillData.category,
            description: skillData.description,
          },
        });
        createdSkills.push(skill);
      } catch (error) {
        console.error(`  Error creating skill "${skillData.name}":`, error);
      }
    }

    console.log(`  ✓ Created/updated ${createdSkills.length} skills`);

    // Create service skill requirements
    let requirementsCreated = 0;
    for (const req of SERVICE_SKILL_REQUIREMENTS) {
      const skill = createdSkills.find((s) => s.name === req.skillName);
      if (skill) {
        try {
          await prisma.serviceSkillRequirement.upsert({
            where: {
              serviceType_skillId: {
                serviceType: req.serviceType,
                skillId: skill.id,
              },
            },
            update: {
              required: req.required,
            },
            create: {
              serviceType: req.serviceType,
              skillId: skill.id,
              required: req.required,
            },
          });
          requirementsCreated++;
        } catch (error) {
          console.error(`  Error creating requirement for ${req.serviceType} -> ${req.skillName}:`, error);
        }
      }
    }

    console.log(`  ✓ Created/updated ${requirementsCreated} service skill requirements`);
  }

  console.log('\n✓ Skills seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding skills:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
