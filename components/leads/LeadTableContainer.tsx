'use client'

import { useState, useCallback } from 'react'
import { type Lead } from '@/lib/types/lead'
import LeadTable from './LeadTable'

interface LeadTableContainerProps {
  initialData: {
    leads: Lead[]
    total: number
  }
}

export default function LeadTableContainer({ initialData }: LeadTableContainerProps) {
  const [leads, setLeads] = useState(initialData.leads)

  const handleLeadUpdate = useCallback((updatedLead: Lead) => {
    // Update UI optimistically
    setLeads(currentLeads => 
      currentLeads.map(lead => 
        lead.id === updatedLead.id ? updatedLead : lead
      )
    )
    
    // The API route will handle server-side updates and revalidation
  }, [])

  return (
    <LeadTable 
      initialData={{ ...initialData, leads }}
      onUpdate={handleLeadUpdate}
    />
  )
}