import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Comprehensive skills library for landscaping/home improvement companies
const comprehensiveSkills = [
  // ═══════════════════════════════════════════════════════════════
  // LANDSCAPING
  // ═══════════════════════════════════════════════════════════════
  { name: 'Lawn Mowing', category: 'Landscaping' },
  { name: 'Edging & Trimming', category: 'Landscaping' },
  { name: 'Mulching', category: 'Landscaping' },
  { name: 'Leaf Removal', category: 'Landscaping' },
  { name: 'Spring Cleanup', category: 'Landscaping' },
  { name: 'Fall Cleanup', category: 'Landscaping' },
  { name: 'Garden Bed Maintenance', category: 'Landscaping' },
  { name: 'Planting (Flowers)', category: 'Landscaping' },
  { name: 'Planting (Shrubs)', category: 'Landscaping' },
  { name: 'Planting (Trees)', category: 'Landscaping' },
  { name: 'Sod Installation', category: 'Landscaping' },
  { name: 'Seeding & Overseeding', category: 'Landscaping' },
  { name: 'Aeration', category: 'Landscaping' },
  { name: 'Dethatching', category: 'Landscaping' },
  { name: 'Weed Control', category: 'Landscaping' },
  { name: 'Hedge Trimming', category: 'Landscaping' },
  { name: 'Bush/Shrub Pruning', category: 'Landscaping' },
  { name: 'Landscape Design', category: 'Landscaping' },
  { name: 'Drainage Solutions', category: 'Landscaping' },
  { name: 'Grading & Leveling', category: 'Landscaping' },

  // ═══════════════════════════════════════════════════════════════
  // TREE WORK
  // ═══════════════════════════════════════════════════════════════
  { name: 'Tree Trimming', category: 'Tree Work' },
  { name: 'Tree Pruning', category: 'Tree Work' },
  { name: 'Tree Removal', category: 'Tree Work' },
  { name: 'Stump Grinding', category: 'Tree Work' },
  { name: 'Stump Removal', category: 'Tree Work' },
  { name: 'Emergency Tree Service', category: 'Tree Work' },
  { name: 'Tree Cabling & Bracing', category: 'Tree Work' },
  { name: 'Tree Health Assessment', category: 'Tree Work' },
  { name: 'Crown Reduction', category: 'Tree Work' },
  { name: 'Deadwooding', category: 'Tree Work' },
  { name: 'Tree Planting', category: 'Tree Work' },
  { name: 'Palm Tree Trimming', category: 'Tree Work' },

  // ═══════════════════════════════════════════════════════════════
  // HARDSCAPING
  // ═══════════════════════════════════════════════════════════════
  { name: 'Paver Installation', category: 'Hardscaping' },
  { name: 'Patio Construction', category: 'Hardscaping' },
  { name: 'Walkway Installation', category: 'Hardscaping' },
  { name: 'Driveway Installation', category: 'Hardscaping' },
  { name: 'Retaining Wall (Block)', category: 'Hardscaping' },
  { name: 'Retaining Wall (Stone)', category: 'Hardscaping' },
  { name: 'Retaining Wall (Wood)', category: 'Hardscaping' },
  { name: 'Concrete Work', category: 'Hardscaping' },
  { name: 'Stamped Concrete', category: 'Hardscaping' },
  { name: 'Stone/Rock Work', category: 'Hardscaping' },
  { name: 'Fire Pit Installation', category: 'Hardscaping' },
  { name: 'Outdoor Kitchen', category: 'Hardscaping' },
  { name: 'Fence Installation', category: 'Hardscaping' },
  { name: 'Deck Building', category: 'Hardscaping' },
  { name: 'Pergola/Gazebo', category: 'Hardscaping' },

  // ═══════════════════════════════════════════════════════════════
  // IRRIGATION
  // ═══════════════════════════════════════════════════════════════
  { name: 'Sprinkler Installation', category: 'Irrigation' },
  { name: 'Sprinkler Repair', category: 'Irrigation' },
  { name: 'Drip Irrigation', category: 'Irrigation' },
  { name: 'Irrigation System Design', category: 'Irrigation' },
  { name: 'Sprinkler Winterization', category: 'Irrigation' },
  { name: 'Sprinkler Spring Startup', category: 'Irrigation' },
  { name: 'Smart Controller Install', category: 'Irrigation' },
  { name: 'Valve Repair/Replace', category: 'Irrigation' },
  { name: 'Backflow Testing', category: 'Irrigation' },
  { name: 'French Drain Install', category: 'Irrigation' },

  // ═══════════════════════════════════════════════════════════════
  // LAWN TREATMENT
  // ═══════════════════════════════════════════════════════════════
  { name: 'Fertilization', category: 'Lawn Treatment' },
  { name: 'Pre-Emergent Application', category: 'Lawn Treatment' },
  { name: 'Post-Emergent Application', category: 'Lawn Treatment' },
  { name: 'Grub Control', category: 'Lawn Treatment' },
  { name: 'Fungicide Application', category: 'Lawn Treatment' },
  { name: 'Lime Application', category: 'Lawn Treatment' },
  { name: 'Soil Testing', category: 'Lawn Treatment' },
  { name: 'Mosquito Control', category: 'Lawn Treatment' },
  { name: 'Tick Control', category: 'Lawn Treatment' },

  // ═══════════════════════════════════════════════════════════════
  // EQUIPMENT OPERATION
  // ═══════════════════════════════════════════════════════════════
  { name: 'Zero-Turn Mower', category: 'Equipment' },
  { name: 'Walk-Behind Mower', category: 'Equipment' },
  { name: 'Stand-On Mower', category: 'Equipment' },
  { name: 'String Trimmer', category: 'Equipment' },
  { name: 'Leaf Blower', category: 'Equipment' },
  { name: 'Chainsaw', category: 'Equipment' },
  { name: 'Pole Saw', category: 'Equipment' },
  { name: 'Hedge Trimmer', category: 'Equipment' },
  { name: 'Skid Steer', category: 'Equipment' },
  { name: 'Mini Excavator', category: 'Equipment' },
  { name: 'Dump Truck', category: 'Equipment' },
  { name: 'Trailer Operation', category: 'Equipment' },
  { name: 'Aerator Machine', category: 'Equipment' },
  { name: 'Stump Grinder', category: 'Equipment' },
  { name: 'Wood Chipper', category: 'Equipment' },
  { name: 'Plate Compactor', category: 'Equipment' },
  { name: 'Trencher', category: 'Equipment' },
  { name: 'Sod Cutter', category: 'Equipment' },
  { name: 'Spray Equipment', category: 'Equipment' },
  { name: 'Bucket Truck', category: 'Equipment' },
  { name: 'Crane Operation', category: 'Equipment' },

  // ═══════════════════════════════════════════════════════════════
  // CERTIFICATIONS & LICENSES
  // ═══════════════════════════════════════════════════════════════
  { name: 'CDL License (Class A)', category: 'Certification' },
  { name: 'CDL License (Class B)', category: 'Certification' },
  { name: 'Pesticide Applicator License', category: 'Certification' },
  { name: 'ISA Certified Arborist', category: 'Certification' },
  { name: 'OSHA 10 Training', category: 'Certification' },
  { name: 'OSHA 30 Training', category: 'Certification' },
  { name: 'First Aid/CPR', category: 'Certification' },
  { name: 'Backflow Certification', category: 'Certification' },
  { name: 'Irrigation Technician Cert', category: 'Certification' },
  { name: 'ICPI Certification', category: 'Certification' },
  { name: 'NCMA Certification', category: 'Certification' },
  { name: 'Tree Risk Assessment (TRAQ)', category: 'Certification' },

  // ═══════════════════════════════════════════════════════════════
  // SNOW & WINTER
  // ═══════════════════════════════════════════════════════════════
  { name: 'Snow Plowing', category: 'Snow Removal' },
  { name: 'Sidewalk Shoveling', category: 'Snow Removal' },
  { name: 'Salt/Ice Melt Application', category: 'Snow Removal' },
  { name: 'Snow Blower Operation', category: 'Snow Removal' },
  { name: 'De-Icing', category: 'Snow Removal' },

  // ═══════════════════════════════════════════════════════════════
  // SOFT SKILLS
  // ═══════════════════════════════════════════════════════════════
  { name: 'Customer Communication', category: 'Soft Skills' },
  { name: 'Crew Leader', category: 'Soft Skills' },
  { name: 'Estimating', category: 'Soft Skills' },
  { name: 'Spanish Speaking', category: 'Soft Skills' },
  { name: 'Training New Hires', category: 'Soft Skills' },
];

/**
 * POST /api/provider/skills/seed-defaults
 * Seeds comprehensive default skills for a provider
 */
export async function POST(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const providerId = searchParams.get('providerId');

    if (!providerId) {
      return NextResponse.json(
        { error: 'Provider ID is required' },
        { status: 400 }
      );
    }

    let added = 0;
    let skipped = 0;

    for (const skill of comprehensiveSkills) {
      // Check if skill already exists
      const exists = await prisma.skill.findFirst({
        where: {
          providerId,
          name: skill.name,
        },
      });

      if (!exists) {
        await prisma.skill.create({
          data: {
            providerId,
            name: skill.name,
            category: skill.category,
          },
        });
        added++;
      } else {
        skipped++;
      }
    }

    return NextResponse.json({
      success: true,
      added,
      skipped,
      total: comprehensiveSkills.length,
      message: `Added ${added} skills (${skipped} already existed)`,
    });
  } catch (error) {
    console.error('Error seeding default skills:', error);
    return NextResponse.json(
      { error: 'Failed to seed default skills' },
      { status: 500 }
    );
  }
}
