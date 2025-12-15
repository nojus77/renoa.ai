import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * PUT /api/worker/profile/equipment
 * Update worker's equipment list
 * Note: Equipment is stored in the 'skills' field with 'EQUIP:' prefix
 * until a dedicated equipment field is added to the schema
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, equipment } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!Array.isArray(equipment)) {
      return NextResponse.json(
        { error: 'Equipment must be an array' },
        { status: 400 }
      );
    }

    // Verify user exists
    const user = await prisma.providerUser.findUnique({
      where: { id: userId },
      select: { id: true, skills: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Store equipment with EQUIP: prefix to distinguish from skills
    // Keep any existing skills that don't have the EQUIP: prefix
    const existingSkills = (user.skills || []).filter(s => !s.startsWith('EQUIP:'));
    const equipmentItems = equipment.map(e => `EQUIP:${e}`);

    await prisma.providerUser.update({
      where: { id: userId },
      data: {
        skills: [...existingSkills, ...equipmentItems],
      },
    });

    return NextResponse.json({
      success: true,
      equipment,
    });
  } catch (error) {
    console.error('Error updating equipment:', error);
    return NextResponse.json(
      { error: 'Failed to update equipment' },
      { status: 500 }
    );
  }
}
