'use client'

interface FlowSelectorProps {
  onSelectGuided: () => void
  onSelectSmart: () => void
}

export default function FlowSelector({ onSelectGuided, onSelectSmart }: FlowSelectorProps) {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
        How would you like to get started?
      </h2>
      <p className="text-center text-gray-600 mb-12">
        Choose the option that works best for you
      </p>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Option 1: Quick Questions (DEFAULT - RECOMMENDED) */}
        <button
          onClick={onSelectGuided}
          className="relative p-8 bg-white border-4 border-green-600 rounded-2xl shadow-xl hover:shadow-2xl transition-all text-left group hover:scale-105 transform"
        >
          {/* Recommended Badge */}
          <div className="absolute -top-3 -right-3 bg-green-600 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
            ⚡ Recommended
          </div>

          <div className="text-5xl mb-4">📝</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            Answer Quick Questions
          </h3>
          <p className="text-gray-600 mb-6 leading-relaxed">
            We&apos;ll guide you through a few simple questions about your project. Quick, easy, and precise!
          </p>

          <div className="space-y-2 mb-6">
            <div className="flex items-center text-sm text-gray-700">
              <span className="text-green-600 mr-2">✓</span>
              <span>Guided step-by-step process</span>
            </div>
            <div className="flex items-center text-sm text-gray-700">
              <span className="text-green-600 mr-2">✓</span>
              <span>Clear and structured</span>
            </div>
            <div className="flex items-center text-sm text-gray-700">
              <span className="text-green-600 mr-2">✓</span>
              <span>No guesswork needed</span>
            </div>
          </div>

          <div className="inline-block px-5 py-2 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
            Takes 2-3 minutes
          </div>
        </button>

        {/* Option 2: Describe in Own Words (ALTERNATIVE) */}
        <button
          onClick={onSelectSmart}
          className="p-8 bg-white border-2 border-gray-300 rounded-2xl shadow-lg hover:shadow-xl hover:border-green-500 transition-all text-left group hover:scale-105 transform"
        >
          <div className="text-5xl mb-4">💬</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            Describe in Your Own Words
          </h3>
          <p className="text-gray-600 mb-6 leading-relaxed">
            Tell us what you need in your own words and our AI will understand the details.
          </p>

          <div className="space-y-2 mb-6">
            <div className="flex items-center text-sm text-gray-700">
              <span className="text-gray-500 mr-2">✓</span>
              <span>Free-form description</span>
            </div>
            <div className="flex items-center text-sm text-gray-700">
              <span className="text-gray-500 mr-2">✓</span>
              <span>AI-powered analysis</span>
            </div>
            <div className="flex items-center text-sm text-gray-700">
              <span className="text-gray-500 mr-2">✓</span>
              <span>Skip straight to contact</span>
            </div>
          </div>

          <div className="inline-block px-5 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-semibold">
            🤖 AI-Powered
          </div>
        </button>
      </div>

      <p className="text-center text-gray-500 text-sm mt-8">
        Both options are quick and get you matched with top-rated professionals
      </p>
    </div>
  )
}
