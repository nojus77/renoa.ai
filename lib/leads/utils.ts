import { type Lead } from '../types/lead'
import { ServiceCategory } from '@prisma/client'

// Format a number between 0-100 as a color from red to green
// Color formatting utilities
export function getScoreColor(score: number): { color: string; background: string } {
  if (score <= 30) {
    return { color: '#dc2626', background: '#fee2e2' }
  } else if (score <= 50) {
    return { color: '#ea580c', background: '#ffedd5' }
  } else if (score <= 70) {
    return { color: '#ca8a04', background: '#fef9c3' }
  } else if (score <= 90) {
    return { color: '#65a30d', background: '#ecfccb' }
  } else {
    return { color: '#16a34a', background: '#dcfce7' }
  }
}

export function getTierColor(tier: string): { color: string; background: string } {
  switch (tier) {
    case 'T1':
      return { color: '#16a34a', background: '#dcfce7' }
    case 'T2':
      return { color: '#0891b2', background: '#cffafe' }
    case 'T3':
      return { color: '#6366f1', background: '#e0e7ff' }
    default:
      return { color: '#64748b', background: '#f1f5f9' }
  }
}

export function getStatusColor(status: string): { color: string; background: string } {
  switch (status.toLowerCase()) {
    case 'new':
      return { color: '#6366f1', background: '#e0e7ff' }
    case 'contacted':
      return { color: '#0891b2', background: '#cffafe' }
    case 'replied':
      return { color: '#16a34a', background: '#dcfce7' }
    case 'matched':
      return { color: '#ca8a04', background: '#fef9c3' }
    case 'converted':
      return { color: '#16a34a', background: '#dcfce7' }
    case 'unqualified':
      return { color: '#dc2626', background: '#fee2e2' }
    default:
      return { color: '#64748b', background: '#f1f5f9' }
  }
}

export function formatServicePrediction(service: any): { display: string; color: string } {
  if (!service) return { display: 'Unknown', color: '#64748b' }
  
  return {
    display: service.confirmed || service.predicted || 'Unknown',
    color: service.confirmed ? '#16a34a' : '#0891b2'
  }
}

export function formatLeadScore(score: number): { color: string; background: string } {
  return getScoreColor(score)
}

// Format status
export function formatStatus(status: string): { color: string; background: string; display: string } {
  switch (status.toLowerCase()) {
    case 'new':
      return { color: '#6366f1', background: '#e0e7ff', display: 'New' }
    case 'contacted':
      return { color: '#0891b2', background: '#cffafe', display: 'Contacted' }
    case 'replied':
      return { color: '#16a34a', background: '#dcfce7', display: 'Replied' }
    case 'matched':
      return { color: '#ca8a04', background: '#fef9c3', display: 'Matched' }
    case 'closed':
      return { color: '#64748b', background: '#f1f5f9', display: 'Closed' }
    default:
      return { color: '#64748b', background: '#f1f5f9', display: status }
  }
}

// Format service category with color and display name
export function formatServiceInterest(service: string): { color: string; background: string; display: string } {
  switch (service.toLowerCase()) {
    case 'landscaping':
      return { color: '#059669', background: '#d1fae5', display: 'Landscaping' }
    case 'remodeling':
      return { color: '#0891b2', background: '#cffafe', display: 'Remodeling' }
    case 'roofing':
      return { color: '#9333ea', background: '#f3e8ff', display: 'Roofing' }
    case 'fencing':
      return { color: '#b91c1c', background: '#fee2e2', display: 'Fencing' }
    case 'hvac':
      return { color: '#0284c7', background: '#e0f2fe', display: 'HVAC' }
    case 'plumbing':
      return { color: '#4f46e5', background: '#e0e7ff', display: 'Plumbing' }
    case 'painting':
      return { color: '#ea580c', background: '#ffedd5', display: 'Painting' }
    case 'flooring':
      return { color: '#be123c', background: '#ffe4e6', display: 'Flooring' }
    default:
      return { color: '#64748b', background: '#f1f5f9', display: service }
  }
}

// Format currency
export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return 'N/A'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(value)
}

// Format relative time
export function formatRelativeTime(date: Date | string | null): string {
  if (!date) return 'Never'
  const now = new Date()
  const then = new Date(date)
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000)
  
  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  return `${Math.floor(diffInSeconds / 86400)}d ago`
}

