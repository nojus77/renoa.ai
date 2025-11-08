import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    const updatedProvider = await prisma.provider.update({
      where: { id },
      data: {
        businessName: body.businessName,
        ownerName: body.ownerName || body.contactName, // Use ownerName field
        email: body.email,
        phone: body.phone,
        serviceTypes: body.serviceTypes,
        serviceAreas: body.serviceAreas || body.serviceTypes, // Use serviceAreas field
        commissionRate: body.commissionRate,
        status: body.status,
        yearsInBusiness: body.yearsInBusiness,
        rating: body.rating,
      },
    });

    return NextResponse.json(updatedProvider);
  } catch (error) {
    console.error('Error updating provider:', error);
    return NextResponse.json(
      { error: 'Failed to update provider' },
      { status: 500 }
    );
  }
}