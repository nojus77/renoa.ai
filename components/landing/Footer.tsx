import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-primary-600 flex items-center justify-center">
                <span className="text-xl font-bold">R</span>
              </div>
              <span className="text-2xl font-bold">Renoa.ai</span>
            </div>
            <p className="text-gray-400">
              AI-powered platform connecting homeowners with top-rated service
              providers.
            </p>
          </div>

          {/* For Homeowners */}
          <div>
            <h3 className="text-lg font-semibold mb-4">For Homeowners</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/get-started"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Get Started
                </Link>
              </li>
              <li>
                <Link
                  href="/how-it-works"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  How It Works
                </Link>
              </li>
              <li>
                <Link
                  href="/services"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  All Services
                </Link>
              </li>
              <li>
                <Link
                  href="/pricing"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* For Providers */}
          <div>
            <h3 className="text-lg font-semibold mb-4">For Providers</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/provider-signup"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Join Our Network
                </Link>
              </li>
              <li>
                <Link
                  href="/provider-benefits"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Benefits
                </Link>
              </li>
              <li>
                <Link
                  href="/provider-pricing"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Subscription Plans
                </Link>
              </li>
              <li>
                <Link
                  href="/provider-login"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Provider Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/about"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
          <p>&copy; {currentYear} Renoa.ai. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

