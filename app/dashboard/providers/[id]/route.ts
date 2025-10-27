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
        contactName: body.contactName,
        email: body.email,
        phone: body.phone,
        serviceTypes: body.serviceTypes,
        address: body.address,
        city: body.city,
        state: body.state,
        zip: body.zip,
        website: body.website || null,
        commissionRate: body.commissionRate,
        notes: body.notes || null,
        status: body.status,
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