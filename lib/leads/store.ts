import { create } from 'zustand'
import { type Lead } from '../types/lead'

interface LeadStore {
  selectedLead: Lead | null
  setSelectedLead: (lead: Lead | null) => void
}

export const useLeadStore = create<LeadStore>((set) => ({
  selectedLead: null,
  setSelectedLead: (lead) => set({ selectedLead: lead }),
}))