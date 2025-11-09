import Link from 'next/link'

export default function PrivacyPolicyPage() {
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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-gray-600 mb-8">Last Updated: January 9, 2025</p>

          <div className="prose prose-green max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Introduction</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Welcome to Renoa.ai (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). We respect your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Information We Collect</h2>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Information You Provide to Us</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                When you use Renoa.ai, we collect the following information:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li><strong>Contact Information</strong>: First name, last name, email address, phone number</li>
                <li><strong>Project Information</strong>: Service type requested, project description, preferred timeline</li>
                <li><strong>Location Information</strong>: Street address, city, state, ZIP code</li>
                <li><strong>Communication Preferences</strong>: How you prefer to be contacted</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Information Collected Automatically</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                When you visit our website, we automatically collect:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li><strong>Device Information</strong>: IP address, browser type, operating system</li>
                <li><strong>Usage Data</strong>: Pages visited, time spent on pages, links clicked</li>
                <li><strong>Cookies and Tracking Technologies</strong>: See our Cookie Policy below</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">How We Use Your Information</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We use your information to:
              </p>
              <ol className="list-decimal pl-6 text-gray-700 space-y-2 mb-4">
                <li><strong>Match You with Service Providers</strong>: Connect you with qualified contractors in your area</li>
                <li><strong>Communicate with You</strong>: Send project updates, provider matches, and service confirmations</li>
                <li><strong>Improve Our Services</strong>: Analyze usage patterns and optimize our AI matching algorithm</li>
                <li><strong>Send Marketing Communications</strong>: Share tips, promotions, and updates (you can opt-out anytime)</li>
                <li><strong>Comply with Legal Obligations</strong>: Respond to legal requests and prevent fraud</li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">How We Share Your Information</h2>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">With Service Providers</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                When you submit a request, we share your contact information and project details with matched service providers so they can contact you with quotes.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">With Third-Party Service Providers</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                We share information with trusted partners who help us operate our platform:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li><strong>Email Service Providers</strong> (AWS SES, Resend): To send transactional and marketing emails</li>
                <li><strong>Analytics Providers</strong> (Google Analytics): To understand how users interact with our site</li>
                <li><strong>Cloud Hosting</strong> (Vercel, Supabase): To store data securely</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Legal Requirements</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                We may disclose your information if required by law, court order, or government request.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your Email Communications Rights</h2>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Marketing Emails</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>You can unsubscribe from marketing emails anytime by clicking &quot;Unsubscribe&quot; at the bottom of any email</li>
                <li>You can also email us at hello@renoa.ai to opt-out</li>
                <li>Unsubscribe requests are processed within 48 hours</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Transactional Emails</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                We may still send you service-related emails (like provider matches and confirmations) even if you opt-out of marketing.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your Privacy Rights</h2>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Access and Correction</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                You have the right to access and update your personal information. Contact us at privacy@renoa.ai.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Data Deletion</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                You can request deletion of your personal information. We&apos;ll delete your data within 30 days unless we&apos;re legally required to keep it.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Do Not Sell My Information (California Residents)</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                We do not sell your personal information to third parties.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">GDPR Rights (EU Residents)</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you&apos;re in the EU, you have additional rights:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Right to data portability</li>
                <li>Right to restrict processing</li>
                <li>Right to object to processing</li>
                <li>Right to lodge a complaint with a supervisory authority</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Security</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We implement industry-standard security measures including:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>SSL/TLS encryption for data transmission</li>
                <li>Secure cloud storage with access controls</li>
                <li>Regular security audits and updates</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-4">
                However, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Retention</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We retain your information for as long as:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Your account is active</li>
                <li>Needed to provide services</li>
                <li>Required by law (typically 7 years for business records)</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-4">
                After this period, we securely delete or anonymize your data.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Children&apos;s Privacy</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Renoa.ai is not intended for users under 18. We do not knowingly collect information from children. If you believe we&apos;ve collected information from a child, contact us immediately at privacy@renoa.ai.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Changes to This Privacy Policy</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We may update this Privacy Policy periodically. We&apos;ll notify you of significant changes by:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Posting the new policy on this page</li>
                <li>Updating the &quot;Last Updated&quot; date</li>
                <li>Sending you an email notification (for material changes)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Us</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you have questions about this Privacy Policy, contact us:
              </p>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-gray-700 mb-2">
                  <strong>Email:</strong>{' '}
                  <a href="mailto:privacy@renoa.ai" className="text-green-600 hover:text-green-700 underline">
                    privacy@renoa.ai
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
