import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * POST /api/provider/crews/auto-generate
 * Auto-generate crews based on worker skills
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { providerId } = body;

    if (!providerId) {
      return NextResponse.json(
        { error: 'Provider ID required' },
        { status: 400 }
      );
    }

    // Get all active field workers with their skills
    const workers = await prisma.providerUser.findMany({
      where: {
        providerId,
        role: 'field',
        status: 'active',
      },
      include: {
        workerSkills: {
          include: {
            skill: true,
          },
        },
      },
    });

    if (workers.length < 2) {
      return NextResponse.json(
        { error: 'Need at least 2 field workers to create crews' },
        { status: 400 }
      );
    }

    // Group workers by their primary skill category
    const skillCategories: Record<string, typeof workers> = {};

    workers.forEach(worker => {
      // Get all categories for this worker
      const categories = worker.workerSkills
        ?.map(ws => ws.skill.category)
        .filter(Boolean) || [];

      if (categories.length === 0) {
        // Workers without skills go to "general"
        if (!skillCategories['general']) skillCategories['general'] = [];
        skillCategories['general'].push(worker);
        return;
      }

      // Find the most common category
      const primaryCategory = getMostCommon(categories) || 'general';

      if (!skillCategories[primaryCategory]) {
        skillCategories[primaryCategory] = [];
      }
      skillCategories[primaryCategory].push(worker);
    });

    // Create crews based on skill categories
    const crewColors = [
      '#10b981', // emerald
      '#3b82f6', // blue
      '#f59e0b', // amber
      '#ef4444', // red
      '#8b5cf6', // purple
      '#ec4899', // pink
      '#06b6d4', // cyan
      '#f97316', // orange
    ];
    const createdCrews = [];
    let colorIndex = 0;

    for (const [category, categoryWorkers] of Object.entries(skillCategories)) {
      // Skip if only 1 worker in category
      if (categoryWorkers.length < 2) continue;

      // Create crew name from category
      const crewName = formatCrewName(category);

      // Check if crew with this name already exists
      const existing = await prisma.crew.findFirst({
        where: {
          providerId,
          name: crewName,
        },
      });

      if (existing) {
        console.log(`Crew "${crewName}" already exists, skipping`);
        continue;
      }

      // Create the crew with userIds array
      const crew = await prisma.crew.create({
        data: {
          name: crewName,
          providerId,
          color: crewColors[colorIndex % crewColors.length],
          leaderId: categoryWorkers[0]?.id, // First worker as leader
          userIds: categoryWorkers.map(w => w.id),
        },
      });

      // Fetch crew with user details for response
      const users = await prisma.providerUser.findMany({
        where: {
          id: { in: crew.userIds },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          profilePhotoUrl: true,
          color: true,
        },
      });

      createdCrews.push({
        ...crew,
        users,
        memberCount: crew.userIds.length,
      });

      colorIndex++;
    }

    // If no category-based crews created, create balanced crews of 3-4 workers
    if (createdCrews.length === 0 && workers.length >= 2) {
      const crewSize = 3;
      const numCrews = Math.ceil(workers.length / crewSize);

      for (let i = 0; i < numCrews; i++) {
        const crewWorkers = workers.slice(i * crewSize, (i + 1) * crewSize);
        if (crewWorkers.length < 2) continue;

        const crewName = `Crew ${i + 1}`;

        // Check if this numbered crew already exists
        const existing = await prisma.crew.findFirst({
          where: {
            providerId,
            name: crewName,
          },
        });

        if (existing) continue;

        const crew = await prisma.crew.create({
          data: {
            name: crewName,
            providerId,
            color: crewColors[i % crewColors.length],
            leaderId: crewWorkers[0]?.id,
            userIds: crewWorkers.map(w => w.id),
          },
        });

        const users = await prisma.providerUser.findMany({
          where: {
            id: { in: crew.userIds },
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            profilePhotoUrl: true,
            color: true,
          },
        });

        createdCrews.push({
          ...crew,
          users,
          memberCount: crew.userIds.length,
        });
      }
    }

    return NextResponse.json({ crews: createdCrews });
  } catch (error) {
    console.error('Auto-generate crews error:', error);
    return NextResponse.json(
      { error: 'Failed to generate crews' },
      { status: 500 }
    );
  }
}

// Helper: Get most common item in array
function getMostCommon(arr: string[]): string | null {
  if (arr.length === 0) return null;

  const counts: Record<string, number> = {};
  arr.forEach(item => {
    counts[item] = (counts[item] || 0) + 1;
  });

  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
}

// Helper: Format category into crew name
function formatCrewName(category: string): string {
  const nameMap: Record<string, string> = {
    tree_work: 'Tree Crew',
    landscaping: 'Landscaping Crew',
    hardscaping: 'Hardscape Crew',
    irrigation: 'Irrigation Crew',
    lawn_treatment: 'Lawn Care Crew',
    equipment: 'Equipment Crew',
    snow_removal: 'Snow Crew',
    general: 'General Crew',
    custom: 'Custom Crew',
    certification: 'Specialist Crew',
  };

  return (
    nameMap[category] ||
    `${category.charAt(0).toUpperCase() + category.slice(1).replace(/_/g, ' ')} Crew`
  );
}
