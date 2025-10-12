'use client'

import { useState, useMemo, useEffect } from 'react'
import LeadDetailModal from '../../../components/leads/LeadDetailModal'
import { showToast } from '@/lib/toast'

interface Lead {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  city: string
  state: string
  serviceInterest: string
  status: string
  leadScore: number
  tier: number
  contactCount: number
  campaign?: string | null
  propertyValue?: number | null
  createdAt: string
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(3)
  const [apiTotalPages, setApiTotalPages] = useState(1)
  const [tierFilter, setTierFilter] = useState<number | 'all'>('all')
  const [sortBy, setSortBy] = useState<'leadScore' | 'propertyValue' | 'tier'>('leadScore')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)

  // Fetch leads from API
  useEffect(() => {
    fetchLeads()
  }, [currentPage, itemsPerPage, searchQuery, statusFilter.join(','), tierFilter, sortBy, sortOrder])

  const fetchLeads = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(searchQuery && { search: searchQuery }),
        ...(statusFilter.length > 0 && { status: statusFilter.join(',') }),
        ...(tierFilter !== 'all' && { tier: String(tierFilter) }),
        sortBy,
        sortOrder
      })
      
      const response = await fetch(`/api/leads?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch leads')
      }
      const data = await response.json()
      setLeads(data.leads || [])
      // Update total pages from API response if available
      if (data.pagination?.totalPages) {
        setApiTotalPages(data.pagination.totalPages)
      }
    } catch (error) {
      console.error('Error fetching leads:', error)
      showToast.error('Failed to fetch leads')
    } finally {
      setLoading(false)
    }
  }

  const exportToCSV = () => {
    if (filteredLeads.length === 0) {
      showToast.error('No leads to export')
      return
    }

    const headers = ['Score', 'Tier', 'Name', 'Status', 'Campaign', 'Property Value']
    const rows = filteredLeads.map(lead => [
      lead.leadScore,
      lead.tier,
      `${lead.firstName} ${lead.lastName}`,
      `Contacted ${lead.contactCount || 0} times`,
      lead.campaign || '-',
      formatCurrency(lead.propertyValue)
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `leads-export-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    window.URL.revokeObjectURL(url)

    showToast.success(`Exported ${filteredLeads.length} leads`)
  }

  const filteredLeads = useMemo(() => {
    let filtered = leads

    // Apply status filter
    if (statusFilter.length > 0) {
      filtered = filtered.filter(lead => statusFilter.includes(lead.status))
    }

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(lead =>
        lead.firstName.toLowerCase().includes(query) ||
        lead.lastName.toLowerCase().includes(query) ||
        lead.email.toLowerCase().includes(query) ||
        lead.city.toLowerCase().includes(query) ||
        lead.phone.toLowerCase().includes(query)
      )
    }

    if (tierFilter !== 'all') {
      filtered = filtered.filter(lead => lead.tier === tierFilter)
    }

    return filtered
  }, [leads, searchQuery, statusFilter])

  // Paginated leads
  const paginatedLeads = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredLeads.slice(startIndex, endIndex)
  }, [filteredLeads, currentPage, itemsPerPage])

  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage)

  function formatCurrency(value?: number | null) {
    if (!value && value !== 0) return '-'
    const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', compactDisplay: 'short' })
    return formatter.format(value)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading leads...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-2rem)] gap-4">
      <aside className="w-64 bg-white rounded-lg shadow p-4 overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">Filters</h2>
        
        {/* Status Filters */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Status</h3>
          <div className="space-y-2">
            {['new', 'contacted', 'replied'].map(status => (
              <label key={status} className="flex items-center">
                <input
                  type="checkbox"
                  checked={statusFilter.includes(status)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setStatusFilter([...statusFilter, status])
                    } else {
                      setStatusFilter(statusFilter.filter(s => s !== status))
                    }
                    setCurrentPage(1)
                  }}
                  className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-gray-700 capitalize">{status}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Tier Filter */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Tier</h3>
          <select
            className="w-full border rounded-lg p-2 text-sm"
            value={tierFilter}
            onChange={(e) => {
              const v = e.target.value
              setTierFilter(v === 'all' ? 'all' : Number(v) as any)
              setCurrentPage(1)
            }}
          >
            <option value="all">All tiers</option>
            <option value="1">Tier 1</option>
            <option value="2">Tier 2</option>
            <option value="3">Tier 3</option>
          </select>
        </div>

        {/* Clear All Filters */}
        {statusFilter.length > 0 && (
          <button
            onClick={() => {
              setStatusFilter([])
              setCurrentPage(1)
              showToast.success('Filters cleared')
            }}
            className="w-full px-3 py-2 text-sm text-indigo-600 border border-indigo-600 rounded-lg hover:bg-indigo-50"
          >
            Clear All Filters
          </button>
        )}
      </aside>

      <main className="flex-1 bg-white rounded-lg shadow overflow-hidden flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold">
              {filteredLeads.length} {filteredLeads.length === 1 ? 'Lead' : 'Leads'}
              {searchQuery && ` (filtered from ${leads.length})`}
            </h1>
            <div className="flex gap-2">
              <button 
                onClick={exportToCSV}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Export CSV
              </button>
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                + New Lead
              </button>
            </div>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Search by name, city, or service..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <svg 
              className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('')
                  setCurrentPage(1)
                }}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Sort Controls */}
          <div className="flex items-center gap-3 mt-3">
            <select
              className="border rounded-lg text-sm p-2"
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value as any); setCurrentPage(1) }}
            >
              <option value="leadScore">Sort by: AI Score</option>
              <option value="propertyValue">Sort by: Property Value</option>
              <option value="tier">Sort by: Tier</option>
            </select>
            <select
              className="border rounded-lg text-sm p-2"
              value={sortOrder}
              onChange={(e) => { setSortOrder(e.target.value as any); setCurrentPage(1) }}
            >
              <option value="desc">Desc</option>
              <option value="asc">Asc</option>
            </select>
          </div>
        </div>

        {filteredLeads.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-md">
              <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No leads yet
              </h3>
              <p className="text-gray-500 mb-6">
                Get started by creating your first lead or importing leads from a CSV file.
              </p>
              <div className="flex gap-3 justify-center">
                <button className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">
                  + Create Your First Lead
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-auto flex-1">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">AI Score</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tier</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status (contacts)</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Campaign</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Property Value</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedLead(lead)}>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 font-semibold">
                          {lead.leadScore}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">T{lead.tier}</td>
                      <td className="px-4 py-3 text-sm font-medium">{lead.firstName} {lead.lastName}</td>
                      <td className="px-4 py-3 text-sm">Contacted {lead.contactCount || 0} times</td>
                      <td className="px-4 py-3 text-sm">{lead.campaign || '-'}</td>
                      <td className="px-4 py-3 text-sm">{formatCurrency(lead.propertyValue ?? null)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-4 py-3 flex items-center justify-between border-t">
              <div className="flex items-center gap-2">
                <select
                  className="border rounded-lg text-sm p-2"
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value))
                    setCurrentPage(1)
                  }}
                >
                  <option value={3}>3 per page</option>
                  <option value={5}>5 per page</option>
                  <option value={10}>10 per page</option>
                </select>
                <span className="text-sm text-gray-600">
                  Showing {filteredLeads.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredLeads.length)} of {filteredLeads.length}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const pageNum = i + 1
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1 rounded-lg text-sm ${
                          currentPage === pageNum
                            ? 'bg-indigo-50 text-indigo-600'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                  {totalPages > 5 && (
                    <>
                      <span className="px-2">...</span>
                      <button
                        onClick={() => setCurrentPage(totalPages)}
                        className="px-3 py-1 rounded-lg text-sm hover:bg-gray-50"
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
                </div>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </main>
      {selectedLead && (
        <LeadDetailModal
          lead={{
            id: selectedLead.id,
            firstName: selectedLead.firstName,
            lastName: selectedLead.lastName,
            email: selectedLead.email,
            phone: selectedLead.phone,
            address: '-',
            city: selectedLead.city,
            state: selectedLead.state,
            zip: '-',
            leadScore: selectedLead.leadScore,
            tier: selectedLead.tier,
            urgencyScore: undefined,
            propertyScore: undefined,
            financialScore: undefined,
            demographicScore: undefined,
            marketScore: undefined,
            urgencyReasons: undefined,
            campaign: selectedLead.campaign || null,
          }}
          onClose={() => setSelectedLead(null)}
        />
      )}
    </div>
  )
}