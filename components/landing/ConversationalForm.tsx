'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface Message {
  role: 'ai' | 'user'
  text: string
  timestamp: Date
}

interface QuestionConfig {
  id: string
  ai: string
  type: 'text' | 'choice' | 'contact'
  placeholder?: string
  options?: string[]
  validation?: (value: string) => boolean
  errorMessage?: string
}

export default function ConversationalForm() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [userInput, setUserInput] = useState('')
  const [conversation, setConversation] = useState<Message[]>([])
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [contactForm, setContactForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  })
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const questions: QuestionConfig[] = [
    {
      id: 'service_description',
      ai: "Hi! 👋 I'm your Renoa assistant. Tell me about the home service you need.",
      type: 'text',
      placeholder: "e.g., 'I need my backyard landscaped' or 'Looking for gutter cleaning'",
      validation: (val) => val.length >= 10,
      errorMessage: 'Please provide more details (at least 10 characters)'
    },
    {
      id: 'location',
      ai: "Great! What's your ZIP code so I can find providers in your area?",
      type: 'text',
      placeholder: "e.g., 60608",
      validation: (val) => /^\d{5}$/.test(val),
      errorMessage: 'Please enter a valid 5-digit ZIP code'
    },
    {
      id: 'property_size',
      ai: "How would you describe the size of the project area?",
      type: 'choice',
      options: [
        'Small (< 5,000 sq ft)',
        'Medium (5,000 - 10,000 sq ft)',
        'Large (10,000+ sq ft)',
        "I'm not sure"
      ]
    },
    {
      id: 'budget',
      ai: "What's your budget range for this project?",
      type: 'choice',
      options: [
        'Under $1,000',
        '$1,000 - $2,500',
        '$2,500 - $5,000',
        '$5,000 - $10,000',
        'Over $10,000',
        'Need an estimate first'
      ]
    },
    {
      id: 'timeline',
      ai: "When would you like this project completed?",
      type: 'choice',
      options: [
        'ASAP (within 1 week)',
        'Within 1 month',
        'Within 3 months',
        'Flexible / Just planning'
      ]
    },
    {
      id: 'contact',
      ai: "Perfect! I'll match you with top-rated providers. Just need your contact info to get started.",
      type: 'contact'
    }
  ]

  const currentQuestion = questions[step]

  // Auto-scroll to bottom when new messages appear
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversation])

  // Add initial AI message
  useEffect(() => {
    if (conversation.length === 0) {
      setTimeout(() => {
        setConversation([{
          role: 'ai',
          text: questions[0].ai,
          timestamp: new Date()
        }])
      }, 300)
    }
  }, [])

  const handleTextSubmit = async (value: string) => {
    const question = questions[step]

    // Validate input
    if (question.validation && !question.validation(value)) {
      alert(question.errorMessage || 'Invalid input')
      return
    }

    // Add user message to conversation
    const newConversation = [...conversation, {
      role: 'user' as const,
      text: value,
      timestamp: new Date()
    }]
    setConversation(newConversation)
    setUserInput('')

    // Save answer
    const newAnswers = { ...answers, [question.id]: value }
    setAnswers(newAnswers)

    // Analyze first message with AI if it's the service description
    if (step === 0) {
      try {
        const response = await fetch('/api/analyze-project', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            service: 'general',
            description: value,
            currentAnswers: {}
          })
        })
        const analysis = await response.json()
        newAnswers.aiAnalysis = analysis
        setAnswers(newAnswers)
      } catch (error) {
        console.error('AI analysis failed:', error)
      }
    }

    // Move to next question
    if (step < questions.length - 1) {
      setTimeout(() => {
        setConversation([...newConversation, {
          role: 'ai',
          text: questions[step + 1].ai,
          timestamp: new Date()
        }])
        setStep(step + 1)
      }, 800)
    }
  }

  const handleChoiceSubmit = (choice: string) => {
    handleTextSubmit(choice)
  }

  const handleContactSubmit = async () => {
    // Validate contact form
    if (!contactForm.firstName || !contactForm.lastName || !contactForm.email || !contactForm.phone) {
      alert('Please fill in all contact fields')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactForm.email)) {
      alert('Please enter a valid email address')
      return
    }

    setIsSubmitting(true)

    try {
      // Prepare lead data
      const leadData = {
        firstName: contactForm.firstName,
        lastName: contactForm.lastName,
        email: contactForm.email,
        phone: contactForm.phone,
        city: 'Unknown', // Will be filled from ZIP
        state: 'Unknown',
        zip: answers.location || '',
        serviceInterest: 'general',
        leadSource: 'conversational_form',
        projectDetails: {
          description: answers.service_description,
          property_size: answers.property_size,
          budget: answers.budget,
          timeline: answers.timeline,
          aiAnalysis: answers.aiAnalysis
        }
      }

      // Submit lead
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadData)
      })

      if (response.ok) {
        const data = await response.json()
        // Redirect to success page
        window.location.href = `/success?leadId=${data.lead.id}`
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        alert(`Failed to submit: ${errorData.error || 'Server error'}. Please try again.`)
      }
    } catch (error) {
      console.error('Submission failed:', error)
      alert('Network error. Please check your connection and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatPhoneNumber = (value: string) => {
    const phoneNumber = value.replace(/\D/g, '')
    if (phoneNumber.length === 0) return ''
    if (phoneNumber.length <= 3) return phoneNumber
    if (phoneNumber.length <= 6) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`
    }
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8 bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-700">Your Progress</span>
            <span className="text-sm font-semibold text-green-600">
              {Math.round(((step + 1) / questions.length) * 100)}%
            </span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${((step + 1) / questions.length) * 100}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Question {step + 1} of {questions.length} • {questions.length - step - 1} more to go
          </p>
        </div>

        {/* Chat Container */}
        <div className="bg-white rounded-2xl shadow-lg p-6 min-h-[500px] flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-6" style={{ maxHeight: '500px' }}>
            {conversation.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
              >
                {msg.role === 'ai' && (
                  <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-bold mr-3 flex-shrink-0">
                    R
                  </div>
                )}
                <div className={`max-w-[70%] px-5 py-3 rounded-2xl shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white rounded-br-sm'
                    : 'bg-gray-50 text-gray-900 rounded-bl-sm border border-gray-100'
                }`}>
                  <p className="text-[15px] leading-relaxed">{msg.text}</p>
                </div>
              </div>
            ))}

            {/* Typing indicator when transitioning */}
            {isSubmitting && (
              <div className="flex justify-start animate-fade-in">
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-bold mr-3">
                  R
                </div>
                <div className="bg-gray-50 px-5 py-3 rounded-2xl">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-100 pt-4">
            {currentQuestion?.type === 'text' && (
              <div className="flex gap-3">
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && userInput.trim()) {
                      handleTextSubmit(userInput.trim())
                    }
                  }}
                  placeholder={currentQuestion.placeholder}
                  className="flex-1 px-5 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none text-[15px] transition-colors"
                  autoFocus
                  disabled={isSubmitting}
                />
                <button
                  onClick={() => {
                    if (userInput.trim()) {
                      handleTextSubmit(userInput.trim())
                    }
                  }}
                  disabled={isSubmitting || !userInput.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                >
                  Send →
                </button>
              </div>
            )}

            {currentQuestion?.type === 'choice' && (
              <div className="grid grid-cols-1 gap-3">
                {currentQuestion.options?.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleChoiceSubmit(option)}
                    disabled={isSubmitting}
                    className="px-6 py-4 text-left border-2 border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all text-[15px] font-medium disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    <span className="group-hover:text-green-600 transition-colors">{option}</span>
                  </button>
                ))}
              </div>
            )}

            {currentQuestion?.type === 'contact' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={contactForm.firstName}
                    onChange={(e) => setContactForm({ ...contactForm, firstName: e.target.value })}
                    placeholder="First Name"
                    className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition-colors"
                    disabled={isSubmitting}
                  />
                  <input
                    type="text"
                    value={contactForm.lastName}
                    onChange={(e) => setContactForm({ ...contactForm, lastName: e.target.value })}
                    placeholder="Last Name"
                    className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition-colors"
                    disabled={isSubmitting}
                  />
                </div>
                <input
                  type="email"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  placeholder="Email Address"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition-colors"
                  disabled={isSubmitting}
                />
                <input
                  type="tel"
                  value={contactForm.phone}
                  onChange={(e) => setContactForm({ ...contactForm, phone: formatPhoneNumber(e.target.value) })}
                  placeholder="Phone Number"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition-colors"
                  disabled={isSubmitting}
                />
                <button
                  onClick={handleContactSubmit}
                  disabled={isSubmitting}
                  className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 font-semibold text-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Finding Your Match...' : 'Get Matched with Top Providers →'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-6 flex items-center justify-center gap-8 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>100% Free</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Secure & Private</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>Instant Matching</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.4s ease-out;
        }
      `}</style>
    </div>
  )
}
