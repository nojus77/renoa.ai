'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Lead {
  id: string
  firstName: string
  lastName: string
  email: string
  city: string
  state: string
  zip: string
  serviceInterest: string
  estimatedCostMin?: number
  estimatedCostMax?: number
  estimateConfidence?: string
  assignedProvider?: {
    businessName: string
    ownerName: string
  }
}

export default function SuccessPage() {
  const searchParams = useSearchParams()
  const [lead, setLead] = useState<Lead | null>(null)
  const [loading, setLoading] = useState(true)
  const leadId = searchParams.get('leadId')

  useEffect(() => {
    if (leadId) {
      fetch(`/api/leads/${leadId}`)
        .then(r => r.json())
        .then(data => {
          setLead(data)
          setLoading(false)
        })
        .catch(err => {
          console.error('Failed to load lead:', err)
          setLoading(false)
        })
    } else {
      setLoading(false)
    }
  }, [leadId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600"></div>
      </div>
    )
  }

  // If no lead data, show simple success message
  if (!lead) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8 text-center animate-fade-in">
          <div className="mb-6">
            <div className="w-20 h-20 bg-green-500 rounded-full mx-auto flex items-center justify-center animate-bounce">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Success! 🎉
          </h1>

          <p className="text-xl text-gray-700 mb-8">
            Your service request has been submitted successfully!
          </p>

          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 mb-8">
            <h3 className="font-semibold text-green-900 mb-4 text-lg">What Happens Next:</h3>
            <div className="space-y-3 text-left text-green-800">
              <div className="flex items-start">
                <span className="text-green-600 mr-3 text-xl font-bold">✓</span>
                <span>Check your email for confirmation details</span>
              </div>
              <div className="flex items-start">
                <span className="text-green-600 mr-3 text-xl font-bold">✓</span>
                <span>A top-rated provider will contact you within 24 hours</span>
              </div>
              <div className="flex items-start">
                <span className="text-green-600 mr-3 text-xl font-bold">✓</span>
                <span>Schedule a free consultation at your convenience</span>
              </div>
              <div className="flex items-start">
                <span className="text-green-600 mr-3 text-xl font-bold">✓</span>
                <span>Get a detailed quote and project timeline</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => window.location.href = '/'}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-8 rounded-lg transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            Back to Home
          </button>

          <p className="mt-6 text-gray-500 text-sm">
            Questions? Reply to the confirmation email we sent you.
          </p>
        </div>

        <style jsx>{`
          @keyframes fade-in {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .animate-fade-in {
            animation: fade-in 0.5s ease-out;
          }
        `}</style>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8 text-center animate-fade-in">
        {/* Success Animation */}
        <div className="mb-6">
          <div className="w-20 h-20 bg-green-500 rounded-full mx-auto flex items-center justify-center animate-bounce">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Success! 🎉
        </h1>

        <p className="text-xl text-gray-700 mb-8">
          We&apos;re finding the perfect match for your <span className="font-semibold text-green-600">{(lead.serviceInterest || 'service').replace('_', ' ')}</span> project
        </p>

        {/* Project Details */}
        <div className="bg-gray-50 rounded-xl p-6 mb-8 text-left">
          <h3 className="font-semibold text-gray-900 mb-4 text-center">Your Request:</h3>
          <div className="space-y-2 text-gray-700">
            <div className="flex items-center">
              <span className="text-2xl mr-3">📍</span>
              <span><strong>Location:</strong> {lead.city}, {lead.state} {lead.zip}</span>
            </div>
            <div className="flex items-center">
              <span className="text-2xl mr-3">🏡</span>
              <span><strong>Service:</strong> {(lead.serviceInterest || 'service').replace('_', ' ').split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</span>
            </div>
            {lead.estimatedCostMin && lead.estimatedCostMax && (
              <div className="flex items-center">
                <span className="text-2xl mr-3">💰</span>
                <span><strong>Estimated Cost:</strong> ${lead.estimatedCostMin.toLocaleString()} - ${lead.estimatedCostMax.toLocaleString()}</span>
              </div>
            )}
            {lead.assignedProvider && (
              <div className="flex items-center mt-4 pt-4 border-t border-gray-200">
                <span className="text-2xl mr-3">✅</span>
                <span><strong>Matched with:</strong> {lead.assignedProvider.businessName}</span>
              </div>
            )}
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 mb-8">
          <h3 className="font-semibold text-green-900 mb-4 text-lg">What Happens Next:</h3>
          <div className="space-y-3 text-left text-green-800">
            <div className="flex items-start">
              <span className="text-green-600 mr-3 text-xl font-bold">✓</span>
              <span>Check your email - we&apos;ve sent confirmation details to <strong>{lead.email}</strong></span>
            </div>
            <div className="flex items-start">
              <span className="text-green-600 mr-3 text-xl font-bold">✓</span>
              <span>A top-rated provider will contact you within 24 hours</span>
            </div>
            <div className="flex items-start">
              <span className="text-green-600 mr-3 text-xl font-bold">✓</span>
              <span>Schedule a free consultation at your convenience</span>
            </div>
            <div className="flex items-start">
              <span className="text-green-600 mr-3 text-xl font-bold">✓</span>
              <span>Get a detailed quote and project timeline</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => window.location.href = '/'}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-8 rounded-lg transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
        >
          Back to Home
        </button>

        <p className="mt-6 text-gray-500 text-sm">
          Questions? Reply to the confirmation email we sent you.
        </p>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </div>
  )
}
