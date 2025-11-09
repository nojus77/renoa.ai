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
          <p className="text-gray-600 mb-4">Last Updated: January 9, 2025</p>
          <p className="text-gray-700 mb-8">
            <strong>Contact:</strong> Renoa.ai, 123 N State Street, Suite 400, Chicago, IL 60602 | legal@renoa.ai | (312) 555-0100
          </p>

          <div className="prose prose-green max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Agreement to Terms</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                By accessing or using Renoa.ai (the &quot;Service&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you disagree with any part of these Terms, you may not access the Service.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>PLEASE READ THE ARBITRATION AND CLASS ACTION WAIVER SECTION CAREFULLY - IT AFFECTS YOUR LEGAL RIGHTS.</strong>
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Description of Service</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Renoa.ai is an AI-powered platform that connects homeowners with local service providers for home improvement projects including landscaping, roofing, HVAC, plumbing, electrical work, painting, and related services.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>Our Service Area:</strong> Currently available in the greater Chicago area and expanding to additional U.S. markets. Check renoa.ai/service-areas for current coverage.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>We act as a matching platform only.</strong> We do not:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Employ or directly hire service providers</li>
                <li>Guarantee the quality, timeliness, or completion of work</li>
                <li>Assume liability for provider actions or negligence</li>
                <li>Control how providers operate their businesses</li>
                <li>Perform background checks or verify all provider credentials</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>Provider Verification:</strong> We perform basic verification of provider business licenses in select jurisdictions where publicly available. However, we do not guarantee the accuracy, validity, or current status of licenses, insurance, or bonds. You are responsible for verifying all provider credentials before hiring.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Eligibility</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                You must be:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>At least 18 years old</li>
                <li>Able to form a binding contract under applicable law</li>
                <li>Located in an area where our Service is available (see renoa.ai/service-areas)</li>
                <li>Not barred from using the Service under U.S. law</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">User Accounts</h2>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Account Creation</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                To use certain features, you may need to create an account. You agree to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Provide accurate, current, and complete information</li>
                <li>Keep your password secure and confidential</li>
                <li>Notify us immediately of any unauthorized access</li>
                <li>Accept responsibility for all activities under your account</li>
                <li>Update your information promptly when it changes</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Account Termination</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                We may suspend or terminate your account if you:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Violate these Terms</li>
                <li>Provide false or misleading information</li>
                <li>Engage in fraudulent or illegal activity</li>
                <li>Abuse the platform, providers, or other users</li>
                <li>Fail to pay fees owed (for provider accounts)</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-4">
                You may terminate your account at any time by emailing hello@renoa.ai.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">User Responsibilities</h2>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Prohibited Uses</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                You agree NOT to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Use the Service for any illegal purpose</li>
                <li>Harass, abuse, threaten, or harm service providers or other users</li>
                <li>Submit false, fraudulent, or misleading project requests</li>
                <li>Attempt to bypass our AI matching system or manipulate results</li>
                <li>Scrape, copy, or reverse engineer our content or software</li>
                <li>Transmit viruses, malware, or malicious code</li>
                <li>Impersonate others or misrepresent your identity or affiliation</li>
                <li>Use the Service to compete with us or build a similar product</li>
                <li>Contact providers outside our platform to avoid fees (if applicable)</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Project Requests and Consent to Contact</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>By submitting a project request, you:</strong>
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                1. <strong>Consent to be contacted</strong> by Renoa.ai and matched service providers via:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li><strong>Phone calls</strong> (including autodialed and prerecorded calls)</li>
                <li><strong>Text messages/SMS</strong> (including autodialed messages)</li>
                <li><strong>Email</strong></li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-4">
                2. <strong>Agree to receive communications even if</strong> your phone number is on a Do Not Call registry
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                3. <strong>Understand that:</strong>
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li><strong>Standard message and data rates may apply</strong> for text messages</li>
                <li><strong>Reply STOP to opt-out</strong> of SMS, <strong>HELP for assistance</strong></li>
                <li><strong>Consent is not a condition</strong> of using our service</li>
                <li>Providers may charge for quotes, consultations, or project assessments</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-4">
                4. <strong>Commit to:</strong>
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Respond to providers in good faith</li>
                <li>Provide accurate project information</li>
                <li>Not submit frivolous or fake requests</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Service Provider Disclaimer</h2>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">No Employment Relationship</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Service providers on our platform are <strong>independent contractors</strong>. They are not employees, agents, or representatives of Renoa.ai.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">No Warranties on Quality or Performance</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>WE DO NOT:</strong>
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Guarantee the quality, safety, or legality of work performed</li>
                <li>Verify all licenses, insurance, or bonds (though we encourage proper credentials)</li>
                <li>Supervise, direct, or control how providers perform work</li>
                <li>Warrant that providers will complete work on time or at all</li>
                <li>Assume responsibility for disputes between you and providers</li>
                <li>Guarantee pricing, availability, or provider responsiveness</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Your Responsibility</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>YOU ARE RESPONSIBLE FOR:</strong>
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Verifying provider credentials (licenses, insurance, bonding, references)</li>
                <li>Negotiating contracts, terms, and pricing directly with providers</li>
                <li>Ensuring providers have proper licensing for your project type</li>
                <li>Obtaining necessary permits and approvals</li>
                <li>Resolving disputes with providers directly</li>
                <li>Making payment directly to providers (not through us)</li>
                <li>Ensuring your property is safe for providers to work</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>Recommendation:</strong> Always request proof of insurance and valid licenses before hiring any provider.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Pricing and Payment</h2>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Free for Homeowners</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Our matching service is currently free for homeowners. We reserve the right to introduce fees in the future with at least 30 days&apos; advance notice.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Provider Fees</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Service providers may pay us:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>A commission or percentage of project value (typically 10-20%)</li>
                <li>A per-lead fee for introductions</li>
                <li>Subscription fees for platform access</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-4">
                These fees do not affect the price you negotiate with providers.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Intellectual Property</h2>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Our Content</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                All content on Renoa.ai (text, graphics, logos, software, AI algorithms, design) is owned by us or our licensors and protected by U.S. and international copyright, trademark, and patent laws.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                You may not:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Copy, modify, distribute, or create derivative works</li>
                <li>Use our trademarks, logos, or branding without written permission</li>
                <li>Reverse engineer, decompile, or disassemble our software</li>
                <li>Frame or mirror any part of our website</li>
                <li>Use automated tools to access or scrape our content</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">User Content</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                When you submit project descriptions, reviews, or feedback, you grant us a <strong>non-exclusive, worldwide, royalty-free, perpetual, irrevocable, transferable license</strong> to use, reproduce, modify, display, distribute, and create derivative works from that content for operating, promoting, and improving our Service.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                You represent that you own or have rights to any content you submit.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Limitation of Liability</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>TO THE MAXIMUM EXTENT PERMITTED BY LAW:</strong>
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Disclaimer of Warranties</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, OR COURSE OF PERFORMANCE.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Limitation of Damages</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>WE ARE NOT LIABLE FOR:</strong>
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Quality, safety, timeliness, or completion of work by service providers</li>
                <li>Injuries, property damage, or losses from provider services</li>
                <li>Provider conduct, negligence, fraud, or criminal acts</li>
                <li>Project delays, cancellations, or cost overruns</li>
                <li>Indirect, incidental, consequential, punitive, or special damages</li>
                <li>Loss of profits, revenue, data, goodwill, or business opportunities</li>
                <li>Damages exceeding $100 or amounts you paid us (whichever is greater)</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">State Law Exceptions</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>Some states do not allow limitations on implied warranties or exclusions/limitations of certain damages. In those jurisdictions, these limitations apply only to the extent permitted by law.</strong> Additionally, some states provide additional consumer protections that cannot be waived - those protections remain in effect.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Essential Purpose</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                If any limitation is found unenforceable, liability shall be limited to the maximum extent permitted, and the above limitations shall be deemed to reflect a reasonable allocation of risk.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Indemnification</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                You agree to <strong>indemnify, defend, and hold harmless</strong> Renoa.ai, its officers, directors, employees, agents, and affiliates from any claims, damages, losses, liabilities, costs, or expenses (including reasonable attorney fees) arising from:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Your use or misuse of the Service</li>
                <li>Your violation of these Terms</li>
                <li>Your violation of any law, regulation, or rights of others</li>
                <li>Disputes with service providers</li>
                <li>Content you submit or transmit</li>
                <li>Negligence or willful misconduct</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-4">
                This indemnification survives termination of these Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Dispute Resolution</h2>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Informal Resolution (Required First Step)</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>Before filing any lawsuit or arbitration</strong>, you agree to contact us at legal@renoa.ai and attempt to resolve the dispute informally for at least 30 days. Provide:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Your name and contact information</li>
                <li>Description of the dispute</li>
                <li>Relief sought</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-4">
                We&apos;ll work in good faith to resolve the issue.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Binding Arbitration (Mandatory)</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>If informal resolution fails, you and Renoa.ai agree to resolve disputes through final and binding arbitration, NOT in court, except for:</strong>
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Small claims court cases (under applicable dollar limit)</li>
                <li>Injunctive relief for intellectual property violations</li>
                <li>Disputes you opt-out of (see opt-out section below)</li>
              </ul>

              <h4 className="text-lg font-semibold text-gray-900 mb-2 mt-4">Arbitration Rules</h4>
              <p className="text-gray-700 leading-relaxed mb-4">
                Arbitration will be conducted under the <strong>Consumer Arbitration Rules of the American Arbitration Association (AAA)</strong>, available at adr.org.
              </p>

              <h4 className="text-lg font-semibold text-gray-900 mb-2 mt-4">Arbitration Process</h4>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li><strong>Filing:</strong> Either party may initiate by filing with AAA</li>
                <li><strong>Location:</strong> Conducted in Cook County, Illinois (or your county of residence if you prefer)</li>
                <li><strong>Costs:</strong> We&apos;ll pay all AAA filing, administration, and arbitrator fees for claims under $10,000. For claims over $10,000, fees are allocated per AAA rules.</li>
                <li><strong>Award:</strong> The arbitrator&apos;s decision is final and binding, enforceable in any court</li>
              </ul>

              <h4 className="text-lg font-semibold text-gray-900 mb-2 mt-4">What Arbitrator Can Award</h4>
              <p className="text-gray-700 leading-relaxed mb-4">
                The arbitrator may award the same damages and relief as a court (including attorney fees if authorized by law) but only to you individually.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Class Action Waiver (Important - Read Carefully)</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>YOU AND RENOA.AI AGREE THAT DISPUTES WILL BE RESOLVED INDIVIDUALLY, NOT AS PART OF A CLASS ACTION, CONSOLIDATED ACTION, OR REPRESENTATIVE PROCEEDING.</strong>
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>You waive any right to participate in a class action</li>
                <li>The arbitrator cannot consolidate multiple people&apos;s claims</li>
                <li>The arbitrator cannot preside over any class or representative proceeding</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>If this class action waiver is found unenforceable, the entire arbitration provision is void (but not other parts of these Terms).</strong>
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">30-Day Opt-Out Right</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>You may opt-out of arbitration</strong> by emailing legal@renoa.ai within <strong>30 days of first accepting these Terms</strong> with:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Subject line: &quot;Arbitration Opt-Out&quot;</li>
                <li>Your name, address, email, and phone number</li>
                <li>Statement: &quot;I opt out of the arbitration provision in Renoa.ai&apos;s Terms of Service&quot;</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you opt out, these Terms still apply but disputes will be resolved in court (not arbitration).
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Changes to Arbitration Provision</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                If we make material changes to this arbitration provision (other than address changes), you may reject the change by emailing legal@renoa.ai within 30 days of the change, in which case the prior arbitration provision applies.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Governing Law and Venue</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                These Terms are governed by the <strong>laws of the State of Illinois</strong>, without regard to conflict of law principles.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>For disputes not subject to arbitration</strong> (e.g., small claims or if you opted out), you agree to submit to the personal jurisdiction of state and federal courts located in <strong>Cook County, Illinois</strong>.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Changes to Terms</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We may modify these Terms at any time. We&apos;ll notify you of material changes by:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Posting updated Terms with a new &quot;Last Updated&quot; date</li>
                <li>Sending email notification to registered users</li>
                <li>Displaying a prominent notice on our website for 30 days</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>Continued use after changes constitutes acceptance.</strong> If you disagree with changes, stop using the Service and close your account.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                Material changes affecting arbitration rights will include a 30-day opt-out period (see Arbitration section).
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Severability</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                If any provision of these Terms is found unenforceable or invalid, that provision will be limited or eliminated to the minimum extent necessary, and the remaining provisions will remain in full force and effect.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">No Waiver</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Our failure to enforce any right or provision of these Terms does not constitute a waiver of that right or provision.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Entire Agreement</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                These Terms, along with our Privacy Policy and Cookie Policy, constitute the entire agreement between you and Renoa.ai regarding the Service and supersede all prior agreements.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Assignment</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                You may not assign or transfer these Terms without our written consent. We may assign these Terms without restriction. Any attempted assignment in violation of this section is void.
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
                  <strong>Phone:</strong> (312) 555-0100
                </p>
                <p className="text-gray-700 mb-2">
                  <strong>Mail:</strong> Renoa.ai, Attn: Legal Department, 123 N State Street, Suite 400, Chicago, IL 60602
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
