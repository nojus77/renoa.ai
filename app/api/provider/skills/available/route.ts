import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/provider/skills/available
 * Returns skills that at least one worker in the company has
 * This auto-updates - when a worker gets a new skill, it appears in the dropdown
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('providerId');

    if (!providerId) {
      return NextResponse.json({ error: 'Provider ID is required' }, { status: 400 });
    }

    // Find skills that at least one worker has
    const workerSkills = await prisma.providerUserSkill.findMany({
      where: {
        user: {
          providerId,
          status: 'active',
        },
      },
      select: {
        skillId: true,
        skill: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
      },
      distinct: ['skillId'],
    });

    // Extract unique skills
    const availableSkills = workerSkills.map(ws => ws.skill);

    // Sort by category then name
    availableSkills.sort((a, b) => {
      if (a.category && b.category && a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json({
      skills: availableSkills,
      count: availableSkills.length,
    });
  } catch (error) {
    console.error('[Available Skills API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch available skills' },
      { status: 500 }
    );
  }
}
