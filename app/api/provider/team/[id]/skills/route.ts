import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/provider/team/[id]/skills
 * Get all skills for a specific worker
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const workerSkills = await prisma.providerUserSkill.findMany({
      where: { userId: params.id },
      include: {
        skill: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(workerSkills);
  } catch (error) {
    console.error('Error fetching worker skills:', error);
    return NextResponse.json({ error: 'Failed to fetch worker skills' }, { status: 500 });
  }
}

/**
 * POST /api/provider/team/[id]/skills
 * Assign a skill to a worker
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { skillId, level, certifiedDate, expiresAt } = body;

    if (!skillId) {
      return NextResponse.json({ error: 'Skill ID is required' }, { status: 400 });
    }

    const workerSkill = await prisma.providerUserSkill.create({
      data: {
        userId: params.id,
        skillId,
        level: level || 'basic',
        certifiedDate: certifiedDate ? new Date(certifiedDate) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
      include: {
        skill: true,
      },
    });

    return NextResponse.json(workerSkill, { status: 201 });
  } catch (error: any) {
    console.error('Error assigning skill to worker:', error);

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Worker already has this skill assigned' },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: 'Failed to assign skill' }, { status: 500 });
  }
}

/**
 * DELETE /api/provider/team/[id]/skills
 * Remove a skill from a worker
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const skillId = searchParams.get('skillId');

    if (!skillId) {
      return NextResponse.json({ error: 'Skill ID is required' }, { status: 400 });
    }

    await prisma.providerUserSkill.delete({
      where: {
        userId_skillId: {
          userId: params.id,
          skillId,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error removing skill from worker:', error);

    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Skill assignment not found' }, { status: 404 });
    }

    return NextResponse.json({ error: 'Failed to remove skill' }, { status: 500 });
  }
}
