import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'

interface LeadInput {
  firstName: string
  lastName: string
  email: string
  phone: string
  address?: string
  city: string
  state: string
  zip: string
  propertyType?: string
  propertyValue?: number
  squareFootage?: number
  moveInDate?: string
  serviceInterest: string
  leadSource?: string
  leadScore?: number
  status?: string
  notes?: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const leads: LeadInput[] = Array.isArray(body) ? body : []

    if (!leads.length) {
      return NextResponse.json(
        { error: 'Request body must be an array of lead objects' },
        { status: 400 }
      )
    }

    const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'city', 'state', 'zip', 'serviceInterest']
    
    const validLeads: any[] = []
    const failedLeads: { lead: LeadInput; errors: string[] }[] = []

    for (const lead of leads) {
      const missingFields = requiredFields.filter(field => !lead[field as keyof LeadInput])
      
      if (missingFields.length) {
        failedLeads.push({
          lead,
          errors: [`Missing required fields: ${missingFields.join(', ')}`]
        })
        continue
      }

      validLeads.push({
        firstName: lead.firstName,
        lastName: lead.lastName,
        email: lead.email,
        phone: lead.phone,
        address: lead.address || '',
        city: lead.city,
        state: lead.state,
        zip: lead.zip,
        propertyType: lead.propertyType || 'single_family',
        propertyValue: lead.propertyValue ? parseFloat(lead.propertyValue.toString()) : null,
        squareFootage: lead.squareFootage ? parseInt(lead.squareFootage.toString()) : null,
        moveInDate: lead.moveInDate ? new Date(lead.moveInDate) : null,
        serviceInterest: lead.serviceInterest,
        leadSource: lead.leadSource || 'ai_tool',
        leadScore: lead.leadScore || 50,
        status: lead.status || 'new',
        notes: lead.notes || null
      })
    }

    let successfulCount = 0
    
    if (validLeads.length) {
      try {
        const result = await prisma.lead.createMany({
          data: validLeads,
          skipDuplicates: true
        })
        successfulCount = result.count
      } catch (error) {
        console.error('Database insertion error:', error)
        failedLeads.push(...validLeads.map(lead => ({
          lead,
          errors: ['Database insertion failed']
        })))
      }
    }

    return NextResponse.json({
      successfulCount,
      failedCount: failedLeads.length,
      failedLeads: failedLeads.length > 0 ? failedLeads : undefined
    }, { status: 201 })

  } catch (error) {
    console.error('Bulk import error:', error)
    return NextResponse.json(
      { error: 'Failed to process bulk leads' },
      { status: 500 }
    )
  }
}