// Convert database lead to frontend lead type
export function transformDatabaseLead(dbLead: any): Lead {
  // Required fields
  const lead: Lead = {
    // Basic info
    id: dbLead.id,
    firstName: dbLead.firstName,
    lastName: dbLead.lastName,
    email: dbLead.email,
    phone: dbLead.phone,
    address: dbLead.address,
    city: dbLead.city,
    state: dbLead.state,
    zip: dbLead.zip,
    // Property details
    propertyType: dbLead.propertyType,
    propertyValue: dbLead.propertyValue,
    squareFootage: dbLead.squareFootage,
    moveInDate: dbLead.moveInDate,
    // Service and source
    serviceInterest: dbLead.serviceInterest,
    leadSource: dbLead.leadSource,
    status: dbLead.status,
    // Scoring
    score: {
      overall: dbLead.leadScore,
      urgency: dbLead.urgencyScore,
      propertyValue: dbLead.propertyValue ?? 0
    },
    tier: dbLead.tier,
    // Service details
    predictedService: dbLead.predictedService as ServiceCategory | undefined,
    confirmedService: dbLead.confirmedService as ServiceCategory | undefined,
    // Property struct
    property: {
      type: dbLead.propertyType,
      value: dbLead.propertyValue,
      squareFootage: dbLead.squareFootage,
      bedrooms: dbLead.bedrooms ? [dbLead.bedrooms] : undefined,
      bathrooms: dbLead.bathrooms ? [dbLead.bathrooms] : undefined,
      lotSize: dbLead.lotSize,
      age: dbLead.propertyAge
    },
    // Campaign and activity
    campaign: dbLead.campaign ? {
      id: dbLead.campaign.id,
      code: dbLead.campaign.name.substring(0, 6),
      replyRate: dbLead.campaign.repliedCount / dbLead.campaign.totalLeads
    } : undefined,
    lastActivityAt: dbLead.lastActivityAt || dbLead.updatedAt,
    messagesSent: dbLead.messages?.length || 0,
    hasNotes: Boolean(dbLead.notes?.length),
    isPriority: Boolean(dbLead.isPriority),
    hasUnreadReply: Boolean(dbLead.hasUnreadReply),
    serviceChanged: dbLead.confirmedService !== undefined && dbLead.confirmedService !== dbLead.predictedService,
    // Notes
    notes: Array.isArray(dbLead.notes) ? dbLead.notes.map((n: any) => n.content) : null,
    // Metadata
    aiTool1Metadata: dbLead.aiTool1Metadata || {},
    // Related entities
    messages: dbLead.messages,
    engagementMetrics: dbLead.engagementMetrics,
    matches: dbLead.matches,
    // Timestamps
    createdAt: dbLead.createdAt,
    updatedAt: dbLead.updatedAt
  }

  return lead
}

// Build Prisma query filters from frontend filters
export function buildPrismaFilters(filters: any) {
  const where: any = {}

  if (filters.search) {
    where.OR = [
      { firstName: { contains: filters.search, mode: 'insensitive' } },
      { lastName: { contains: filters.search, mode: 'insensitive' } },
      { email: { contains: filters.search, mode: 'insensitive' } },
      { phone: { contains: filters.search } },
      { address: { contains: filters.search, mode: 'insensitive' } }
    ]
  }

  if (filters.scoreRange) {
    where.leadScore = {
      gte: filters.scoreRange[0],
      lte: filters.scoreRange[1]
    }
  }

  if (filters.tiers?.length) {
    where.tier = { in: filters.tiers }
  }

  if (filters.statuses?.length) {
    where.status = { in: filters.statuses }
  }

  if (filters.services?.length) {
    if (filters.confirmedOnly) {
      where.confirmedService = { in: filters.services }
    } else {
      where.OR = [
        { predictedService: { in: filters.services } },
        { confirmedService: { in: filters.services } }
      ]
    }
  }

  if (filters.campaigns?.length) {
    where.campaignId = { in: filters.campaigns }
  }

  if (filters.hasReplied !== undefined) {
    where.messages = {
      some: {
        engagementMetrics: {
          some: {
            replied: filters.hasReplied
          }
        }
      }
    }
  }

  if (filters.dateRange?.added) {
    where.createdAt = {
      gte: filters.dateRange.added[0],
      lte: filters.dateRange.added[1]
    }
  }

  if (filters.dateRange?.lastActivity) {
    where.lastActivityAt = {
      gte: filters.dateRange.lastActivity[0],
      lte: filters.dateRange.lastActivity[1]
    }
  }

  if (filters.property) {
    if (filters.property.priceRange) {
      where.propertyValue = {
        gte: filters.property.priceRange[0],
        lte: filters.property.priceRange[1]
      }
    }

    if (filters.property.squareFeetRange) {
      where.squareFootage = {
        gte: filters.property.squareFeetRange[0],
        lte: filters.property.squareFeetRange[1]
      }
    }

    if (filters.property.bedrooms?.length) {
      where.bedrooms = { in: filters.property.bedrooms }
    }

    if (filters.property.bathrooms?.length) {
      where.bathrooms = { in: filters.property.bathrooms }
    }

    if (filters.property.lotSizeRange) {
      where.lotSize = {
        gte: filters.property.lotSizeRange[0],
        lte: filters.property.lotSizeRange[1]
      }
    }
  }

  return where
}