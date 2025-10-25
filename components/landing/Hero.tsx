"use client"

import Link from "next/link";

export default function Hero() {
  // Smooth scroll handler for Get Started button
  const handleGetStartedClick = () => {
    const el = document.getElementById('email-optin');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white">
      {/* Navigation */}
      <nav className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <span className="text-xl font-bold">R</span>
            </div>
            <span className="text-2xl font-bold">Renoa.ai</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              href="/login"
              className="hidden md:inline-block text-white/90 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/provider-signup"
              className="px-4 py-2 bg-white text-primary-700 rounded-lg font-semibold hover:bg-white/90 transition-all"
            >
              For Providers
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Content */}
      <div className="container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Connect with Top-Rated{" "}
            <span className="text-primary-200">Home Service Pros</span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-white/90 max-w-2xl mx-auto">
            AI-powered platform that matches new homeowners with the best local
            contractors for every home improvement need.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              type="button"
              onClick={handleGetStartedClick}
              className="w-full sm:w-auto px-8 py-4 bg-white text-primary-700 rounded-lg text-lg font-semibold hover:bg-white/90 transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 cursor-pointer"
            >
              Get Started Free
            </button>
            <Link
              href="#how-it-works"
              className="w-full sm:w-auto px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-lg text-lg font-semibold hover:bg-white/20 transition-all border-2 border-white/30"
            >
              How It Works
            </Link>
          </div>
        </div>

        {/* Email Opt-in Form */}
        <div id="email-optin" className="mt-16 max-w-xl mx-auto bg-white/10 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold mb-2 text-white">Join the Waitlist</h2>
          <form className="flex flex-col sm:flex-row gap-4 items-center justify-center">
            <input
              type="email"
              required
              placeholder="Your email address"
              className="w-full sm:w-2/3 px-4 py-3 rounded-lg bg-white/80 text-primary-900 placeholder:text-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-3 rounded-lg bg-primary-700 text-white font-semibold hover:bg-primary-800 transition-all shadow"
            >
              Join Waitlist
            </button>
          </form>
          <p className="mt-3 text-sm text-white/80 text-center">
            Get notified when we launch in your area. We respect your privacy and you can unsubscribe anytime.
          </p>
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
          <div className="text-center">
            <div className="text-3xl font-bold">10K+</div>
            <div className="text-white/80 text-sm">Homeowners Served</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">500+</div>
            <div className="text-white/80 text-sm">Verified Providers</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">4.8★</div>
            <div className="text-white/80 text-sm">Average Rating</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">95%</div>
            <div className="text-white/80 text-sm">Satisfaction Rate</div>
          </div>
        </div>
      </div>

      {/* Wave Divider */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          viewBox="0 0 1440 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full"
        >
          <path
            d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
            fill="white"
          />
        </svg>
      </div>
    </section>
  );
}