import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PATCH(
  request: NextRequest,
  { params }: { params: { customerId: string } }
) {
  try {
    const body = await request.json();
    const { isFavorite } = body;

    // TODO: Store favorite status in a separate customer metadata table
    // For now, just return success
    return NextResponse.json({ success: true, isFavorite });
  } catch (error) {
    console.error('Error toggling favorite:', error);
    return NextResponse.json(
      { error: 'Failed to toggle favorite' },
      { status: 500 }
    );
  }
}
