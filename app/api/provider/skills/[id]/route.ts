import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/provider/skills/[id]
 * Get a specific skill by ID
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const skill = await prisma.skill.findUnique({
      where: { id: params.id },
      include: {
        workers: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profilePhotoUrl: true,
              },
            },
          },
        },
        services: true,
      },
    });

    if (!skill) {
      return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
    }

    return NextResponse.json(skill);
  } catch (error) {
    console.error('Error fetching skill:', error);
    return NextResponse.json({ error: 'Failed to fetch skill' }, { status: 500 });
  }
}

/**
 * PATCH /api/provider/skills/[id]
 * Update a skill
 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { name, category, description } = body;

    const skill = await prisma.skill.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(category !== undefined && { category }),
        ...(description !== undefined && { description }),
      },
    });

    return NextResponse.json(skill);
  } catch (error: any) {
    console.error('Error updating skill:', error);

    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
    }

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A skill with this name already exists for this provider' },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: 'Failed to update skill' }, { status: 500 });
  }
}

/**
 * DELETE /api/provider/skills/[id]
 * Delete a skill
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.skill.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting skill:', error);

    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
    }

    return NextResponse.json({ error: 'Failed to delete skill' }, { status: 500 });
  }
}
