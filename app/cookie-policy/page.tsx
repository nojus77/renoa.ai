import Link from 'next/link'

export default function CookiePolicyPage() {
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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Cookie Policy</h1>
          <p className="text-gray-600 mb-8">Last Updated: January 9, 2025</p>

          <div className="prose prose-green max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">What Are Cookies?</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Cookies are small text files stored on your device when you visit a website. They help websites remember your preferences and improve your experience.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">How We Use Cookies</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Renoa.ai uses cookies and similar tracking technologies for:
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Essential Cookies (Required)</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                These cookies are necessary for the website to function:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li><strong>Session Management</strong>: Keep you logged in</li>
                <li><strong>Security</strong>: Prevent fraud and protect your data</li>
                <li><strong>Load Balancing</strong>: Distribute traffic across servers</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-4">
                You cannot disable these cookies without impacting site functionality.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Analytics Cookies (Optional)</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                We use analytics tools to understand how visitors use our site:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li><strong>Google Analytics</strong>: Tracks page views, session duration, bounce rates</li>
                <li><strong>Conversion Tracking</strong>: Measures form submissions and sign-ups</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-4">
                These help us improve our website and services.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Marketing Cookies (Optional)</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                We use marketing cookies to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Remember your interests and show relevant content</li>
                <li>Measure ad campaign effectiveness</li>
                <li>Retarget visitors on other websites</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-4">
                You can opt-out of marketing cookies through your browser settings.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Types of Cookies We Use</h2>

              <div className="overflow-x-auto mb-4">
                <table className="min-w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-4 py-2 text-left text-gray-900 font-semibold">Cookie Type</th>
                      <th className="border border-gray-300 px-4 py-2 text-left text-gray-900 font-semibold">Purpose</th>
                      <th className="border border-gray-300 px-4 py-2 text-left text-gray-900 font-semibold">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2 text-gray-700">Session Cookies</td>
                      <td className="border border-gray-300 px-4 py-2 text-gray-700">Keep you logged in during your visit</td>
                      <td className="border border-gray-300 px-4 py-2 text-gray-700">Session only</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2 text-gray-700">Persistent Cookies</td>
                      <td className="border border-gray-300 px-4 py-2 text-gray-700">Remember your preferences</td>
                      <td className="border border-gray-300 px-4 py-2 text-gray-700">Up to 2 years</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2 text-gray-700">First-Party Cookies</td>
                      <td className="border border-gray-300 px-4 py-2 text-gray-700">Set by Renoa.ai directly</td>
                      <td className="border border-gray-300 px-4 py-2 text-gray-700">Varies</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2 text-gray-700">Third-Party Cookies</td>
                      <td className="border border-gray-300 px-4 py-2 text-gray-700">Set by our analytics/ad partners</td>
                      <td className="border border-gray-300 px-4 py-2 text-gray-700">Varies</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Third-Party Cookies</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We use services from third parties that may set their own cookies:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>
                  <strong>Google Analytics</strong>: Website analytics (
                  <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-700 underline">
                    Privacy Policy
                  </a>
                  )
                </li>
                <li>
                  <strong>Vercel Analytics</strong>: Performance monitoring (
                  <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-700 underline">
                    Privacy Policy
                  </a>
                  )
                </li>
                <li>
                  <strong>AWS/CloudFront</strong>: Content delivery (
                  <a href="https://aws.amazon.com/privacy/" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-700 underline">
                    Privacy Policy
                  </a>
                  )
                </li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-4">
                These third parties have their own privacy policies governing their use of cookies.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your Cookie Choices</h2>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Browser Settings</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                You can control cookies through your browser settings:
              </p>
              <ul className="list-none pl-0 text-gray-700 space-y-2 mb-4">
                <li><strong>Chrome</strong>: Settings &gt; Privacy and Security &gt; Cookies</li>
                <li><strong>Firefox</strong>: Options &gt; Privacy &amp; Security &gt; Cookies</li>
                <li><strong>Safari</strong>: Preferences &gt; Privacy &gt; Cookies</li>
                <li><strong>Edge</strong>: Settings &gt; Privacy &gt; Cookies</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Do Not Track</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                We currently do not respond to &quot;Do Not Track&quot; signals, as there is no industry standard for how to handle them.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Opt-Out Tools</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                You can opt-out of third-party advertising cookies:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>
                  <a href="https://adssettings.google.com/" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-700 underline">
                    Google Ads Settings
                  </a>
                </li>
                <li>
                  <a href="http://optout.networkadvertising.org/" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-700 underline">
                    Network Advertising Initiative Opt-Out
                  </a>
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Local Storage and Other Technologies</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                In addition to cookies, we may use:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li><strong>Local Storage</strong>: Store preferences locally in your browser</li>
                <li><strong>Session Storage</strong>: Temporary storage cleared when you close your browser</li>
                <li><strong>Web Beacons</strong>: Track email opens and engagement</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-4">
                These technologies serve similar purposes to cookies.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Mobile Devices</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                On mobile devices, we may use:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li><strong>Mobile Identifiers</strong>: Device IDs for analytics</li>
                <li><strong>App Permissions</strong>: Location, notifications (with your consent)</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-4">
                You can manage these through your device settings.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Impact of Disabling Cookies</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you disable cookies:
              </p>
              <ul className="list-none pl-0 text-gray-700 space-y-2 mb-4">
                <li>✅ You can still browse our website</li>
                <li>❌ You may not be able to log in</li>
                <li>❌ Some features may not work properly</li>
                <li>❌ We cannot remember your preferences</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Updates to This Policy</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We may update this Cookie Policy to reflect changes in technology or regulations. Check the &quot;Last Updated&quot; date at the top.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Us</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Questions about our use of cookies?
              </p>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-gray-700 mb-2">
                  <strong>Email:</strong>{' '}
                  <a href="mailto:privacy@renoa.ai" className="text-green-600 hover:text-green-700 underline">
                    privacy@renoa.ai
                  </a>
                </p>
                <p className="text-gray-700">
                  <strong>Website:</strong>{' '}
                  <a href="https://renoa.ai/contact" className="text-green-600 hover:text-green-700 underline">
                    renoa.ai/contact
                  </a>
                </p>
              </div>
              <p className="text-gray-700 leading-relaxed mt-4">
                For more information about how we handle your personal data, see our{' '}
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
