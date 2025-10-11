import Link from "next/link";

export default function ProviderCTA() {
  return (
    <section className="py-20 bg-gradient-to-r from-primary-600 to-primary-800 text-white">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">
            Are You a Service Provider?
          </h2>
          <p className="text-xl mb-8 text-white/90">
            Join our network of top-rated professionals and grow your business
            with qualified leads
          </p>

          <div className="grid md:grid-cols-3 gap-6 mb-10">
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg">
              <div className="text-3xl font-bold mb-2">Qualified Leads</div>
              <p className="text-white/80">
                Only pay for homeowners actively seeking your services
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg">
              <div className="text-3xl font-bold mb-2">Instant Matching</div>
              <p className="text-white/80">
                AI connects you with perfect-fit customers automatically
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg">
              <div className="text-3xl font-bold mb-2">Grow Revenue</div>
              <p className="text-white/80">
                Increase bookings with our marketing automation tools
              </p>
            </div>
          </div>

          <Link
            href="/provider-signup"
            className="inline-block px-8 py-4 bg-white text-primary-700 rounded-lg text-lg font-semibold hover:bg-white/90 transition-all shadow-xl"
          >
            Join as a Provider
          </Link>
        </div>
      </div>
    </section>
  );
}

