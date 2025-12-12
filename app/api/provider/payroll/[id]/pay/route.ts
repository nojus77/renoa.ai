import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * PATCH /api/provider/payroll/[id]/pay
 * Mark a work log as paid
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workLog = await prisma.workLog.update({
      where: { id: params.id },
      data: {
        isPaid: true,
        paidAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, workLog });
  } catch (error: any) {
    console.error('Error marking work log as paid:', error);

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Work log not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to mark as paid' },
      { status: 500 }
    );
  }
}
