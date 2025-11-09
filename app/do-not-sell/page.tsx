import Link from 'next/link'

export default function DoNotSellPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/" className="inline-flex items-center text-green-600 hover:text-green-700 font-semibold transition-colors">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <article className="bg-white rounded-2xl shadow-sm p-8 sm:p-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Do Not Sell or Share My Personal Information</h1>
          <p className="text-gray-600 mb-8">Last Updated: January 9, 2025</p>

          <div className="prose prose-green max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your Right to Opt-Out (California CPRA)</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Under the California Privacy Rights Act (CPRA), California residents have the right to opt-out of the &quot;sale&quot; or &quot;sharing&quot; of their personal information.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">What We &quot;Sell&quot; or &quot;Share&quot;</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                When you submit a project request on Renoa.ai, we provide your contact information and project details to matched service providers in exchange for fees. Under California law, this is considered a &quot;sale&quot; or &quot;sharing&quot; of personal information.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>Information shared:</strong>
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Name</li>
                <li>Phone number</li>
                <li>Email address</li>
                <li>Street address and ZIP code</li>
                <li>Project details and service type</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>Recipients:</strong> Pre-qualified service providers (contractors, landscapers, HVAC technicians, etc.) who pay us for matched leads.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">How to Opt-Out</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                You can opt-out using any of these methods:
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">1. Online Form (Fastest)</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Fill out our{' '}
                <Link href="/opt-out-form" className="text-green-600 hover:text-green-700 font-semibold underline">
                  Opt-Out Request Form
                </Link>{' '}
                (takes 1 minute)
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">2. Email</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Send a request to:{' '}
                <a href="mailto:donotsell@renoa.ai" className="text-green-600 hover:text-green-700 font-semibold underline">
                  donotsell@renoa.ai
                </a>
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                Include:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Your full name</li>
                <li>Email address</li>
                <li>Phone number</li>
                <li>Statement: &quot;I opt-out of the sale/sharing of my personal information&quot;</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">3. Phone</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Call us at:{' '}
                <a href="tel:+13125550100" className="text-green-600 hover:text-green-700 font-semibold underline">
                  (312) 555-0100
                </a>
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">4. Enable Global Privacy Control (GPC)</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>We honor GPC signals automatically.</strong> Enable GPC in:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li><strong>Brave Browser:</strong> Settings &gt; Shields &gt; Global Privacy Control</li>
                <li><strong>Firefox:</strong> Install Privacy Badger or GPC extension</li>
                <li><strong>Chrome/Edge:</strong> Install GPC browser extension</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-4">
                If we detect a GPC signal, we&apos;ll automatically opt you out.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">What Happens After You Opt-Out</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Once you opt-out:
              </p>
              <ul className="list-none pl-0 text-gray-700 space-y-2 mb-4">
                <li>✅ <strong>We stop sharing new lead requests</strong> with service providers for payment</li>
                <li>✅ <strong>We process your request within 15 business days</strong></li>
                <li>✅ <strong>You&apos;ll receive a confirmation email</strong></li>
                <li>✅ <strong>Your opt-out lasts for 12 months</strong> (we&apos;ll ask you to renew after that)</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>What still works:</strong>
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>You can still use our platform and submit project requests</li>
                <li>We may share your information with a single provider if you specifically request it</li>
                <li>We can still process transactional communications</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Non-California Residents</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Even if you&apos;re not in California, you can still opt-out using the methods above. We respect privacy rights for all users.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Verification</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                To protect your privacy, we&apos;ll verify your identity by:
              </p>
              <ol className="list-decimal pl-6 text-gray-700 space-y-2 mb-4">
                <li>Matching your email address to our records</li>
                <li>Sending a verification code to your email or phone</li>
                <li>Confirming your identity with 2-3 data points</li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Questions?</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Contact us at:
              </p>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-gray-700 mb-2">
                  <strong>Email:</strong>{' '}
                  <a href="mailto:donotsell@renoa.ai" className="text-green-600 hover:text-green-700 underline">
                    donotsell@renoa.ai
                  </a>{' '}
                  or{' '}
                  <a href="mailto:privacy@renoa.ai" className="text-green-600 hover:text-green-700 underline">
                    privacy@renoa.ai
                  </a>
                </p>
                <p className="text-gray-700 mb-2">
                  <strong>Phone:</strong>{' '}
                  <a href="tel:+13125550100" className="text-green-600 hover:text-green-700 underline">
                    (312) 555-0100
                  </a>
                </p>
                <p className="text-gray-700">
                  <strong>Mail:</strong> Renoa.ai, Attn: Privacy Officer, 123 N State Street, Suite 400, Chicago, IL 60602
                </p>
              </div>
              <p className="text-gray-700 leading-relaxed mt-4">
                For more information, read our{' '}
                <Link href="/privacy-policy" className="text-green-600 hover:text-green-700 font-semibold underline">
                  Privacy Policy
                </Link>.
              </p>
            </section>
          </div>
        </article>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <p className="text-gray-600 text-sm">
              &copy; {new Date().getFullYear()} Renoa AI. All rights reserved.
            </p>
            <div className="flex space-x-6 text-sm">
              <Link href="/privacy-policy" className="text-gray-600 hover:text-green-600 transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-gray-600 hover:text-green-600 transition-colors">
                Terms of Service
              </Link>
              <Link href="/cookie-policy" className="text-gray-600 hover:text-green-600 transition-colors">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
