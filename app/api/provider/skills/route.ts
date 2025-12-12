import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/provider/skills
 * Get all skills for a provider
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const providerId = searchParams.get('providerId');
    const category = searchParams.get('category');

    if (!providerId) {
      return NextResponse.json({ error: 'Provider ID is required' }, { status: 400 });
    }

    const where: any = { providerId };
    if (category) {
      where.category = category;
    }

    const skills = await prisma.skill.findMany({
      where,
      include: {
        workers: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        services: true,
        _count: {
          select: {
            workers: true,
            services: true,
          },
        },
      },
    });

    // Sort by usage count (most used first), then alphabetically
    const sortedSkills = skills.sort((a, b) => {
      // Most used first
      if (b._count.workers !== a._count.workers) {
        return b._count.workers - a._count.workers;
      }
      // Then alphabetically
      return a.name.localeCompare(b.name);
    });

    // Add usageCount to response for easier frontend access
    const skillsWithUsage = sortedSkills.map(skill => ({
      ...skill,
      usageCount: skill._count.workers,
    }));

    return NextResponse.json(skillsWithUsage);
  } catch (error) {
    console.error('Error fetching skills:', error);
    return NextResponse.json({ error: 'Failed to fetch skills' }, { status: 500 });
  }
}

/**
 * POST /api/provider/skills
 * Create a new skill for a provider
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { providerId, name, category, description } = body;

    if (!providerId || !name) {
      return NextResponse.json(
        { error: 'Provider ID and skill name are required' },
        { status: 400 }
      );
    }

    const skill = await prisma.skill.create({
      data: {
        providerId,
        name,
        category,
        description,
        isCustom: body.isCustom || false,
      },
    });

    return NextResponse.json(skill, { status: 201 });
  } catch (error: any) {
    console.error('Error creating skill:', error);

    // Handle unique constraint violation
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A skill with this name already exists for this provider' },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: 'Failed to create skill' }, { status: 500 });
  }
}
