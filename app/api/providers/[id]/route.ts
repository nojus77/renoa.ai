import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const provider = await prisma.provider.findUnique({
      where: { id },
      include: {
        leads: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(provider);
  } catch (error: any) {
    console.error('Error fetching provider:', error);
    return NextResponse.json(
      { error: 'Failed to fetch provider', details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    console.log('📝 Updating provider:', id, 'with data:', body);

    // Build update object
    const updateData: any = {};

    if (body.businessName !== undefined) updateData.businessName = body.businessName;
    if (body.ownerName !== undefined) updateData.ownerName = body.ownerName;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.serviceTypes !== undefined) updateData.serviceTypes = body.serviceTypes;
    if (body.serviceAreas !== undefined) updateData.serviceAreas = body.serviceAreas;
    if (body.yearsInBusiness !== undefined) updateData.yearsInBusiness = parseInt(body.yearsInBusiness);
    if (body.status !== undefined) updateData.status = body.status;
    if (body.leadCapacity !== undefined) updateData.leadCapacity = parseInt(body.leadCapacity);
    if (body.rating !== undefined) updateData.rating = parseFloat(body.rating);

    const updatedProvider = await prisma.provider.update({
      where: { id },
      data: updateData,
    });

    console.log('✅ Provider updated successfully');

    return NextResponse.json(updatedProvider);
  } catch (error: any) {
    console.error('❌ Error updating provider:', error);
    return NextResponse.json(
      { error: 'Failed to update provider', details: error.message },
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

    // Check if provider has assigned leads
    const leadsCount = await prisma.lead.count({
      where: { assignedProviderId: id },
    });

    if (leadsCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete provider with ${leadsCount} assigned leads` },
        { status: 400 }
      );
    }

    await prisma.provider.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting provider:', error);
    return NextResponse.json(
      { error: 'Failed to delete provider', details: error.message },
      { status: 500 }
    );
  }
}