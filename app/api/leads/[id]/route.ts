import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    console.log('📝 Updating lead:', id, 'with data:', body);

    // Build update object
    const updateData: any = {};

    if (body.firstName !== undefined) updateData.firstName = body.firstName;
    if (body.lastName !== undefined) updateData.lastName = body.lastName;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.address !== undefined) updateData.address = body.address;
    if (body.city !== undefined) updateData.city = body.city;
    if (body.state !== undefined) updateData.state = body.state;
    if (body.zip !== undefined) updateData.zip = body.zip;
    if (body.serviceInterest !== undefined) updateData.serviceInterest = body.serviceInterest;
    if (body.propertyValue !== undefined) {
      updateData.propertyValue = body.propertyValue ? new Prisma.Decimal(body.propertyValue) : null;
    }
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.leadScore !== undefined) updateData.leadScore = body.leadScore;
    if (body.tier !== undefined) updateData.tier = body.tier;

    const updatedLead = await prisma.lead.update({
      where: { id },
      data: updateData,
    });

    console.log('✅ Lead updated successfully');

    return NextResponse.json(updatedLead);
  } catch (error: any) {
    console.error('❌ Error updating lead:', error);
    return NextResponse.json(
      { error: 'Failed to update lead', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const lead = await prisma.lead.findUnique({
      where: { id },
    });

    if (!lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(lead);
  } catch (error: any) {
    console.error('Error fetching lead:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lead', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    await prisma.lead.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting lead:', error);
    return NextResponse.json(
      { error: 'Failed to delete lead', details: error.message },
      { status: 500 }
    );
  }
}