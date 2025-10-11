/**
 * Shared TypeScript types and interfaces for Renoa.ai
 */

// Re-export Prisma types for convenience
export type {
  User,
  Lead,
  Campaign,
  Message,
  EngagementMetric,
  ServiceProvider,
  Match,
  MessageTemplate,
  AIOptimization,
} from "@prisma/client";

// Campaign filters
export interface CampaignFilters {
  serviceType?: string;
  location?: {
    city?: string;
    state?: string;
    zip?: string;
  };
  moveInDateRange?: {
    start: Date;
    end: Date;
  };
  propertyType?: string;
  leadScore?: {
    min: number;
    max: number;
  };
}

// Message personalization variables
export interface MessageVariables {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  service: string;
  moveInDate?: string;
  [key: string]: string | undefined;
}

// Campaign metrics
export interface CampaignMetrics {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  replied: number;
  converted: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  replyRate: number;
  conversionRate: number;
}

// Provider matching criteria
export interface MatchingCriteria {
  serviceCategory: string;
  location: {
    zip: string;
    city: string;
    state: string;
  };
  priceRange?: string;
  specializations?: string[];
  minRating?: number;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Pagination
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

