import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * PUT /api/worker/profile/skills
 * Update worker's skills (stored locally for now)
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, skills } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!Array.isArray(skills)) {
      return NextResponse.json(
        { error: 'Skills must be an array' },
        { status: 400 }
      );
    }

    // Verify user exists
    const user = await prisma.providerUser.findUnique({
      where: { id: userId },
      select: { id: true, providerId: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // For now, we'll store skills in the notes field or create skill records
    // This is a simplified implementation - in production you'd want a proper skills table

    // Get or create skills and link them to the worker
    const skillRecords = [];

    for (const skillName of skills) {
      // Find or create the skill
      let skill = await prisma.skill.findFirst({
        where: {
          name: skillName,
          providerId: user.providerId,
        },
      });

      if (!skill) {
        skill = await prisma.skill.create({
          data: {
            name: skillName,
            providerId: user.providerId,
            category: 'general',
          },
        });
      }

      skillRecords.push(skill);
    }

    // Remove existing worker skills
    await prisma.providerUserSkill.deleteMany({
      where: { userId },
    });

    // Add new worker skills
    for (const skill of skillRecords) {
      await prisma.providerUserSkill.create({
        data: {
          userId,
          skillId: skill.id,
        },
      });
    }

    return NextResponse.json({
      success: true,
      skills: skillRecords.map(s => s.name),
    });
  } catch (error) {
    console.error('Error updating skills:', error);
    return NextResponse.json(
      { error: 'Failed to update skills' },
      { status: 500 }
    );
  }
}
