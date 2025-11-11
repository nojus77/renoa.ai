import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const providerId = searchParams.get('providerId');

    if (!providerId) {
      return NextResponse.json({ error: 'Provider ID required' }, { status: 400 });
    }

    // Fetch all leads for this provider (these are their customers)
    const leads = await prisma.lead.findMany({
      where: {
        assignedProviderId: providerId,
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
        leadSource: true,
        status: true,
        contractValue: true,
        createdAt: true,
        providerProposedDate: true,
        serviceInterest: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Group leads by customer (email as unique identifier)
    const customerMap = new Map<string, any>();

    leads.forEach(lead => {
      const customerId = lead.email.toLowerCase();

      if (!customerMap.has(customerId)) {
        // First time seeing this customer
        customerMap.set(customerId, {
          id: lead.id,
          name: `${lead.firstName} ${lead.lastName}`,
          email: lead.email,
          phone: lead.phone,
          address: `${lead.address}, ${lead.city}, ${lead.state} ${lead.zip}`,
          source: lead.leadSource === 'landing_page_hero' || lead.leadSource?.includes('renoa') ? 'renoa' : 'own',
          totalJobs: 0,
          lifetimeValue: 0,
          lastJobDate: null as string | null,
          lastJobService: null as string | null,
          tags: [] as string[],
          rating: undefined as number | undefined,
          isActive: false,
          createdAt: lead.createdAt,
          jobs: [] as any[],
        });
      }

      const customer = customerMap.get(customerId);

      // Add this job to the customer's record
      customer.jobs.push(lead);
      customer.totalJobs++;

      if (lead.contractValue) {
        customer.lifetimeValue += lead.contractValue;
      }

      // Update last job date if this is more recent
      if (lead.providerProposedDate) {
        if (!customer.lastJobDate || new Date(lead.providerProposedDate) > new Date(customer.lastJobDate)) {
          customer.lastJobDate = lead.providerProposedDate;
          customer.lastJobService = lead.serviceInterest?.replace(/_/g, ' ');
        }
      }

      // Customer is active if they have any jobs in last 3 months
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      if (lead.providerProposedDate && new Date(lead.providerProposedDate) > threeMonthsAgo) {
        customer.isActive = true;
      }

      // Add tags based on job characteristics
      if (customer.totalJobs >= 5 && !customer.tags.includes('Premium')) {
        customer.tags.push('Premium');
      }
      if (customer.totalJobs >= 3 && !customer.tags.includes('Recurring')) {
        customer.tags.push('Recurring');
      }
      if (customer.lifetimeValue >= 5000 && !customer.tags.includes('VIP')) {
        customer.tags.push('VIP');
      }
    });

    // Convert map to array and remove jobs array (not needed in response)
    const customers = Array.from(customerMap.values()).map(({ jobs, ...customer }) => customer);

    return NextResponse.json({ customers });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      providerId,
      firstName,
      lastName,
      email,
      phone,
      address,
      city,
      state,
      zip,
      tags,
      notes,
    } = body;

    if (!providerId || !firstName || !lastName || !email || !phone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create a new lead/customer record
    const customer = await prisma.lead.create({
      data: {
        assignedProviderId: providerId,
        firstName,
        lastName,
        email,
        phone,
        address: address || '',
        city: city || '',
        state: state || '',
        zip: zip || '',
        propertyType: 'single_family',
        serviceInterest: 'landscaping',
        status: 'new',
        schedulingStatus: 'pending',
        leadSource: 'provider_manual',
        tier: 1,
        notes: notes || null,
      },
    });

    return NextResponse.json({ success: true, customer });
  } catch (error) {
    console.error('Error creating customer:', error);
    return NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 }
    );
  }
}
