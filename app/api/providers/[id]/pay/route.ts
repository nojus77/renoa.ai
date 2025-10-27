import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Reset the revenue to 0 (which will make commission 0)
    // Or you can add a "paidCommission" field to track it
    const provider = await prisma.provider.update({
      where: { id },
      data: {
        totalRevenue: 0, // Reset revenue after payment
        // Alternatively: add lastPaidDate: new Date()
      },
    });

    return NextResponse.json({ 
      success: true, 
      provider 
    });
  } catch (error: any) {
    console.error('Error marking commission as paid:', error);
    return NextResponse.json(
      { error: 'Failed to mark commission as paid' },
      { status: 500 }
    );
  }
}