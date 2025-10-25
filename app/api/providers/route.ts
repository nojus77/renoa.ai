import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const providers = await prisma.provider.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(providers);
  } catch (error) {
    console.error('Error fetching providers:', error);
    return NextResponse.json({ error: 'Failed to fetch providers' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('Creating provider with data:', body);

    // Validate required fields
    if (!body.businessName || !body.contactName || !body.email || !body.phone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Ensure serviceTypes is an array
    const serviceTypes = Array.isArray(body.serviceTypes) ? body.serviceTypes : [];

    if (serviceTypes.length === 0) {
      return NextResponse.json(
        { error: 'At least one service type is required' },
        { status: 400 }
      );
    }

    const provider = await prisma.provider.create({
      data: {
        businessName: body.businessName,
        contactName: body.contactName,
        email: body.email,
        phone: body.phone,
        serviceTypes: serviceTypes,
        address: body.address || '',
        city: body.city || '',
        state: body.state || '',
        zip: body.zip || '',
        website: body.website || null,
        commissionRate: body.commissionRate || 0.15,
        status: body.status || 'active',
        notes: body.notes || null,
        rating: null,
        totalRevenue: 0,
        unpaidCommission: 0,
        leadsReceived: 0,
        leadsConverted: 0,
        responseTime: null,
        conversionRate: null,
      },
    });

    console.log('Provider created successfully:', provider);

    return NextResponse.json(provider, { status: 201 });
  } catch (error) {
    console.error('Error creating provider:', error);
    
    // Log the full error for debugging
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    return NextResponse.json(
      { error: 'Failed to create provider', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}