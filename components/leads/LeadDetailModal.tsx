import React from 'react'

export interface LeadDetail {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  address?: string
  city: string
  state: string
  zip: string
  leadScore: number
  tier: number
  urgencyScore?: number | null
  propertyScore?: number | null
  financialScore?: number | null
  demographicScore?: number | null
  marketScore?: number | null
  urgencyReasons?: string | null
  campaign?: string | null
}

export default function LeadDetailModal({ lead, onClose }:{ lead: LeadDetail, onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Lead Details</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Contact</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500">Lead ID:</span> <span className="font-medium">{lead.id}</span></div>
              <div><span className="text-gray-500">Campaign:</span> <span className="font-medium">{lead.campaign || '-'}</span></div>
              <div><span className="text-gray-500">Name:</span> <span className="font-medium">{lead.firstName} {lead.lastName}</span></div>
              <div><span className="text-gray-500">Email:</span> <span className="font-medium">{lead.email}</span></div>
              <div><span className="text-gray-500">Phone:</span> <span className="font-medium">{lead.phone}</span></div>
              <div><span className="text-gray-500">Address:</span> <span className="font-medium">{lead.address || '-'}, {lead.city}, {lead.state} {lead.zip}</span></div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">AI Breakdown</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500">Urgency Score:</span> <span className="font-medium">{lead.urgencyScore ?? '-'}</span></div>
              <div><span className="text-gray-500">Property Score:</span> <span className="font-medium">{lead.propertyScore ?? '-'}</span></div>
              <div><span className="text-gray-500">Financial Score:</span> <span className="font-medium">{lead.financialScore ?? '-'}</span></div>
              <div><span className="text-gray-500">Demographic Score:</span> <span className="font-medium">{lead.demographicScore ?? '-'}</span></div>
              <div><span className="text-gray-500">Market Score:</span> <span className="font-medium">{lead.marketScore ?? '-'}</span></div>
              <div><span className="text-gray-500">Final Score / Tier:</span> <span className="font-medium">{lead.leadScore} / T{lead.tier}</span></div>
            </div>
            <div className="mt-3">
              <div className="text-sm text-gray-500 mb-1">Urgency Reasons</div>
              <div className="p-3 bg-gray-50 rounded-lg text-sm whitespace-pre-wrap">{lead.urgencyReasons || '-'}</div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t flex justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border hover:bg-gray-50">Close</button>
        </div>
      </div>
    </div>
  )
}
