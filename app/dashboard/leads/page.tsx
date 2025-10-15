'use client'

import { useState, useEffect } from 'react'
import { ServiceCategory, LeadStatus } from '@prisma/client'
import { showToast } from '@/lib/toast'
import { Download, Plus, SlidersHorizontal } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface Lead {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string | null
  city: string
  state: string
  address?: string | null
  zip?: string | null
  serviceInterest: ServiceCategory
  status: LeadStatus
  leadScore: number
  tier: number
  contactCount: number
  campaign?: string | null
  updatedAt: string
  createdAt?: string
  lastContactedAt?: string | null
  urgencyScore?: number | null
  propertyScore?: number | null
  scoringReason?: string | null
}

interface Filters {
  search: string
  scoreMin: number
  scoreMax: number
  tiers: number[]
  statuses: LeadStatus[]
  service: ServiceCategory | 'all'
  campaign: string | 'all'
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [sortBy, setSortBy] = useState<'leadScore' | 'tier' | 'createdAt'>('leadScore')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const pageSize = 50
  
  const [filters, setFilters] = useState<Filters>({
    search: '',
    scoreMin: 0,
    scoreMax: 100,
    tiers: [],
    statuses: [],
    service: 'all',
    campaign: 'all',
  })

  useEffect(() => {
    fetchLeads()
  }, [currentPage, sortBy, sortOrder, filters])

