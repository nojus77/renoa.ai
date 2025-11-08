import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status');
    const serviceType = searchParams.get('serviceType');

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (serviceType) {
      where.serviceTypes = {
        has: serviceType,
      };
    }

    const total = await prisma.provider.count({ where });

    const providers = await prisma.provider.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        leads: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            status: true,
          },
        },
      },
    });

    return NextResponse.json({
      providers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching providers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch providers' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log('📥 Received provider data:', JSON.stringify(body, null, 2));

    // Validate required fields
    if (!body.businessName || !body.email || !body.phone) {
      return NextResponse.json(
        { error: 'Missing required fields: businessName, email, phone' },
        { status: 400 }
      );
    }

    // Parse service types - handle both array and comma-separated string
    let serviceTypes: string[] = [];
    if (Array.isArray(body.serviceTypes)) {
      serviceTypes = body.serviceTypes;
    } else if (typeof body.serviceTypes === 'string') {
      serviceTypes = body.serviceTypes.split(',').map((s: string) => s.trim()).filter(Boolean);
    }

    // Parse service areas
    let serviceAreas: string[] = [];
    if (Array.isArray(body.serviceAreas)) {
      serviceAreas = body.serviceAreas;
    } else if (typeof body.serviceAreas === 'string') {
      serviceAreas = body.serviceAreas.split(',').map((s: string) => s.trim()).filter(Boolean);
    } else if (body.city) {
      // If no serviceAreas but city is provided, use city
      serviceAreas = [body.city];
    }

    const providerData = {
      businessName: body.businessName,
      ownerName: body.ownerName || body.contactName || 'Owner',
      email: body.email,
      phone: body.phone,
      serviceTypes: serviceTypes.length > 0 ? serviceTypes : ['landscaping'],
      serviceAreas: serviceAreas.length > 0 ? serviceAreas : ['Chicago'],
      yearsInBusiness: body.yearsInBusiness ? parseInt(body.yearsInBusiness) : 0,
      status: body.status || 'active',
      leadCapacity: body.leadCapacity ? parseInt(body.leadCapacity) : 10,
      currentLeadCount: 0,
      rating: body.rating ? parseFloat(body.rating) : 0,
      totalLeadsSent: 0,
      leadsAccepted: 0,
      leadsConverted: 0,
      totalRevenue: 0,
      commissionRate: body.commissionRate ? parseFloat(body.commissionRate) : 0.15,
      averageJobValue: 0,
    };

    console.log('💾 Creating provider with data:', JSON.stringify(providerData, null, 2));

    const provider = await prisma.provider.create({
      data: providerData,
    });

    console.log('✅ Provider created successfully:', provider.id);

    return NextResponse.json({ provider }, { status: 201 });
  } catch (error: any) {
    console.error('💥 Error creating provider:', error);
    
    // Handle duplicate email error
    if (error.code === 'P2002') {
      return NextResponse.json(
        { 
          error: 'A provider with this email already exists',
          details: 'Please use a different email address'
        },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to create provider', 
        details: error.message,
        code: error.code 
      },
      { status: 500 }
    );
  }
}