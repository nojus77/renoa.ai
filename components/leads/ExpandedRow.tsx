"use client"

import { type Lead } from '@/lib/types/lead'
import { formatCurrency, formatRelativeTime } from '@/lib/leads/utils'

interface ExpandedRowProps {
  lead: Lead
  onViewDetails: () => void
  onMatchProviders: () => void
}

export default function ExpandedRow({
  lead,
  onViewDetails,
  onMatchProviders
}: ExpandedRowProps) {
  return (
    <tr>
      <td colSpan={11}>
        <div className="px-8 py-6 bg-gray-50 border-b">
          <div className="grid grid-cols-3 gap-8">
            {/* Scoring Details */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                📊 Scoring Details
              </h4>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Overall:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {lead.score.overall >= 70 ? '🟢' : lead.score.overall >= 50 ? '🟡' : '🔴'} {lead.score.overall}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Urgency:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {lead.score.urgency >= 70 ? '🟢' : lead.score.urgency >= 50 ? '🟡' : '🔴'} {lead.score.urgency}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Tier:</span>
                  <span className="text-sm font-medium text-gray-900">{lead.tier}</span>
                </div>
              </div>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                📞 Contact
              </h4>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Email:</span>
                  <span className="text-sm text-gray-900">{lead.email}</span>
                  <button className="text-indigo-600 hover:text-indigo-700 text-sm">
                    [Copy]
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Phone:</span>
                  <span className="text-sm text-gray-900">{lead.phone}</span>
                  <button className="text-indigo-600 hover:text-indigo-700 text-sm">
                    [Call]
                  </button>
                  <button className="text-indigo-600 hover:text-indigo-700 text-sm">
                    [SMS]
                  </button>
                </div>
                <div className="text-sm text-gray-900">
                  {lead.address}, {lead.city}, {lead.state} {lead.zip}
                </div>
              </div>
            </div>

            {/* Property */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                🏠 Property
              </h4>
              <div className="space-y-1">
                <div className="text-sm text-gray-900">
                  Value: {formatCurrency(lead.propertyValue)}
                  {' | '}
                  {lead.property.squareFootage?.toLocaleString()} sqft
                </div>
                <div className="text-sm text-gray-900">
                  Beds: {lead.property.bedrooms}
                  {' | '}
                  Baths: {lead.property.bathrooms}
                  {' | '}
                  Lot: {lead.property.lotSize} acres
                </div>
                <div className="text-sm text-gray-900">
                  Built: {new Date().getFullYear() - (lead.property.age || 0)}
                  {' '}
                  ({lead.property.age} years old)
                </div>
              </div>
            </div>
          </div>

          {/* Latest Reply */}
          {lead.messages?.find(m => m.status === 'delivered') && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                💬 Latest Reply
              </h4>
              <div className="bg-white p-4 rounded-lg border">
                <p className="text-sm text-gray-600 italic">
                  "Yes! I'm looking for landscaping help..."
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Replied: {lead.lastActivityAt ? formatRelativeTime(lead.lastActivityAt) : 'Never'}
                </p>
                <button className="text-indigo-600 hover:text-indigo-700 text-sm mt-2">
                  [View Full Conversation →]
                </button>
              </div>
            </div>
          )}

          {/* Notes */}
                    {lead.notes && lead.notes.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium text-gray-900">
                📝 Notes ({lead.notes.length})
              </h4>
              <div className="mt-2 space-y-1">
                {lead.notes.slice(0, 2).map((note, idx) => (
                  <div key={idx} className="text-sm">
                    • {note}
                  </div>
                ))}
                {lead.notes.length > 2 && (
                  <div className="text-sm text-gray-500 italic">
                    + {lead.notes.length - 2} more notes
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 flex gap-4">
            <button
              onClick={onViewDetails}
              className="inline-flex items-center px-4 py-2 border border-indigo-600 rounded-md shadow-sm text-sm font-medium text-indigo-600 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              View Full Details
            </button>
            <button
              onClick={onMatchProviders}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Match Providers
            </button>
          </div>
        </div>
      </td>
    </tr>
  )
}