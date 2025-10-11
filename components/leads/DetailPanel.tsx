"use client"

import { type Lead, type LeadUpdate } from '@/lib/types/lead'
import { formatCurrency, formatRelativeTime, formatLeadScore, formatServiceInterest, formatStatus } from '@/lib/leads/utils'
import { updateLead } from '@/lib/leads/api'
import { useToastStore } from '@/lib/toast'
import { useState } from 'react'

interface DetailPanelProps {
  lead: Lead
  onClose: () => void
  onSave: (lead: Lead) => void
}

function SectionHeader({ title }: { title: string }) {
  return (
    <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
  )
}

function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="mb-4">
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900">{value}</dd>
    </div>
  )
}

export default function DetailPanel({ lead: initialLead, onClose, onSave }: DetailPanelProps) {
  const [lead, setLead] = useState(initialLead)
  const [isSaving, setIsSaving] = useState(false)
  const { addToast } = useToastStore()

  const handleSave = async (updates: LeadUpdate) => {
    try {
      setIsSaving(true)
      const updatedLead = await updateLead(lead.id, updates)
      setLead(updatedLead)
      onSave(updatedLead)
      addToast('Lead updated successfully', 'success')
    } catch (error) {
      console.error('Error updating lead:', error)
      addToast('Failed to update lead', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between py-4 px-6 border-b">
        <div>
          <h2 className="text-lg font-medium text-gray-900">
            {lead.firstName} {lead.lastName}
          </h2>
          <p className="text-sm text-gray-500">{lead.email}</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-gray-500"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content (scrollable) */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-4 space-y-8">
          {/* Lead Header */}
          <div className="flex items-center space-x-4">
            <div
              className="w-12 h-12 flex items-center justify-center rounded-lg text-lg font-medium"
              style={{
                backgroundColor: `${formatLeadScore(lead.score.overall).background}`,
                color: formatLeadScore(lead.score.overall).color
              }}
            >
              {lead.score.overall}
            </div>
            <div>
              <span
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: `${formatStatus(lead.status).background}`,
                  color: formatStatus(lead.status).color
                }}
              >
                {formatStatus(lead.status).display}
              </span>
              <p className="mt-1 text-sm text-gray-500">
                Last updated {formatRelativeTime(lead.updatedAt)}
              </p>
            </div>
          </div>

          {/* Contact Information */}
          <section>
            <SectionHeader title="Contact Information" />
            <dl>
              <DetailItem
                label="Email"
                value={
                  <div className="flex items-center">
                    <span>{lead.email}</span>
                    <button
                      onClick={() => navigator.clipboard.writeText(lead.email)}
                      className="ml-2 text-indigo-600 hover:text-indigo-700"
                    >
                      Copy
                    </button>
                  </div>
                }
              />
              <DetailItem
                label="Phone"
                value={
                  <div className="flex items-center">
                    <span>{lead.phone}</span>
                    <button
                      onClick={() => navigator.clipboard.writeText(lead.phone)}
                      className="ml-2 text-indigo-600 hover:text-indigo-700"
                    >
                      Copy
                    </button>
                  </div>
                }
              />
              <DetailItem
                label="Address"
                value={
                  <div>
                    <p>{lead.address}</p>
                    <p>
                      {lead.city}, {lead.state} {lead.zip}
                    </p>
                  </div>
                }
              />
            </dl>
          </section>

          {/* Property & Service Details */}
          <section>
            <SectionHeader title="Property Details" />
            <dl className="grid grid-cols-2 gap-4">
              <DetailItem
                label="Type"
                value={lead.propertyType.replace('_', ' ').split(' ').map(word => 
                  word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ')}
              />
              <DetailItem
                label="Value"
                value={lead.propertyValue ? formatCurrency(lead.propertyValue) : 'N/A'}
              />
              <DetailItem
                label="Square Feet"
                value={lead.property.squareFootage ? `${lead.property.squareFootage.toLocaleString()} sqft` : 'N/A'}
              />
              <DetailItem
                label="Service Interest"
                value={
                  <span
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: formatServiceInterest(lead.serviceInterest).background,
                      color: formatServiceInterest(lead.serviceInterest).color
                    }}
                  >
                    {formatServiceInterest(lead.serviceInterest).display}
                  </span>
                }
              />
            </dl>
            {lead.aiTool1Metadata && typeof lead.aiTool1Metadata === 'object' && (
              <div className="mt-4">
                <DetailItem
                  label="AI Analysis"
                  value={
                    <div className="space-y-2 text-sm">
                      <p>{(lead.aiTool1Metadata as Record<string, any>).analysis || 'No analysis available'}</p>
                      {(lead.aiTool1Metadata as Record<string, any>).recommendedActions && Array.isArray((lead.aiTool1Metadata as Record<string, any>).recommendedActions) && (
                        <ul className="mt-2 list-disc list-inside">
                          {((lead.aiTool1Metadata as Record<string, any>).recommendedActions as string[]).map((action, i) => (
                            <li key={i} className="text-gray-600">{action}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  }
                />
              </div>
            )}
          </section>

          {/* Messages */}
          {lead.messages && lead.messages.length > 0 && (
            <section>
              <SectionHeader title="Conversation History" />
              <div className="space-y-4">
                {lead.messages.map((message) => (
                  <div
                    key={message.id}
                    className="bg-gray-50 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">
                        {message.messageType === 'email' ? '📧' : '📱'} {message.subject || 'Message'}
                      </span>
                      <span className="text-sm text-gray-500">
                        {message.sentAt ? formatRelativeTime(message.sentAt) : formatRelativeTime(message.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">
                      {message.content}
                    </p>
                    {message.status !== 'sent' && (
                      <p className="mt-2 text-xs text-gray-500">
                        Status: {message.status}
                        {message.deliveredAt && ` • Delivered ${formatRelativeTime(message.deliveredAt)}`}
                        {message.errorMessage && (
                          <span className="block text-red-600">{message.errorMessage}</span>
                        )}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Engagement */}
          {lead.engagementMetrics && lead.engagementMetrics.length > 0 && (
            <section>
              <SectionHeader title="Engagement History" />
              <div className="space-y-4">
                {lead.engagementMetrics.map((metric) => (
                  <div
                    key={metric.id}
                    className="bg-gray-50 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">
                        {metric.replied ? '✅ Replied' : metric.opened ? '👁️ Opened' : '📬 Delivered'}
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatRelativeTime(metric.repliedAt || metric.openedAt || metric.createdAt)}
                      </span>
                    </div>
                    {metric.replyText && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-700">{metric.replyText}</p>
                        {metric.replySentiment && (
                          <span className="mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {metric.replySentiment.toLowerCase()}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Lead Info */}
          <section>
            <SectionHeader title="Lead Information" />
            <dl>
              <DetailItem
                label="Lead Score"
                value={
                  <div className="flex items-center space-x-2">
                    <span>{lead.score.overall}</span>
                    {lead.score.overall >= 80 && <span className="text-green-500">⭐</span>}
                  </div>
                }
              />
              <DetailItem
                label="Status"
                value={lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
              />
              <DetailItem
                label="Source"
                value={lead.leadSource}
              />
              <DetailItem
                label="Created"
                value={formatRelativeTime(lead.createdAt)}
              />
              <DetailItem
                label="Last Updated"
                value={formatRelativeTime(lead.updatedAt)}
              />
            </dl>
          </section>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-6 py-4 border-t bg-gray-50">
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => {
              // TODO: Implement edit
            }}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Edit Info
          </button>
          <button
            onClick={() => {
              // TODO: Implement change campaign
            }}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Change Campaign
          </button>
          <button
            onClick={() => {
              // TODO: Implement send message
            }}
            className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Send Message
          </button>
          <button
            onClick={() => {
              // TODO: Implement match providers
            }}
            className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Match Providers
          </button>
          <button
            onClick={() => {
              const aiData = lead.aiTool1Metadata as any
              const update: LeadUpdate = {
                notes: [`Lead marked as ${aiData?.priority ? 'not ' : ''}important on ${new Date().toISOString()}`],
                aiTool1Metadata: {
                  ...aiData,
                  priority: !aiData?.priority
                }
              }
              handleSave(update)
            }}
            className={`
              flex-1 px-4 py-2 border rounded-md shadow-sm text-sm font-medium
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
              ${(lead.aiTool1Metadata as any)?.priority
                ? 'border-red-300 text-red-700 bg-red-50 hover:bg-red-100'
                : 'border-indigo-300 text-indigo-700 bg-indigo-50 hover:bg-indigo-100'
              }
            `}
          >
            {(lead.aiTool1Metadata as any)?.priority ? 'Remove Priority' : 'Mark Priority'}
            {(lead.aiTool1Metadata as any)?.priority && <span className="ml-1">⭐</span>}
          </button>
        </div>
        <div className="mt-4 flex justify-center">
          <button
            onClick={() => {
              // TODO: Implement delete with confirmation
            }}
            className="text-sm text-red-600 hover:text-red-700"
          >
            Delete Lead
          </button>
        </div>
      </div>
    </div>
  )
}