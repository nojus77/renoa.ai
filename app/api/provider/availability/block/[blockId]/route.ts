import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// DELETE - Remove a blocked time
export async function DELETE(
  request: NextRequest,
  { params }: { params: { blockId: string } }
) {
  try {
    await prisma.blockedTime.delete({
      where: { id: params.blockId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting blocked time:', error);
    return NextResponse.json(
      { error: 'Failed to delete blocked time' },
      { status: 500 }
    );
  }
}
