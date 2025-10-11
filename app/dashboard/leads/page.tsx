import LeadTableContainer from '@/components/leads/LeadTableContainer'
import FilterSidebar from '@/components/leads/FilterSidebar'
import { getInitialLeads } from './actions'

export default async function LeadsPage() {
  const initialData = await getInitialLeads()

'use client'

  return (
    <div className="flex h-[calc(100vh-2rem)] gap-4">
      {/* Filter Sidebar */}
      <FilterSidebar />

      {/* Main Content */}
      <main className="flex-1 overflow-hidden bg-white rounded-lg shadow">
        <LeadTableContainer initialData={initialData} />
      </main>
    </div>
  )
}