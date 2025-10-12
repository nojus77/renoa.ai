import {
  Lead as PrismaLead,
  ServiceCategory,
  PropertyType,
  LeadStatus,
  Message,
  MessageType,
  MessageStatus,
  EngagementMetric,
  Match,
  Campaign,
  Prisma
} from '@prisma/client'

// Re-export useful enums
export { ServiceCategory, PropertyType, LeadStatus, MessageType, MessageStatus }

// Re-export LeadTier type
export type LeadTier = 'T1' | 'T2' | 'T3'

// Score interface for better organization
export interface LeadScore {
  overall: number
  urgency: number
  propertyValue: number
}

// Property interface for better organization
export interface LeadProperty {
  type: PropertyType
  value: number | null
  squareFootage: number | null
  age: number | null
  bedrooms?: number[]
  bathrooms?: number[]
  lotSize?: number
}

// Campaign summary type for leads
export interface LeadCampaign {
  id: string
  code: string
  replyRate: number
}

// Activity and metadata interface
export interface LeadMetadata {
  lastActivityAt: Date
  messagesSent: number
  hasNotes: boolean
  isPriority: boolean
  hasUnreadReply: boolean
  serviceChanged: boolean
}

// Base type for Lead entity with proper JSON handling
export type Lead = {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  zip: string
  // Property details
  propertyType: PropertyType
  propertyValue: number | null
  squareFootage: number | null
  moveInDate: Date | null
  // Service details
  serviceInterest: ServiceCategory
  confirmedService?: ServiceCategory
  predictedService?: ServiceCategory
  // Scoring and tier
  score: LeadScore
  tier: number | LeadTier
  // Lead source and status
  leadSource: string
  status: LeadStatus
  // Metadata
  aiTool1Metadata: Prisma.JsonValue
  // Campaign and activity tracking
  campaign?: LeadCampaign | string | null
  contactCount?: number
  lastActivityAt?: Date
  messagesSent: number
  hasNotes: boolean
  isPriority: boolean
  hasUnreadReply: boolean
  serviceChanged: boolean
  notes: string[] | null
  // Property details in structured format
  property: LeadProperty
  // Include related entities
  messages?: Message[]
  engagementMetrics?: EngagementMetric[]
  matches?: Match[]
  // Timestamps
  createdAt: Date
  updatedAt: Date
}

// Type for updating a lead (used in API)
export type LeadUpdate = Partial<
  Pick<Lead, 
    | 'firstName'
    | 'lastName'
    | 'email'
    | 'phone'
    | 'address'
    | 'city'
    | 'state'
    | 'zip'
    | 'propertyType'
    | 'propertyValue'
    | 'squareFootage'
    | 'moveInDate'
    | 'serviceInterest'
    | 'leadSource'
    | 'status'
    | 'notes'
    | 'aiTool1Metadata'
    | 'score'
    | 'tier'
    | 'campaign'
    | 'contactCount'
  >
>

// Type for lead list filtering
export type LeadFilter = {
  search?: string
  scoreRange?: [number, number]
  tiers?: LeadTier[]
  statuses?: LeadStatus[]
  services?: ServiceCategory[]
  confirmedOnly?: boolean
  hasReplied?: boolean
  leadSources?: string[]
  dateRange?: {
    createdAt?: [Date, Date]
    updatedAt?: [Date, Date]
  }
  property?: {
    types?: PropertyType[]
    priceRange?: [number, number]
    squareFeetRange?: [number, number]
    lotSizeRange?: [number, number]
    bedrooms?: number[]
    bathrooms?: number[]
  }
}

// Type for lead sorting
export type LeadSortField = 
  | 'score'
  | 'firstName'
  | 'lastName'
  | 'email'
  | 'city'
  | 'serviceInterest'
  | 'status'
  | 'lastActivity'
  | 'createdAt'
  | 'updatedAt'

export type LeadSortOrder = 'asc' | 'desc'

export type LeadSort = {
  field: LeadSortField
  order: LeadSortOrder
}