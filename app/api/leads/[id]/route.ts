import prisma from '@/lib/db'
import { type Lead } from '@/lib/types/lead'
import { LeadStatus, ServiceCategory, Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'

// Define the shape of the request body for updating a lead
type LeadUpdateRequest = Partial<{
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  status: LeadStatus;
  service?: {
    confirmed?: ServiceCategory;
  };
  property?: {
    value?: number | null;
    squareFeet?: number | null;
  };
}>

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const updates = await request.json() as LeadUpdateRequest
    const { id } = params

    // Validate the lead ID
    if (!id) {
      return NextResponse.json(
        { error: 'Lead ID is required' },
        { status: 400 }
      )
    }

    // Update lead in database
    const updatedLead = await prisma.lead.update({
      where: { id },
      data: {
        ...(updates.firstName && { firstName: updates.firstName }),
        ...(updates.lastName && { lastName: updates.lastName }),
        ...(updates.email && { email: updates.email }),
        ...(updates.phone && { phone: updates.phone }),
        ...(updates.address && { address: updates.address }),
        ...(updates.city && { city: updates.city }),
        ...(updates.state && { state: updates.state }),
        ...(updates.zip && { zip: updates.zip }),
        ...(updates.status && { status: updates.status.toUpperCase() as LeadStatus }),
        ...(updates.service?.confirmed && {
          serviceInterest: updates.service.confirmed.toUpperCase() as ServiceCategory,
        }),
        ...(updates.property?.value !== undefined && { propertyValue: updates.property.value }),
        ...(updates.property?.squareFeet !== undefined && { squareFootage: updates.property.squareFeet }),
        notes: `Updated on ${new Date().toISOString()}`,
      },
      include: {
        messages: {
          orderBy: { sentAt: 'desc' },
          take: 10,
        },
        engagementMetrics: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        matches: true,
      }
    })

    // Revalidate the leads page to show updated data
    revalidatePath('/dashboard/leads')

    return NextResponse.json(updatedLead)
  } catch (error) {
    console.error('Error updating lead:', error)
    return NextResponse.json(
      { error: 'Failed to update lead' },
      { status: 500 }
    )
  }
}