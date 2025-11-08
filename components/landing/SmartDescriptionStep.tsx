'use client'
import { useState } from 'react'

interface SmartDescriptionStepProps {
  service: string
  zip: string
  onComplete: (data: any) => void
  onUseGuidedQuestions: () => void
}

export default function SmartDescriptionStep({
  service,
  zip,
  onComplete,
  onUseGuidedQuestions
}: SmartDescriptionStepProps) {
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const minChars = 50
  const maxChars = 500
  const isValid = description.length >= minChars && description.length <= maxChars
  const wordCount = description.trim().split(/\s+/).filter(w => w.length > 0).length
  const hasEnoughWords = wordCount >= 5

  const handleAnalyze = async () => {
    if (!isValid || !hasEnoughWords) return

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/analyze-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: description.trim(),
          service,
          zip
        })
      })

      if (!response.ok) {
        throw new Error('Analysis failed')
      }

      const data = await response.json()
      onComplete({
        description: description.trim(),
        extracted: data.extracted,
        estimate: data.estimate
      })

    } catch (err) {
      console.error('Analysis error:', err)
      setError('Had trouble analyzing that. Try the guided questions instead.')
    } finally {
      setLoading(false)
    }
  }

  const examplePlaceholder = getExampleForService(service)

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Tell us about your {service.toLowerCase()} project
        </h2>
        <p className="text-lg text-gray-600">
          Describe what you need and our AI will understand the details
        </p>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-8">
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          Project Description
        </label>

        <textarea
          value={description}
          onChange={(e) => {
            if (e.target.value.length <= maxChars) {
              setDescription(e.target.value)
              setError('')
            }
          }}
          placeholder={examplePlaceholder}
          rows={6}
          className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-xl focus:border-green-500 focus:outline-none transition-colors resize-none"
          disabled={loading}
        />

        {/* Character Counter */}
        <div className="mt-3 flex items-center justify-between text-sm">
          <div>
            {description.length < minChars ? (
              <span className="text-gray-500">
                {description.length}/{minChars} characters ({minChars - description.length} more needed)
              </span>
            ) : (
              <span className="text-green-600 font-medium">
                ✓ {description.length} characters
              </span>
            )}
          </div>
          <div className="text-gray-400">
            {maxChars - description.length} remaining
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Get Estimate Button */}
        <button
          onClick={handleAnalyze}
          disabled={!isValid || !hasEnoughWords || loading}
          className="w-full mt-6 py-4 bg-green-600 text-white font-bold text-lg rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] disabled:hover:scale-100"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Analyzing your project...
            </span>
          ) : (
            'Get My Estimate →'
          )}
        </button>

        {/* Divider */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t-2 border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-6 py-2 bg-white text-gray-600 font-semibold">OR</span>
          </div>
        </div>

        {/* Guided Questions Button - MORE VISIBLE */}
        <button
          onClick={onUseGuidedQuestions}
          className="w-full py-4 px-6 border-2 border-gray-300 rounded-xl hover:border-green-500 hover:bg-green-50 font-semibold text-gray-700 hover:text-green-700 transition-all transform hover:scale-[1.02] shadow-sm hover:shadow-md"
          disabled={loading}
        >
          📝 Answer step-by-step questions instead
        </button>
      </div>

      {/* Trust Badges */}
      <div className="mt-8 flex justify-center gap-8 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <span>✓</span> 100% Free
        </div>
        <div className="flex items-center gap-2">
          <span>🔒</span> Secure & Private
        </div>
        <div className="flex items-center gap-2">
          <span>⚡</span> Instant AI Matching
        </div>
      </div>
    </div>
  )
}

function getExampleForService(service: string): string {
  const examples: Record<string, string> = {
    'landscaping': 'Example: "Need to replace dead grass in my backyard, about 2000 sq ft. Want new sod installed and 3 old bushes removed. Looking to get it done before summer."',
    'plumbing': 'Example: "Leaky faucet in kitchen sink. Drips constantly even when fully closed. Need someone to fix or replace it this week."',
    'hvac': 'Example: "AC not cooling properly. Runs but house stays warm. 3-bedroom home, system is about 8 years old. Need repair ASAP, it\'s getting hot."',
    'electrical': 'Example: "Need to install 3 new outlets in garage and replace old light fixtures. Also circuit breaker keeps tripping in kitchen."',
    'painting': 'Example: "Want to paint living room and two bedrooms. About 1200 sq ft total. Walls need patching in a few spots. Looking for interior painting only."',
    'roofing': 'Example: "Some shingles missing after recent storm. Small leak in attic. 2-story house, asphalt shingle roof, about 10 years old."',
    'cleaning': 'Example: "Need deep cleaning for 3-bedroom house. Carpets, bathrooms, kitchen - everything. Moving out next month and need it spotless."',
    'flooring': 'Example: "Replace old carpet in living room with hardwood. Room is about 300 sq ft. Also need baseboards installed."',
    'lawn_care': 'Example: "Need weekly lawn mowing service for medium-sized yard. Also want trimming and edging. Starting in spring."',
    'hardscaping': 'Example: "Want to build a stone patio in backyard, about 200 sq ft. Need steps leading to it and proper drainage."',
    'remodeling': 'Example: "Kitchen remodel - new cabinets, countertops, and backsplash. Kitchen is about 150 sq ft. Medium-range materials."',
    'fencing': 'Example: "Need 6-foot privacy fence for backyard, about 150 linear feet. Wood or vinyl, looking for quotes on both."'
  }

  return examples[service.toLowerCase()] || 'Example: "Describe what you need done, the size/scope of the project, and any specific requirements..."'
}
