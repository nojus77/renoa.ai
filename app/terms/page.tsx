import Link from 'next/link'

export default function TermsPage() {
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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
          <p className="text-gray-600 mb-8">Last Updated: January 9, 2025</p>

          <div className="prose prose-green max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Agreement to Terms</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                By accessing or using Renoa.ai (the &quot;Service&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you disagree with any part of these Terms, you may not access the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Description of Service</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Renoa.ai is an AI-powered platform that connects homeowners with local service providers for home improvement projects including landscaping, roofing, HVAC, plumbing, electrical work, painting, and related services.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>We act as a matching platform only.</strong> We do not:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Employ or directly hire service providers</li>
                <li>Guarantee the quality of work performed</li>
                <li>Assume liability for provider actions</li>
                <li>Control how providers operate their businesses</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Eligibility</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                You must be:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>At least 18 years old</li>
                <li>Able to form a binding contract</li>
                <li>Located in an area where our Service is available</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">User Accounts</h2>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Account Creation</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                To use certain features, you may need to create an account. You agree to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Provide accurate and complete information</li>
                <li>Keep your password secure</li>
                <li>Notify us immediately of unauthorized access</li>
                <li>Accept responsibility for all activities under your account</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Account Termination</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                We may suspend or terminate your account if you:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Violate these Terms</li>
                <li>Provide false information</li>
                <li>Engage in fraudulent activity</li>
                <li>Abuse the platform or other users</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">User Responsibilities</h2>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Prohibited Uses</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                You agree NOT to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Use the Service for any illegal purpose</li>
                <li>Harass, abuse, or harm service providers or other users</li>
                <li>Submit false or misleading project requests</li>
                <li>Attempt to bypass our AI matching system</li>
                <li>Scrape or copy our content without permission</li>
                <li>Transmit viruses or malicious code</li>
                <li>Impersonate others or misrepresent your identity</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Project Requests</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                When submitting a project request, you:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Consent to be contacted by matched providers via phone, email, and SMS</li>
                <li>Agree to respond to providers in good faith</li>
                <li>Understand that providers may charge for quotes or consultations</li>
                <li>Accept that we cannot guarantee provider availability</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Service Provider Disclaimer</h2>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">No Employment Relationship</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Service providers on our platform are independent contractors. They are not employees, agents, or representatives of Renoa.ai.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">No Warranties on Quality</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                We do not:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Guarantee the quality of work</li>
                <li>Verify licenses or insurance (though we encourage it)</li>
                <li>Supervise how work is performed</li>
                <li>Warrant that providers will complete work</li>
                <li>Assume responsibility for disputes between you and providers</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Your Responsibility</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                You are responsible for:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Verifying provider credentials</li>
                <li>Negotiating contracts directly with providers</li>
                <li>Ensuring proper licensing and insurance</li>
                <li>Resolving disputes with providers</li>
                <li>Making payment directly to providers</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Pricing and Payment</h2>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Free for Homeowners</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Our matching service is currently free for homeowners. We reserve the right to introduce fees in the future with advance notice.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Provider Fees</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Service providers may pay us a commission or fee for leads. This does not affect the price you pay to providers.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Intellectual Property</h2>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Our Content</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                All content on Renoa.ai (text, graphics, logos, software) is owned by us or our licensors and protected by copyright, trademark, and other laws.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                You may not:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Copy, modify, or distribute our content</li>
                <li>Use our trademarks without permission</li>
                <li>Reverse engineer our software</li>
                <li>Create derivative works</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">User Content</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                When you submit project descriptions or reviews, you grant us a non-exclusive, worldwide, royalty-free license to use, display, and distribute that content for operating and promoting our Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Limitation of Liability</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>TO THE MAXIMUM EXTENT PERMITTED BY LAW:</strong>
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                We are NOT liable for:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Quality of work performed by service providers</li>
                <li>Injuries, damages, or losses from provider services</li>
                <li>Provider conduct or negligence</li>
                <li>Project delays or cancellations</li>
                <li>Indirect, incidental, or consequential damages</li>
                <li>Loss of profits, data, or business opportunities</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>OUR TOTAL LIABILITY TO YOU SHALL NOT EXCEED $100 OR THE AMOUNT YOU PAID US (IF ANY), WHICHEVER IS GREATER.</strong>
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Indemnification</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                You agree to indemnify and hold harmless Renoa.ai from any claims, damages, or expenses (including attorney fees) arising from:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Your use of the Service</li>
                <li>Your violation of these Terms</li>
                <li>Your violation of any law or rights of others</li>
                <li>Disputes with service providers</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Dispute Resolution</h2>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Informal Resolution</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Before filing a lawsuit, you agree to contact us at legal@renoa.ai to attempt to resolve the dispute informally.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Arbitration</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                If we cannot resolve a dispute informally, you agree to resolve it through <strong>binding arbitration</strong> rather than court, except for:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Small claims court cases</li>
                <li>Injunctive relief for intellectual property violations</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-4">
                Arbitration will be conducted under the American Arbitration Association (AAA) rules.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Class Action Waiver</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                You agree to resolve disputes individually, not as part of a class action or consolidated proceeding.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Governing Law</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                These Terms are governed by the laws of the State of Illinois, without regard to conflict of law principles. You agree to submit to the jurisdiction of state and federal courts in Cook County, Illinois.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Changes to Terms</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We may modify these Terms at any time. We&apos;ll notify you of material changes by:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Posting the updated Terms with a new &quot;Last Updated&quot; date</li>
                <li>Sending an email notification</li>
                <li>Displaying a notice on our website</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-4">
                Continued use of the Service after changes constitutes acceptance of the new Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Severability</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                If any provision of these Terms is found unenforceable, the remaining provisions will remain in full effect.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Entire Agreement</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                These Terms, along with our Privacy Policy and Cookie Policy, constitute the entire agreement between you and Renoa.ai.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Us</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                For questions about these Terms:
              </p>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-gray-700 mb-2">
                  <strong>Email:</strong>{' '}
                  <a href="mailto:legal@renoa.ai" className="text-green-600 hover:text-green-700 underline">
                    legal@renoa.ai
                  </a>
                </p>
                <p className="text-gray-700 mb-2">
                  <strong>Address:</strong> Renoa.ai, Chicago, IL
                </p>
                <p className="text-gray-700">
                  <strong>Website:</strong>{' '}
                  <a href="https://renoa.ai/contact" className="text-green-600 hover:text-green-700 underline">
                    renoa.ai/contact
                  </a>
                </p>
              </div>
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
