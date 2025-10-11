import { create } from 'zustand'
import { type LeadFilters, type FilterKey } from '../types/filters'
import { type LeadSort } from '../types/lead'

interface LeadFilterState {
  // Filter state
  filters: LeadFilters
  sort: LeadSort[]
  pageSize: number
  currentPage: number
  selectedLeads: Set<string>
  columnWidths: Record<string, number>
}

interface LeadFilterActions {
  setFilter: <K extends FilterKey>(key: K, value: LeadFilters[K]) => void
  clearFilter: (key: FilterKey) => void
  clearAllFilters: () => void
  setSort: (sorts: LeadSort[]) => void
  setPageSize: (size: number) => void
  setCurrentPage: (page: number) => void
  selectLead: (id: string) => void
  deselectLead: (id: string) => void
  selectAllLeads: (ids: string[]) => void
  clearSelectedLeads: () => void
  setColumnWidth: (column: string, width: number) => void
}

type LeadFilterStore = LeadFilterState & LeadFilterActions

// Default column widths
const defaultColumnWidths = {
  score: 60,
  tier: 50,
  name: 180,
  city: 120,
  predictedService: 160,
  status: 120,
  messagesSent: 100,
  lastActivity: 130,
  campaign: 100,
  actions: 80,
}

// Default filter values
const defaultFilters: LeadFilters = {
  search: '',
  scoreRange: [0, 100],
  tiers: ['T1', 'T2'],
  statuses: ['new', 'contacted', 'replied'],
  services: [],
  confirmedOnly: false,
  hasReplied: undefined,
  property: {
    priceRange: [0, 2000000],
    squareFeetRange: [0, 10000],
    lotSizeRange: [0, 5],
    bedrooms: [],
    bathrooms: []
  }
}

export const useLeadFilterStore = create<LeadFilterStore>((set) => ({
  // Initial state
  filters: defaultFilters,
  sort: [{ field: 'lastActivity', order: 'desc' }],
  pageSize: 50,
  currentPage: 1,
  selectedLeads: new Set<string>(),
  columnWidths: defaultColumnWidths,

  // Actions
  setFilter: <K extends FilterKey>(key: K, value: LeadFilters[K]) =>
    set((state: LeadFilterState) => ({
      filters: {
        ...state.filters,
        [key]: value,
      } as LeadFilters,
      currentPage: 1,
    })),

  clearFilter: (key: FilterKey) =>
    set((state: LeadFilterState) => ({
      filters: {
        ...state.filters,
        [key]: defaultFilters[key],
      } as LeadFilters,
      currentPage: 1,
    })),

  clearAllFilters: () =>
    set(() => ({
      filters: defaultFilters,
      currentPage: 1,
    })),

  setSort: (sorts: LeadSort[]) =>
    set(() => ({
      sort: sorts,
    })),

  setPageSize: (size: number) =>
    set(() => ({
      pageSize: size,
      currentPage: 1,
    })),

  setCurrentPage: (page: number) =>
    set(() => ({
      currentPage: page,
    })),

  selectLead: (id: string) =>
    set((state: LeadFilterState) => {
      const newSelected = new Set(state.selectedLeads)
      newSelected.add(id)
      return { selectedLeads: newSelected }
    }),

  deselectLead: (id: string) =>
    set((state: LeadFilterState) => {
      const newSelected = new Set(state.selectedLeads)
      newSelected.delete(id)
      return { selectedLeads: newSelected }
    }),

  selectAllLeads: (ids: string[]) =>
    set(() => ({
      selectedLeads: new Set(ids),
    })),

  clearSelectedLeads: () =>
    set(() => ({
      selectedLeads: new Set<string>(),
    })),

  setColumnWidth: (column: string, width: number) =>
    set((state: LeadFilterState) => ({
      columnWidths: {
        ...state.columnWidths,
        [column]: width,
      },
    })),
}))

// Quick filter presets
export const quickFilters = {
  highPriority: {
    scoreRange: [70, 100],
  },
  needsAttention: {
    scoreRange: [0, 49],
  },
  unreadReplies: {
    hasUnreadReply: true,
  },
  noCampaign: {
    campaigns: [],
  },
  tier1Only: {
    tiers: ['T1'],
  },
}

// Keyboard shortcuts
export const shortcuts = {
  focusSearch: 'mod+k',
  importLeads: 'mod+i',
  export: 'mod+e',
  navigateUp: 'up',
  navigateDown: 'down',
  openDetail: 'enter',
  closePanel: 'escape',
}