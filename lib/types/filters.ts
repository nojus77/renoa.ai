import { type ServiceCategory, type LeadStatus } from '@prisma/client'
import { type LeadTier } from './lead'

export interface LeadFilters {
  search?: string
  scoreRange?: [number, number]
  tiers?: LeadTier[]
  statuses?: LeadStatus[]
  services?: ServiceCategory[]
  confirmedOnly?: boolean
  hasReplied?: boolean
  property?: {
    priceRange?: [number, number]
    squareFeetRange?: [number, number]
    lotSizeRange?: [number, number]
    bedrooms?: number[]
    bathrooms?: number[]
  }
}

export type FilterKey = keyof LeadFilters
export type PropertyFilterKey = keyof Required<LeadFilters>['property']