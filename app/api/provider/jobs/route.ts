import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      providerId,
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      serviceType,
      startTime,
      endTime,
      estimatedValue,
      internalNotes,
      customerNotes,
      status,
    } = body;

    if (!providerId || !customerName || !customerEmail || !customerPhone || !serviceType || !startTime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create new lead for "own client" job
    const lead = await prisma.lead.create({
      data: {
        assignedProviderId: providerId,
        firstName: customerName.split(' ')[0],
        lastName: customerName.split(' ').slice(1).join(' ') || customerName.split(' ')[0],
        email: customerEmail,
        phone: customerPhone,
        address: customerAddress || '',
        city: '',
        state: '',
        zip: '',
        propertyType: 'single_family',
        serviceInterest: serviceType.toUpperCase().replace(/ /g, '_'),
        providerProposedDate: startTime,
        status: status || 'scheduled',
        schedulingStatus: 'confirmed',
        leadSource: 'provider_manual',
        tier: 1,
        contractValue: estimatedValue ? parseFloat(estimatedValue) : null,
        notes: internalNotes || null,
      },
    });

    return NextResponse.json({ success: true, job: lead });
  } catch (error) {
    console.error('Error creating job:', error);
    return NextResponse.json(
      { error: 'Failed to create job' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const providerId = searchParams.get('providerId');

    if (!providerId) {
      return NextResponse.json({ error: 'Provider ID required' }, { status: 400 });
    }

    // Fetch all jobs for this provider (confirmed appointments + own clients)
    const leads = await prisma.lead.findMany({
      where: {
        assignedProviderId: providerId,
        schedulingStatus: 'confirmed',
        providerProposedDate: { not: null }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        state: true,
        zip: true,
        serviceInterest: true,
        providerProposedDate: true,
        status: true,
        leadSource: true,
        createdAt: true,
        contractValue: true,
        notes: true,
      },
      orderBy: {
        providerProposedDate: 'asc'
      }
    });

    // Transform to job format
    const jobs = leads.map(lead => ({
      id: lead.id,
      customerName: `${lead.firstName} ${lead.lastName}`,
      serviceType: lead.serviceInterest,
      startTime: lead.providerProposedDate,
      // Default 2-hour duration
      endTime: lead.providerProposedDate
        ? new Date(new Date(lead.providerProposedDate).getTime() + 2 * 60 * 60 * 1000).toISOString()
        : null,
      status: lead.status || 'scheduled', // scheduled, in_progress, completed, cancelled
      isRenoaLead: lead.leadSource === 'landing_page_hero' || lead.leadSource?.includes('renoa'),
      phone: lead.phone,
      email: lead.email,
      address: `${lead.address}, ${lead.city}, ${lead.state} ${lead.zip}`,
      createdAt: lead.createdAt,
      estimatedValue: lead.contractValue,
      actualValue: lead.contractValue, // Can be updated later
      notes: lead.notes,
    }));

    return NextResponse.json({ jobs });
  } catch (error) {
    console.error('Error fetching provider jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}
