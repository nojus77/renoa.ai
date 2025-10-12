import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'
import { LeadStatus, ServiceCategory } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status')?.split(',').filter(Boolean) as LeadStatus[] | undefined
    const serviceInterest = searchParams.get('serviceInterest')?.split(',').filter(Boolean) as ServiceCategory[] | undefined
    
    const where: any = {}
    
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ]
    }
    
    if (status && status.length > 0) {
      where.status = { in: status }
    }
    
    if (serviceInterest && serviceInterest.length > 0) {
      where.serviceInterest = { in: serviceInterest }
    }
    
    const total = await prisma.lead.count({ where })
    
    const leads = await prisma.lead.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    return NextResponse.json({
      leads,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching leads:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leads' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const { 
      firstName, 
      lastName, 
      email, 
      phone, 
      address, 
      city, 
      state, 
      zip, 
      propertyType, 
      serviceInterest,
      leadSource 
    } = body
    
    if (!firstName || !lastName || !email || !phone || !city || !state || !zip) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    const lead = await prisma.lead.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        address: address || '',
        city,
        state,
        zip,
        propertyType: propertyType || 'single_family',
        propertyValue: body.propertyValue ? parseFloat(body.propertyValue) : null,
        squareFootage: body.squareFootage ? parseInt(body.squareFootage) : null,
        moveInDate: body.moveInDate ? new Date(body.moveInDate) : null,
        serviceInterest: serviceInterest || 'landscaping',
        leadSource: leadSource || 'website',
        leadScore: body.leadScore || 50,
        status: 'new',
        notes: body.notes || null,
      }
    })
    
    return NextResponse.json({ lead }, { status: 201 })
  } catch (error) {
    console.error('Error creating lead:', error)
    return NextResponse.json(
      { error: 'Failed to create lead' },
      { status: 500 }
    )
  }
}