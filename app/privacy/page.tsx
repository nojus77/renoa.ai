export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 py-16 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
        <p className="mb-4">We value your privacy. Renoa.ai collects your email address only for the purpose of matching you with home service providers and sending you relevant updates about our platform.</p>
        <ul className="list-disc pl-6 mb-4">
          <li>We do <strong>not</strong> sell or share your data with third parties.</li>
          <li>You will receive email communications about service matches, platform updates, and offers.</li>
          <li>You can unsubscribe from our emails at any time using the link provided in each message.</li>
        </ul>
        <p>If you have any questions about your privacy, contact us at <a href="mailto:hello@renoa.ai" className="underline">hello@renoa.ai</a>.</p>
      </div>
    </main>
  );
}
