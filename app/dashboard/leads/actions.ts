'use server'

import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'
import { type Lead } from '@/lib/types/lead'
import { buildPrismaFilters, transformDatabaseLead } from '@/lib/leads/utils'

export async function updateLead(leadId: string, data: Partial<Lead>) {
  try {
    const { messages, engagementMetrics, matches, ...updateData } = data
    const updated = await prisma.lead.update({
      where: { id: leadId },
      data: updateData as Prisma.LeadUpdateInput,
      include: {
        messages: {
          include: {
            engagementMetrics: true
          }
        }
      }
    })
    
    return transformDatabaseLead(updated)
  } catch (error) {
    console.error('Error updating lead:', error)
    throw error
  }
}

export async function getInitialLeads(filter = {}, sort: Array<{ field: string, order: 'asc' | 'desc' }> = [{ field: 'lastActivity', order: 'desc' }]) {
  try {
    const where = buildPrismaFilters(filter)
    
    // Map our sort fields to valid Prisma orderBy configuration
    const orderBy = sort.map(({ field, order }) => {
      const sortOrder = order === 'desc' ? Prisma.SortOrder.desc : Prisma.SortOrder.asc
      
      switch (field) {
        case 'name':
          return {
            firstName: sortOrder,
          }
        case 'predictedService':
          return {
            predictedService: sortOrder
          }
        case 'lastActivity':
          return {
            lastActivityAt: sortOrder
          }
        case 'score':
          return {
            leadScore: sortOrder
          }
        default:
          return { [field]: sortOrder }
      }
    })[0] // Use only first sort for now, implement multi-sort later

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        orderBy,
        take: 50,
        include: {
          messages: {
            include: {
              engagementMetrics: true
            }
          }
        }
      }),
      prisma.lead.count({ where })
    ])

    return {
      leads: leads.map(transformDatabaseLead),
      total
    }
  } catch (error) {
    console.error('Error fetching leads:', error)
    return {
      leads: [],
      total: 0
    }
  }
}