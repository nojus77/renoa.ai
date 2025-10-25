export default function TermsPage() {
  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 py-16 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
        <ul className="list-disc pl-6 mb-4">
          <li>Renoa.ai connects homeowners with service providers for home improvement projects.</li>
          <li>Users are responsible for providing accurate information and for their interactions with providers.</li>
          <li>We do our best to verify providers, but Renoa.ai is not liable for the quality of work or outcomes.</li>
          <li>By using our platform, you agree to receive email communications related to your service requests.</li>
          <li>Use of Renoa.ai is at your own risk. We are not responsible for any damages or losses.</li>
        </ul>
        <p>If you have any questions about these terms, contact us at <a href="mailto:hello@renoa.ai" className="underline">hello@renoa.ai</a>.</p>
      </div>
    </main>
  );
}
