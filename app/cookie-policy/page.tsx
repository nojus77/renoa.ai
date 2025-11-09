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
                Cookies are small text files stored on your device when you visit a website. They help websites remember your preferences, keep you logged in, and improve your experience.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Cookie Consent &amp; Your Choices</h2>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">First Visit - Cookie Banner</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                When you first visit Renoa.ai, you&apos;ll see a cookie banner. <strong>We only set essential cookies until you consent to optional cookies.</strong>
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                You can choose:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li><strong>Accept All</strong>: Allow all cookies (essential, analytics, marketing)</li>
                <li><strong>Reject All</strong>: Only essential cookies (site may not function fully)</li>
                <li><strong>Manage Preferences</strong>: Choose which cookie types to allow</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Managing Cookies Anytime</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Visit our <strong>Cookie Preference Center</strong> at renoa.ai/cookie-preferences to change your choices anytime.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Global Privacy Control (GPC)</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>We honor Global Privacy Control (GPC) signals.</strong> If your browser sends a GPC signal, we&apos;ll:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Block non-essential cookies by default</li>
                <li>Opt you out of cookie-based sale/sharing under CPRA</li>
                <li>Respect your preference across visits</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-4">
                Enable GPC in browsers like Brave, Firefox, or via browser extensions.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Types of Cookies We Use</h2>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Essential Cookies (Cannot Be Disabled)</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                These cookies are necessary for the website to function:
              </p>

              <div className="overflow-x-auto mb-4">
                <table className="min-w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-4 py-2 text-left text-gray-900 font-semibold">Cookie Name</th>
                      <th className="border border-gray-300 px-4 py-2 text-left text-gray-900 font-semibold">Provider</th>
                      <th className="border border-gray-300 px-4 py-2 text-left text-gray-900 font-semibold">Purpose</th>
                      <th className="border border-gray-300 px-4 py-2 text-left text-gray-900 font-semibold">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2 text-gray-700 font-mono text-sm">__session</td>
                      <td className="border border-gray-300 px-4 py-2 text-gray-700">Renoa.ai</td>
                      <td className="border border-gray-300 px-4 py-2 text-gray-700">Keep you logged in during your visit</td>
                      <td className="border border-gray-300 px-4 py-2 text-gray-700">Session</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2 text-gray-700 font-mono text-sm">csrf_token</td>
                      <td className="border border-gray-300 px-4 py-2 text-gray-700">Renoa.ai</td>
                      <td className="border border-gray-300 px-4 py-2 text-gray-700">Security - prevent cross-site request forgery</td>
                      <td className="border border-gray-300 px-4 py-2 text-gray-700">Session</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2 text-gray-700 font-mono text-sm">cookie_consent</td>
                      <td className="border border-gray-300 px-4 py-2 text-gray-700">Renoa.ai</td>
                      <td className="border border-gray-300 px-4 py-2 text-gray-700">Remember your cookie preferences</td>
                      <td className="border border-gray-300 px-4 py-2 text-gray-700">1 year</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-gray-700 leading-relaxed mb-4">
                You cannot disable these without impacting site functionality.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Analytics Cookies (Optional - Requires Consent)</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                These help us understand how visitors use our site:
              </p>

              <div className="overflow-x-auto mb-4">
                <table className="min-w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-4 py-2 text-left text-gray-900 font-semibold">Cookie Name</th>
                      <th className="border border-gray-300 px-4 py-2 text-left text-gray-900 font-semibold">Provider</th>
                      <th className="border border-gray-300 px-4 py-2 text-left text-gray-900 font-semibold">Purpose</th>
                      <th className="border border-gray-300 px-4 py-2 text-left text-gray-900 font-semibold">Duration</th>
                      <th className="border border-gray-300 px-4 py-2 text-left text-gray-900 font-semibold">Opt-Out</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2 text-gray-700 font-mono text-sm">_ga</td>
                      <td className="border border-gray-300 px-4 py-2 text-gray-700">Google Analytics</td>
                      <td className="border border-gray-300 px-4 py-2 text-gray-700">Distinguish users, track sessions</td>
                      <td className="border border-gray-300 px-4 py-2 text-gray-700">2 years</td>
                      <td className="border border-gray-300 px-4 py-2 text-gray-700">
                        <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-700 underline text-sm">
                          Google Opt-Out
                        </a>
                      </td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2 text-gray-700 font-mono text-sm">_gid</td>
                      <td className="border border-gray-300 px-4 py-2 text-gray-700">Google Analytics</td>
                      <td className="border border-gray-300 px-4 py-2 text-gray-700">Distinguish users</td>
                      <td className="border border-gray-300 px-4 py-2 text-gray-700">24 hours</td>
                      <td className="border border-gray-300 px-4 py-2 text-gray-700">
                        <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-700 underline text-sm">
                          Google Opt-Out
                        </a>
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2 text-gray-700 font-mono text-sm">_gat</td>
                      <td className="border border-gray-300 px-4 py-2 text-gray-700">Google Analytics</td>
                      <td className="border border-gray-300 px-4 py-2 text-gray-700">Throttle request rate</td>
                      <td className="border border-gray-300 px-4 py-2 text-gray-700">1 minute</td>
                      <td className="border border-gray-300 px-4 py-2 text-gray-700">
                        <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-700 underline text-sm">
                          Google Opt-Out
                        </a>
                      </td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2 text-gray-700 font-mono text-sm">va-*</td>
                      <td className="border border-gray-300 px-4 py-2 text-gray-700">Vercel Analytics</td>
                      <td className="border border-gray-300 px-4 py-2 text-gray-700">Performance monitoring, anonymized</td>
                      <td className="border border-gray-300 px-4 py-2 text-gray-700">24 hours</td>
                      <td className="border border-gray-300 px-4 py-2 text-gray-700 text-sm">Preference center</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>Lawful Basis (GDPR)</strong>: Consent (you can withdraw anytime).
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Marketing Cookies (Optional - Requires Consent)</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                These enable advertising and retargeting:
              </p>

              <div className="overflow-x-auto mb-4">
                <table className="min-w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-4 py-2 text-left text-gray-900 font-semibold">Cookie Name</th>
                      <th className="border border-gray-300 px-4 py-2 text-left text-gray-900 font-semibold">Provider</th>
                      <th className="border border-gray-300 px-4 py-2 text-left text-gray-900 font-semibold">Purpose</th>
                      <th className="border border-gray-300 px-4 py-2 text-left text-gray-900 font-semibold">Duration</th>
                      <th className="border border-gray-300 px-4 py-2 text-left text-gray-900 font-semibold">Opt-Out</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2 text-gray-700 font-mono text-sm">_fbp</td>
                      <td className="border border-gray-300 px-4 py-2 text-gray-700">Facebook Pixel</td>
                      <td className="border border-gray-300 px-4 py-2 text-gray-700">Track conversions, build audiences</td>
                      <td className="border border-gray-300 px-4 py-2 text-gray-700">90 days</td>
                      <td className="border border-gray-300 px-4 py-2 text-gray-700">
                        <a href="https://www.facebook.com/ads/preferences" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-700 underline text-sm">
                          Facebook Settings
                        </a>
                      </td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2 text-gray-700 font-mono text-sm">_gcl_au</td>
                      <td className="border border-gray-300 px-4 py-2 text-gray-700">Google Ads</td>
                      <td className="border border-gray-300 px-4 py-2 text-gray-700">Measure ad effectiveness, retargeting</td>
                      <td className="border border-gray-300 px-4 py-2 text-gray-700">90 days</td>
                      <td className="border border-gray-300 px-4 py-2 text-gray-700">
                        <a href="https://adssettings.google.com/" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-700 underline text-sm">
                          Google Ads Settings
                        </a>
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2 text-gray-700 font-mono text-sm">IDE</td>
                      <td className="border border-gray-300 px-4 py-2 text-gray-700">DoubleClick (Google)</td>
                      <td className="border border-gray-300 px-4 py-2 text-gray-700">Serve targeted ads</td>
                      <td className="border border-gray-300 px-4 py-2 text-gray-700">1 year</td>
                      <td className="border border-gray-300 px-4 py-2 text-gray-700">
                        <a href="http://optout.networkadvertising.org/" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-700 underline text-sm">
                          NAI Opt-Out
                        </a>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>Lawful Basis (GDPR)</strong>: Consent (you can withdraw anytime).
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>What &quot;sharing&quot; means</strong>: When you consent to marketing cookies, we &quot;share&quot; your browsing behavior with these advertising networks (considered a &quot;sale&quot; under CPRA).
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Other Tracking Technologies</h2>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Local Storage</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                We use HTML5 local storage to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Save your form progress (so you don&apos;t lose data if you navigate away)</li>
                <li>Store UI preferences (theme, layout settings)</li>
                <li>Cache static resources for faster loading</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>Control</strong>: Clear via browser settings (Developer Tools &gt; Application &gt; Local Storage).
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Session Storage</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Temporary storage cleared when you close your browser. Used for:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Current form state</li>
                <li>Temporary navigation data</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Web Beacons (Tracking Pixels)</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Tiny invisible images in emails to track:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Email opens</li>
                <li>Link clicks</li>
                <li>Engagement metrics</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>Control</strong>: Most email clients allow you to block images/tracking pixels.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Server Logs</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                We collect standard server logs:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>IP address</li>
                <li>Browser type</li>
                <li>Pages visited</li>
                <li>Timestamps</li>
                <li>Referring URLs</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>Retention</strong>: 90 days for security purposes.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Third-Party Cookies</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We use services from third parties that may set their own cookies:
              </p>

              <div className="overflow-x-auto mb-4">
                <table className="min-w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-4 py-2 text-left text-gray-900 font-semibold">Service</th>
                      <th className="border border-gray-300 px-4 py-2 text-left text-gray-900 font-semibold">Purpose</th>
                      <th className="border border-gray-300 px-4 py-2 text-left text-gray-900 font-semibold">Privacy Policy</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2 text-gray-700">Google Analytics</td>
                      <td className="border border-gray-300 px-4 py-2 text-gray-700">Website analytics</td>
                      <td className="border border-gray-300 px-4 py-2 text-gray-700">
                        <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-700 underline">
                          Google Privacy
                        </a>
                      </td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2 text-gray-700">Google Ads</td>
                      <td className="border border-gray-300 px-4 py-2 text-gray-700">Advertising and retargeting</td>
                      <td className="border border-gray-300 px-4 py-2 text-gray-700">
                        <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-700 underline">
                          Google Privacy
                        </a>
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2 text-gray-700">Facebook Pixel</td>
                      <td className="border border-gray-300 px-4 py-2 text-gray-700">Advertising and retargeting</td>
                      <td className="border border-gray-300 px-4 py-2 text-gray-700">
                        <a href="https://www.facebook.com/privacy/explanation" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-700 underline">
                          Facebook Privacy
                        </a>
                      </td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2 text-gray-700">Vercel</td>
                      <td className="border border-gray-300 px-4 py-2 text-gray-700">Performance monitoring</td>
                      <td className="border border-gray-300 px-4 py-2 text-gray-700">
                        <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-700 underline">
                          Vercel Privacy
                        </a>
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2 text-gray-700">AWS CloudFront</td>
                      <td className="border border-gray-300 px-4 py-2 text-gray-700">Content delivery</td>
                      <td className="border border-gray-300 px-4 py-2 text-gray-700">
                        <a href="https://aws.amazon.com/privacy/" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-700 underline">
                          AWS Privacy
                        </a>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-gray-700 leading-relaxed mb-4">
                These third parties have their own privacy policies governing cookies.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your Cookie Choices</h2>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Cookie Preference Center (Recommended)</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Visit renoa.ai/cookie-preferences to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>See all cookies we use</li>
                <li>Enable/disable cookie types</li>
                <li>Update preferences anytime</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Browser Settings</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                You can control cookies through your browser:
              </p>
              <ul className="list-none pl-0 text-gray-700 space-y-2 mb-4">
                <li><strong>Chrome</strong>: Settings &gt; Privacy and Security &gt; Cookies and other site data</li>
                <li><strong>Firefox</strong>: Options &gt; Privacy &amp; Security &gt; Cookies and Site Data</li>
                <li><strong>Safari</strong>: Preferences &gt; Privacy &gt; Manage Website Data</li>
                <li><strong>Edge</strong>: Settings &gt; Privacy, search, and services &gt; Cookies</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>Warning</strong>: Blocking all cookies may prevent site functionality (login, forms, etc.).
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Do Not Track (DNT)</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                We currently <strong>do not respond to Do Not Track (DNT) browser signals</strong> because there is no industry-wide standard. However, we <strong>do honor Global Privacy Control (GPC)</strong>, which is a newer, legally recognized signal.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Opt-Out Tools</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                To opt out of third-party advertising cookies:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>
                  <a href="https://adssettings.google.com/" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-700 underline">
                    Google Ads Settings
                  </a>
                </li>
                <li>
                  <a href="https://www.facebook.com/ads/preferences" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-700 underline">
                    Facebook Ad Preferences
                  </a>
                </li>
                <li>
                  <a href="http://optout.networkadvertising.org/" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-700 underline">
                    Network Advertising Initiative Opt-Out
                  </a>
                </li>
                <li>
                  <a href="http://optout.aboutads.info/" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-700 underline">
                    Digital Advertising Alliance Opt-Out
                  </a>
                </li>
                <li>
                  <a href="http://www.youronlinechoices.eu/" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-700 underline">
                    European Interactive Digital Advertising Alliance
                  </a>
                </li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>Note</strong>: Opting out doesn&apos;t stop ads, just makes them less personalized.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Mobile Devices</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                On mobile devices, we may use:
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Mobile Identifiers</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li><strong>iOS</strong>: IDFA (Identifier for Advertisers)</li>
                <li><strong>Android</strong>: AAID (Google Advertising ID)</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>Control</strong>:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li><strong>iOS</strong>: Settings &gt; Privacy &gt; Tracking (toggle off &quot;Allow Apps to Request to Track&quot;)</li>
                <li><strong>Android</strong>: Settings &gt; Google &gt; Ads &gt; Opt out of Ads Personalization</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">App Permissions</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you use our mobile app (future), we may request:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li><strong>Location</strong>: For location-based matching (you can deny)</li>
                <li><strong>Notifications</strong>: For project updates (you can disable)</li>
                <li><strong>Camera/Photos</strong>: To upload project photos (you can deny)</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-4">
                You control these in your device settings.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Impact of Disabling Cookies</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you disable cookies or reject consent:
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>What still works</strong>:
              </p>
              <ul className="list-none pl-0 text-gray-700 space-y-2 mb-4">
                <li>✅ Browse our website</li>
                <li>✅ Submit project requests (but UX may be degraded)</li>
                <li>✅ Contact us</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>What may not work</strong>:
              </p>
              <ul className="list-none pl-0 text-gray-700 space-y-2 mb-4">
                <li>❌ Stay logged into your account</li>
                <li>❌ Save form progress</li>
                <li>❌ Remember your preferences</li>
                <li>❌ See personalized content</li>
                <li>❌ Benefit from site performance optimizations</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>Essential cookies cannot be disabled</strong> without breaking core functionality.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">GDPR and UK Users</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                For users in the EU/UK:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li><strong>Consent required</strong>: We obtain your consent before setting non-essential cookies</li>
                <li><strong>Withdrawal</strong>: You can withdraw consent anytime via our preference center</li>
                <li><strong>Lawful basis</strong>: Essential cookies use &quot;legitimate interests&quot;; optional cookies use &quot;consent&quot;</li>
                <li><strong>Right to complain</strong>: Contact your local Data Protection Authority if you have concerns</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">California Privacy Rights (CPRA)</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                For California residents:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li><strong>Cookie-based sale/sharing</strong>: When you consent to marketing cookies, we &quot;share&quot; your data with advertising networks (considered &quot;sale&quot; under CPRA)</li>
                <li><strong>Opt-out</strong>: Click &quot;Do Not Sell or Share My Personal Information&quot; or enable GPC</li>
                <li><strong>Sensitive personal information</strong>: We don&apos;t collect sensitive PI via cookies</li>
                <li><strong>Right to limit</strong>: You can limit use of cookies via our preference center</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Updates to This Policy</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We may update this Cookie Policy to reflect changes in technology, regulations, or our practices. Check the &quot;Last Updated&quot; date at the top.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>Notification</strong>: We&apos;ll notify you of material changes via email or website banner.
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
                <p className="text-gray-700 mb-2">
                  <strong>Cookie Preference Center:</strong> renoa.ai/cookie-preferences
                </p>
                <p className="text-gray-700 mb-2">
                  <strong>Phone:</strong> (312) 555-0100
                </p>
                <p className="text-gray-700">
                  <strong>Mail:</strong> Renoa.ai, Attn: Privacy Officer, 123 N State Street, Suite 400, Chicago, IL 60602
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
