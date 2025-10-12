"use client"

import { type Lead, type LeadSort } from '@/lib/types/lead'
import { useState, useCallback, useMemo } from 'react'
import { useLeadFilterStore } from '@/lib/leads/filters'
import { useLeadStore } from '@/lib/leads/store'
import LeadRow from './LeadRow'
import ExpandedRow from './ExpandedRow'
import DetailPanel from './DetailPanel'

interface LeadTableProps {
  initialData: {
    leads: Lead[]
    total: number
  }
  onUpdate?: (lead: Lead) => void
}

interface LoadingRowProps {
  columns: number
}

function LoadingRow({ columns }: LoadingRowProps) {
  return (
    <tr>
      <td colSpan={columns} className="px-4 py-3">
        <div className="flex items-center space-x-4">
          <div className="h-4 w-4 bg-gray-200 animate-pulse rounded" />
          <div className="h-8 w-8 bg-gray-200 animate-pulse rounded" />
          <div className="h-6 w-20 bg-gray-200 animate-pulse rounded" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 bg-gray-200 animate-pulse rounded" />
            <div className="h-4 w-1/2 bg-gray-200 animate-pulse rounded" />
          </div>
        </div>
      </td>
    </tr>
  )
}

const columnHeaders = [
  { key: 'score', label: 'Score', width: 60 },
  { key: 'tier', label: 'Tier', width: 50 },
  { key: 'name', label: 'Name', width: 180 },
  { key: 'city', label: 'City', width: 120 },
  { key: 'predictedService', label: 'Service', width: 160 },
  { key: 'status', label: 'Status', width: 120 },
  { key: 'messagesSent', label: 'Messages', width: 100 },
  { key: 'lastActivity', label: 'Last Activity', width: 130 },
  { key: 'campaign', label: 'Campaign', width: 100 },
  { key: 'actions', label: '', width: 80 }
] as const
export default function LeadTable({ initialData, onUpdate }: LeadTableProps) {
  // Local state
  const [showDetailPanel, setShowDetailPanel] = useState(false)
  
  // Store state and actions with minimal subscriptions to prevent re-renders
  const selectedLeads = useLeadFilterStore(useCallback((state) => state.selectedLeads, []))
  const setSort = useLeadFilterStore(useCallback((state) => state.setSort, []))
  const selectLead = useLeadFilterStore(useCallback((state) => state.selectLead, []))
  const selectAllLeads = useLeadFilterStore(useCallback((state) => state.selectAllLeads, []))
  const clearSelectedLeads = useLeadFilterStore(useCallback((state) => state.clearSelectedLeads, []))

  const selectedLead = useLeadStore(useCallback((state) => state.selectedLead, []))
  const setSelectedLead = useLeadStore(useCallback((state) => state.setSelectedLead, []))

  // Memoized derived data
  const updatedLeads = useMemo(() => {
return initialData.leads.map((lead: Lead) => ({      ...lead,
      isSelected: selectedLeads.has(lead.id)
    }))
  }, [initialData.leads, selectedLeads])
  // Memoized handlers
  const handleSelect = useCallback((id: string) => {
    selectLead(id)
  }, [selectLead])

  const handleViewDetails = useCallback((lead: Lead) => {
    setSelectedLead(lead)
    setShowDetailPanel(true)
  }, [setSelectedLead])

  const handleCloseDetails = useCallback(() => {
    setShowDetailPanel(false)
    setSelectedLead(null)
  }, [setSelectedLead])

  const handleUpdateLead = useCallback((updatedLead: Lead) => {
    // Just update the selected lead in the store
    // The parent component should handle updating the data
    setSelectedLead(updatedLead)
    // Notify parent of the update
    onUpdate?.(updatedLead)
  }, [setSelectedLead, onUpdate])

  const handleColumnSort = useCallback((field: LeadSort['field']) => {
    setSort([{ field, order: 'desc' }])
  }, [setSort])

  const handleSelectAll = useCallback(() => {
    if (selectedLeads.size === initialData.leads.length) {
      clearSelectedLeads()
    } else {
      selectAllLeads(initialData.leads.map((lead: Lead) => lead.id))
    }
  }, [initialData.leads, selectedLeads.size, clearSelectedLeads, selectAllLeads])



  return (
    <div className="flex flex-col h-full">
      {/* Top Bar */}
      <div className="p-4 flex items-center justify-between border-b">
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">
            {selectedLeads.size ? `${selectedLeads.size} selected` : `${initialData.total} total leads`}
          </span>

          {/* Active Filters */}
          {/* TODO: Show active filter chips */}
        </div>

        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Quick search..."
              className="w-64 pl-10 pr-4 py-2 border rounded-lg text-sm"
            />
            <svg className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Action Buttons */}
          <button className="px-4 py-2 border rounded-lg text-sm bg-white hover:bg-gray-50">
            Export CSV
          </button>
          <button className="px-4 py-2 border rounded-lg text-sm text-white bg-indigo-600 hover:bg-indigo-700">
            + New Lead
          </button>

          {/* Bulk Actions (when leads are selected) */}
          {selectedLeads.size > 0 && (
            <div className="flex items-center space-x-2">
              <button className="px-3 py-1.5 text-sm text-gray-700 hover:text-gray-900">
                Assign to Campaign
              </button>
              <button className="px-3 py-1.5 text-sm text-gray-700 hover:text-gray-900">
                Change Status
              </button>
              <button className="px-3 py-1.5 text-sm text-gray-700 hover:text-gray-900">
                Mark Priority
              </button>
              <button className="px-3 py-1.5 text-sm text-gray-700 hover:text-gray-900">
                Delete Selected
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              {/* Select All Checkbox */}
              <th className="w-4 px-4 py-3">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  checked={selectedLeads.size === initialData.leads.length}
                  onChange={handleSelectAll}
                />
              </th>

              {/* Column Headers */}
              {columnHeaders.map(({ key, label, width }) => (
                <th
                  key={key}
                  className={`w-[${width}px] px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none`}
                  onClick={() => handleColumnSort(key as LeadSort['field'])}
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
            {updatedLeads.map((lead) => (
              <LeadRow
                key={lead.id}
                lead={lead}
                isSelected={lead.isSelected}
                onSelect={handleSelect}
                onViewDetails={handleViewDetails}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-4 py-3 flex items-center justify-between border-t">
        <div className="flex items-center gap-2">
          <select
            className="border rounded-lg text-sm p-2"
            value={50}
            onChange={(e) => {
              // TODO: Update page size
            }}
          >
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
            <option value={200}>200 per page</option>
          </select>
          <span className="text-sm text-gray-600">
            Showing 1-50 of {initialData.total}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="px-3 py-1 border rounded-lg text-sm disabled:opacity-50"
            disabled
          >
            Previous
          </button>
          <div className="flex items-center gap-1">
            <button className="px-3 py-1 rounded-lg text-sm bg-indigo-50 text-indigo-600">
              1
            </button>
            <button className="px-3 py-1 rounded-lg text-sm hover:bg-gray-50">
              2
            </button>
            <span className="px-2">...</span>
            <button className="px-3 py-1 rounded-lg text-sm hover:bg-gray-50">
              10
            </button>
          </div>
          <button className="px-3 py-1 border rounded-lg text-sm hover:bg-gray-50">
            Next
          </button>
        </div>
      </div>

      {/* Detail Panel */}
      {showDetailPanel && selectedLead && (
        <div className="fixed inset-y-0 right-0 w-[600px] bg-white border-l shadow-xl">
          <DetailPanel 
            lead={selectedLead}
            onClose={handleCloseDetails}
            onSave={handleUpdateLead}
          />
        </div>
      )}
    </div>
  )
}
