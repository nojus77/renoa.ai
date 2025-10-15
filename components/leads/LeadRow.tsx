"use client"

import { type Lead, type LeadTier, type LeadStatus } from '@/lib/types/lead'
import { getScoreColor, getTierColor, getStatusColor, formatServicePrediction, formatRelativeTime } from '@/lib/leads/utils'
import { useState, useCallback, useMemo } from 'react'

interface LeadRowProps {
  lead: Lead
  isSelected: boolean
  onSelect: (id: string) => void
  onViewDetails: (lead: Lead) => void
}

export default function LeadRow({ lead, isSelected, onSelect, onViewDetails }: LeadRowProps) {
  const [hover, setHover] = useState(false)

  const handleMouseEnter = useCallback(() => setHover(true), [])
  const handleMouseLeave = useCallback(() => setHover(false), [])

  const rowClassName = useMemo(() => {
    return `border-b transition-colors cursor-pointer ${
      isSelected ? 'bg-indigo-50' : hover ? 'bg-gray-50' : 'bg-white'
    }`
  }, [isSelected, hover])

  return (
    <tr
      className={rowClassName}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={(e) => {
        // Don't handle click if clicking checkbox or action buttons
        if (
          e.target instanceof HTMLElement &&
          (e.target.closest('input[type="checkbox"]') || e.target.closest('button'))
        ) {
          return
        }
        onViewDetails(lead)
      }}
    >
      {/* Checkbox */}
      <td className="w-4 px-4 py-3">
        <input
          type="checkbox"
          className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          checked={isSelected}
          onChange={() => onSelect(lead.id)}
        />
      </td>

      {/* Score */}
      <td className="w-[60px] px-4 py-3">
        <div className="flex items-center">
          <span
            className="inline-flex items-center justify-center w-8 h-8 text-sm font-medium rounded"
            style={{ backgroundColor: getScoreColor(lead.score.overall).background, color: getScoreColor(lead.score.overall).color }}
          >
            {lead.score.overall}
          </span>
        </div>
      </td>

      {/* Tier */}
      <td className="w-[50px] px-4 py-3">
        {(() => {
          const displayTier = typeof lead.tier === 'number' ? `T${Math.min(Math.max(lead.tier, 1), 3)}` : lead.tier
          const colors = getTierColor(displayTier)
          return (
            <span
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
              style={{ backgroundColor: colors.background, color: colors.color }}
            >
              {displayTier}
            </span>
          )
        })()}
      </td>

      {/* Name */}
      <td className="w-[180px] px-4 py-3">
        <div className="flex items-center">
          <div>
            <div className="font-medium text-gray-900">
              {lead.firstName} {lead.lastName}
            </div>
            <div className="text-sm text-gray-500">{lead.email}</div>
          </div>
        </div>
      </td>

      {/* City */}
      <td className="w-[120px] px-4 py-3">
        <div className="text-sm text-gray-900">{lead.city}</div>
        <div className="text-xs text-gray-500">{lead.state}</div>
      </td>

      {/* Predicted Service */}
      <td className="w-[160px] px-4 py-3">
        <div>
          {(() => {
            const { display, color } = formatServicePrediction({
              confirmed: lead.confirmedService,
              predicted: lead.predictedService
            })
            return (
              <span
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                style={{ backgroundColor: `${color}20`, color }}
              >
                {display}
              </span>
            )
          })()}
        </div>
      </td>

      {/* Status */}
      <td className="w-[120px] px-4 py-3">
        <div>
          <span
            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize"
            style={{ backgroundColor: getStatusColor(lead.status).background, color: getStatusColor(lead.status).color }}
          >
            {lead.status}
          </span>
        </div>
      </td>

      {/* Messages Sent */}
      <td className="w-[100px] px-4 py-3">
        <div className="text-sm text-gray-900 text-center">{lead.messagesSent}</div>
      </td>

      {/* Last Activity */}
      <td className="w-[130px] px-4 py-3">
        <div className="text-sm text-gray-900">{formatRelativeTime(lead.lastActivityAt || lead.updatedAt)}</div>
      </td>

      {/* Campaign */}
      <td className="w-[100px] px-4 py-3">
        {lead.campaign ? (
          <div>
            <div className="text-sm font-medium text-gray-900">
              {typeof lead.campaign === 'string' ? lead.campaign : lead.campaign.code}
            </div>
            {typeof lead.campaign !== 'string' && (
              <div className="text-xs text-gray-500">
                {(lead.campaign.replyRate * 100).toFixed(1)}% replies
              </div>
            )}
          </div>
        ) : (
          <span className="text-sm text-gray-500">No campaign</span>
        )}
      </td>

      {/* Actions */}
      <td className="w-[80px] px-4 py-3">
        <div className="flex items-center justify-end gap-2">
          {/* Indicator icons */}
          {lead.hasNotes && (
            <span className="text-gray-400" title="Has notes">📝</span>
          )}
          {lead.isPriority && (
            <span className="text-gray-400" title="Priority lead">⭐</span>
          )}
          {lead.hasUnreadReply && (
            <span className="text-gray-400" title="Has unread reply">✉️</span>
          )}
          {lead.serviceChanged && (
            <span className="text-gray-400" title="Service changed">🔄</span>
          )}

          {/* Action menu button */}
          <button
            className="p-1 text-gray-400 hover:text-gray-500"
            onClick={(e) => {
              e.stopPropagation()
              // TODO: Open action menu
            }}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
        </div>
      </td>
    </tr>
  )
}