  const fetchLeads = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: String(pageSize),
        sortBy,
        sortOrder,
        ...(filters.search && { search: filters.search }),
        ...(filters.statuses.length > 0 && { status: filters.statuses.join(',') }),
        ...(filters.tiers.length > 0 && { tier: filters.tiers.join(',') }),
        ...(filters.service !== 'all' && { serviceInterest: filters.service }),
      })
      
      const response = await fetch(`/api/leads?${params.toString()}`)
      const data = await response.json()
      setLeads(data.leads || [])
      setTotalPages(data.pagination?.totalPages || 1)
      setTotalCount(data.pagination?.total || 0)
    } catch (error) {
      showToast.error('Failed to fetch leads')
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    if (score >= 50) return 'bg-amber-50 text-amber-700 border-amber-200'
    return 'bg-rose-50 text-rose-700 border-rose-200'
  }

  const getTierBadge = (tier: number) => {
    const styles = {
      1: 'bg-slate-100 text-slate-600 border border-slate-200',
      2: 'bg-slate-100 text-slate-600 border border-slate-200',
      3: 'bg-slate-50 text-slate-600 border border-slate-200',
    }
    return styles[tier as 1 | 2 | 3] ?? styles[3]
  }

  const exportToCSV = () => {
    if (!leads?.length) {
      showToast?.error?.('No leads to export')
      return
    }
    const headers = ['Score','Tier','Name','Email','City','State','Service','Status','Campaign','Updated']
    const rows = leads.map(l => [
      l.leadScore,
      `T${l.tier}`,
      `${l.firstName} ${l.lastName}`,
      l.email,
      l.city,
      l.state,
      String(l.serviceInterest),
      String(l.status),
      l.campaign ?? '-',
      new Date(l.updatedAt).toLocaleString()
    ])
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${String(v).replaceAll('"','""')}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `leads-${new Date().toISOString().slice(0,10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const stats = {
    total: totalCount,
    highPriority: leads.filter(l => l.leadScore >= 70).length,
    contacted: leads.filter(l => l.contactCount > 0).length,
    replied: leads.filter(l => l.status === 'replied').length,
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sheet-style Filters */}
      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetTrigger asChild>
          <button className="sr-only" aria-hidden />
        </SheetTrigger>
        <SheetContent side="left" className="p-3 w-60">
          <SheetHeader className="mb-2">
            <SheetTitle className="text-sm font-semibold flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
              Filters
            </SheetTitle>
          </SheetHeader>

          {/* Search */}
          <div className="mb-3">
            <input
              type="text"
              placeholder="Search..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full px-3 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Score Range */}
          <div className="mb-3">
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Score: {filters.scoreMin}-{filters.scoreMax}</label>
            <div className="flex gap-2">
              <input type="number" value={filters.scoreMin} onChange={(e) => setFilters({ ...filters, scoreMin: parseInt(e.target.value) })} className="w-16 px-2 py-1 text-xs border border-border rounded-md" />
              <input type="number" value={filters.scoreMax} onChange={(e) => setFilters({ ...filters, scoreMax: parseInt(e.target.value) })} className="w-16 px-2 py-1 text-xs border border-border rounded-md" />
            </div>
          </div>

          {/* Tier */}
          <div className="mb-3">
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Tier</label>
            {[1, 2, 3].map(tier => (
              <label key={tier} className="flex items-center text-xs mb-1">
                <input type="checkbox" checked={filters.tiers.includes(tier)} onChange={() => {
                  setFilters({
                    ...filters,
                    tiers: filters.tiers.includes(tier)
                      ? filters.tiers.filter(t => t !== tier)
                      : [...filters.tiers, tier],
                  })
                }} className="mr-2 scale-90" />
                Tier {tier}
              </label>
            ))}
          </div>

          {/* Status */}
          <div className="mb-3">
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Status</label>
            {['new', 'contacted', 'replied'].map(status => (
              <label key={status} className="flex items-center text-xs mb-1 capitalize">
                <input type="checkbox" className="mr-2 scale-90" />
                {status}
              </label>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-card border-b border-border px-4 py-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setFiltersOpen(true)}
                className="flex items-center gap-2 px-2.5 py-1.5 text-sm border border-border rounded-md hover:bg-muted/50 transition-colors"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span className="text-xs">Filters</span>
              </button>
              <div>
                <h1 className="text-lg font-semibold">Leads</h1>
                <p className="text-xs text-muted-foreground">{totalCount} total leads</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-3 py-1.5 text-sm border border-border rounded-md hover:bg-muted/50 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
              <button className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                <Plus className="w-4 h-4" />
                New Lead
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards - COMPACT */}
        <div className="px-4 py-2.5 bg-card border-b border-border">
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-card border border-border rounded-md p-2">
              <p className="text-xs text-muted-foreground mb-0.5">Total Leads</p>
              <p className="text-xl font-medium">{stats.total}</p>
            </div>
            <div className="bg-card border border-border rounded-md p-2">
              <p className="text-xs text-muted-foreground mb-0.5">High Priority</p>
              <p className="text-xl font-medium text-emerald-600">{stats.highPriority}</p>
            </div>
            <div className="bg-card border border-border rounded-md p-2">
              <p className="text-xs text-muted-foreground mb-0.5">Contacted</p>
              <p className="text-xl font-medium text-blue-600">{stats.contacted}</p>
            </div>
            <div className="bg-card border border-border rounded-md p-2">
              <p className="text-xs text-muted-foreground mb-0.5">Replied</p>
              <p className="text-xl font-medium text-violet-600">{stats.replied}</p>
            </div>
          </div>
        </div>

        {/* Table - COMPACT */}
        <div className="flex-1 overflow-auto bg-background">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border sticky top-0">
              <tr>
                <th className="px-4 py-1.5 text-left text-xs font-medium text-muted-foreground uppercase">Score</th>
                <th className="px-4 py-1.5 text-left text-xs font-medium text-muted-foreground uppercase">Tier</th>
                <th className="px-4 py-1.5 text-left text-xs font-medium text-muted-foreground uppercase">Name</th>
                <th className="px-4 py-1.5 text-left text-xs font-medium text-muted-foreground uppercase">Email</th>
                <th className="px-4 py-1.5 text-left text-xs font-medium text-muted-foreground uppercase">Location</th>
                <th className="px-4 py-1.5 text-left text-xs font-medium text-muted-foreground uppercase">Service</th>
                <th className="px-4 py-1.5 text-left text-xs font-medium text-muted-foreground uppercase">Campaign</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {leads.map((lead) => (
                <tr key={lead.id} onClick={() => setSelectedLead(lead)} className="hover:bg-muted/50 cursor-pointer transition-colors">
                  <td className="px-4 py-1.5 text-sm">
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-medium border ${getScoreColor(lead.leadScore)}`}>
                      {lead.leadScore}
                    </span>
                  </td>
                  <td className="px-4 py-1.5 text-sm">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getTierBadge(lead.tier)}`}>
                      T{lead.tier}
                    </span>
                  </td>
                  <td className="px-4 py-1.5 text-sm font-medium text-foreground">{lead.firstName} {lead.lastName}</td>
                  <td className="px-4 py-1.5 text-sm text-muted-foreground">{lead.email}</td>
                  <td className="px-4 py-1.5 text-sm text-muted-foreground">{lead.city}, {lead.state}</td>
                  <td className="px-4 py-1.5 text-sm text-muted-foreground capitalize">{String(lead.serviceInterest)}</td>
                  <td className="px-4 py-1.5 text-sm text-muted-foreground">{lead.campaign || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Lead Detail Dialog */}
        <Dialog open={!!selectedLead} onOpenChange={(open) => !open && setSelectedLead(null)}>
          <DialogContent>
            {selectedLead && (
              <div className="space-y-4">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3">
                    <span className="text-lg font-semibold">{selectedLead.firstName} {selectedLead.lastName}</span>
                    <span className={`inline-flex items-center justify-center h-7 px-2 rounded-full text-xs font-medium border ${getTierBadge(selectedLead.tier)}`}>
                      T{selectedLead.tier}
                    </span>
                  </DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-1">
                    <label className="text-xs text-muted-foreground">Lead Score</label>
                    <div className="mt-1">
                      <span className={`inline-flex items-center justify-center w-9 h-9 rounded-full text-sm font-semibold border ${getScoreColor(selectedLead.leadScore)}`}>
                        {selectedLead.leadScore}
                      </span>
                    </div>
                  </div>
                  <div className="sm:col-span-2 grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-muted-foreground">Email</label>
                      <p className="text-sm text-foreground mt-1">{selectedLead.email}</p>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Phone</label>
                      <p className="text-sm text-foreground mt-1">{selectedLead.phone || '-'}</p>
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs text-muted-foreground">Address</label>
                      <p className="text-sm text-foreground mt-1">
                        {selectedLead.address || '-'}{selectedLead.address ? ', ' : ''}{selectedLead.city}, {selectedLead.state} {selectedLead.zip || ''}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground">Service</label>
                    <p className="text-sm text-muted-foreground mt-1 capitalize">{String(selectedLead.serviceInterest)}</p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Status</label>
                    <p className="text-sm text-muted-foreground mt-1 capitalize">{String(selectedLead.status)}</p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Campaign</label>
                    <p className="text-sm text-muted-foreground mt-1">{selectedLead.campaign || '-'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground">Urgency Score</label>
                    <p className="text-sm text-foreground mt-1">{selectedLead.urgencyScore ?? '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Property Score</label>
                    <p className="text-sm text-foreground mt-1">{selectedLead.propertyScore ?? '-'}</p>
                  </div>
                  <div className="sm:col-span-3">
                    <label className="text-xs text-muted-foreground">Scoring Reason</label>
                    <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line">{selectedLead.scoringReason || '-'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground">Created</label>
                    <p className="text-sm text-muted-foreground mt-1">{selectedLead.createdAt ? new Date(selectedLead.createdAt).toLocaleString() : '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Last Updated</label>
                    <p className="text-sm text-muted-foreground mt-1">{selectedLead.updatedAt ? new Date(selectedLead.updatedAt).toLocaleString() : '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Last Contacted</label>
                    <p className="text-sm text-muted-foreground mt-1">{selectedLead.lastContactedAt ? new Date(selectedLead.lastContactedAt).toLocaleString() : '-'}</p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button className="px-3 py-1.5 text-sm border border-border rounded-md hover:bg-muted/50">Send Email</button>
                  <button className="px-3 py-1.5 text-sm border border-border rounded-md hover:bg-muted/50">Mark Contacted</button>
                  <button onClick={() => setSelectedLead(null)} className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90">Close</button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Pagination - COMPACT */}
        <div className="bg-card border-t border-border px-4 py-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground text-xs">Page {currentPage} of {totalPages}</span>
            <div className="flex gap-1">
              <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="px-3 py-1 text-xs border border-border rounded-md hover:bg-muted/50 disabled:opacity-50 transition-colors">
                Previous
              </button>
              <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="px-3 py-1 text-xs border border-border rounded-md hover:bg-muted/50 disabled:opacity-50 transition-colors">
                Next
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
