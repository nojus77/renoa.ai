'use client'

interface EstimateConfirmationProps {
  extracted: {
    projectType: string
    propertySize?: string
    timeline?: string
    budget?: string
    specialRequirements?: string
  }
  estimate: {
    min: number
    max: number
    confidence: 'high' | 'medium' | 'low'
    explanation: string
  }
  onConfirm: () => void
  onEdit: () => void
}

export default function EstimateConfirmation({
  extracted,
  estimate,
  onConfirm,
  onEdit
}: EstimateConfirmationProps) {
  const confidenceColor = {
    high: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-orange-100 text-orange-800'
  }[estimate.confidence]

  const confidenceLabel = {
    high: '✓ High Confidence',
    medium: '~ Medium Confidence',
    low: '⚠ Low Confidence'
  }[estimate.confidence]

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="bg-white rounded-2xl shadow-xl border-2 border-green-500 p-8">
        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">
          Got it! Here's your project summary
        </h2>

        {/* Project Details */}
        <div className="bg-gray-50 rounded-xl p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Your Project:</h3>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-2xl">📋</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Project Type</p>
                <p className="text-gray-900 font-medium">{extracted.projectType}</p>
              </div>
            </div>

            {extracted.propertySize && (
              <div className="flex items-start gap-3">
                <span className="text-2xl">📏</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Property Details</p>
                  <p className="text-gray-900">{extracted.propertySize}</p>
                </div>
              </div>
            )}

            {extracted.timeline && (
              <div className="flex items-start gap-3">
                <span className="text-2xl">📅</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Timeline</p>
                  <p className="text-gray-900">{extracted.timeline}</p>
                </div>
              </div>
            )}

            {extracted.budget && (
              <div className="flex items-start gap-3">
                <span className="text-2xl">💰</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Budget Mentioned</p>
                  <p className="text-gray-900">{extracted.budget}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Estimate Box */}
        <div className="border-2 border-green-500 rounded-xl p-6 mb-6 text-center">
          <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">
            Estimated Cost Range
          </p>
          <div className="text-4xl font-bold text-green-600 mb-3">
            ${estimate.min.toLocaleString()} - ${estimate.max.toLocaleString()}
          </div>
          <div className={`inline-block px-4 py-1 rounded-full text-sm font-semibold ${confidenceColor}`}>
            {confidenceLabel}
          </div>
          <p className="mt-4 text-sm text-gray-600 leading-relaxed">
            {estimate.explanation}
          </p>
          <p className="mt-3 text-xs text-gray-500 italic">
            *This is an AI estimate. Actual quotes may vary based on specific requirements.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            className="flex-1 py-4 bg-green-600 text-white font-bold text-lg rounded-xl hover:bg-green-700 transition-colors"
          >
            ✓ Looks Perfect! Get Matched
          </button>
          <button
            onClick={onEdit}
            className="px-6 py-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:border-green-500 hover:text-green-600 transition-colors"
          >
            Edit
          </button>
        </div>
      </div>
    </div>
  )
}
