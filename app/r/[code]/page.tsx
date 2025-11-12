'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Gift,
  CheckCircle,
  Sparkles,
  ArrowRight,
  Loader2,
  AlertCircle,
  Home,
  Scissors,
  Droplets,
  Hammer
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Link from 'next/link';

interface ReferralInfo {
  referrerName: string;
  code: string;
  creditAmount: number;
}

export default function ReferralLandingPage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;

  const [loading, setLoading] = useState(true);
  const [referralInfo, setReferralInfo] = useState<ReferralInfo | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (code) {
      fetchReferralInfo();
    }
  }, [code]);

  const fetchReferralInfo = async () => {
    try {
      const response = await fetch(`/api/referrals/${code}`);

      if (!response.ok) {
        throw new Error('Invalid referral code');
      }

      const data = await response.json();
      setReferralInfo(data);
    } catch (error) {
      console.error('Error fetching referral info:', error);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const services = [
    { name: 'Lawn Care', icon: Scissors, color: 'from-green-500 to-emerald-600' },
    { name: 'Pool Service', icon: Droplets, color: 'from-blue-500 to-cyan-600' },
    { name: 'Home Repairs', icon: Hammer, color: 'from-orange-500 to-red-600' },
    { name: 'House Cleaning', icon: Home, color: 'from-purple-500 to-pink-600' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (error || !referralInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-zinc-900 mb-2">Invalid Referral Link</h1>
          <p className="text-zinc-600 mb-6">
            This referral code is not valid or has expired.
          </p>
          <Link href="/">
            <Button className="bg-emerald-600 hover:bg-emerald-500">
              Go to Homepage
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const firstName = referralInfo.referrerName.split(' ')[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="text-2xl font-bold text-emerald-600">
              Renoa
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/customer-portal/login">
                <Button variant="outline" size="sm" className="border-zinc-300">
                  Log In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          {/* Referrer Badge */}
          <div className="inline-flex items-center gap-2 bg-white rounded-full px-6 py-3 shadow-lg border-2 border-emerald-200 mb-6">
            <Gift className="h-5 w-5 text-emerald-600" />
            <span className="font-semibold text-zinc-900">
              {firstName} invited you to Renoa!
            </span>
          </div>

          <h1 className="text-5xl font-bold text-zinc-900 mb-4">
            Get{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
              ${referralInfo.creditAmount} Off
            </span>
            <br />
            Your First Service
          </h1>
          <p className="text-xl text-zinc-600 max-w-2xl mx-auto">
            Join Renoa and discover trusted home service professionals in your area.
            Your first booking comes with a special ${referralInfo.creditAmount} discount!
          </p>
        </div>

        {/* Discount Banner */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-8 mb-12 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>

          <div className="relative z-10 text-center text-white">
            <Sparkles className="h-12 w-12 mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-2">
              Special Offer: ${referralInfo.creditAmount} OFF
            </h2>
            <p className="text-emerald-100 mb-6">
              Automatically applied to your first service
            </p>
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur rounded-full px-6 py-3 border-2 border-white/40">
              <code className="text-white font-bold text-lg">
                {referralInfo.code}
              </code>
            </div>
          </div>
        </div>

        {/* Services Grid */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-zinc-900 text-center mb-8">
            Popular Services
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {services.map((service) => (
              <div
                key={service.name}
                className="bg-white rounded-xl p-6 text-center hover:shadow-lg transition-shadow border border-zinc-200"
              >
                <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${service.color} flex items-center justify-center mx-auto mb-3 shadow-md`}>
                  <service.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-semibold text-zinc-900">{service.name}</h3>
              </div>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-2xl p-8 mb-12 shadow-lg border border-zinc-200">
          <h2 className="text-2xl font-bold text-zinc-900 text-center mb-8">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-600 text-white text-2xl font-bold flex items-center justify-center mx-auto mb-4 shadow-lg">
                1
              </div>
              <h3 className="font-bold text-zinc-900 mb-2">Sign Up Free</h3>
              <p className="text-sm text-zinc-600">
                Create your account in less than 2 minutes - no credit card required
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-teal-600 text-white text-2xl font-bold flex items-center justify-center mx-auto mb-4 shadow-lg">
                2
              </div>
              <h3 className="font-bold text-zinc-900 mb-2">Book a Service</h3>
              <p className="text-sm text-zinc-600">
                Choose from lawn care, pool service, cleaning, and more
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-600 text-white text-2xl font-bold flex items-center justify-center mx-auto mb-4 shadow-lg">
                3
              </div>
              <h3 className="font-bold text-zinc-900 mb-2">Save ${referralInfo.creditAmount}</h3>
              <p className="text-sm text-zinc-600">
                Your discount is automatically applied at checkout
              </p>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="bg-gradient-to-br from-zinc-50 to-emerald-50 rounded-2xl p-8 mb-12 border-2 border-emerald-200">
          <h2 className="text-2xl font-bold text-zinc-900 text-center mb-6">
            Why Choose Renoa?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              'Trusted, verified service professionals',
              'Transparent pricing - no hidden fees',
              'Easy online booking and scheduling',
              'Secure payments and satisfaction guarantee',
              'Real-time updates and notifications',
              'Flexible cancellation policies'
            ].map((benefit, index) => (
              <div key={index} className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <span className="text-zinc-700">{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Link href="/">
            <Button
              size="lg"
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-lg px-12 py-6 rounded-xl shadow-xl hover:shadow-2xl transition-all"
            >
              Claim Your ${referralInfo.creditAmount} Discount
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </Link>
          <p className="text-sm text-zinc-500 mt-4">
            Join thousands of satisfied homeowners
          </p>
        </div>

        {/* Trust Badge */}
        <div className="mt-12 text-center">
          <p className="text-xs text-zinc-500 mb-2">
            Referred by {referralInfo.referrerName}
          </p>
          <div className="inline-flex items-center gap-2 text-xs text-zinc-400">
            <CheckCircle className="h-4 w-4" />
            <span>Secure · Verified · Trusted</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-zinc-200 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-sm text-zinc-600">
          <p>© 2025 Renoa. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
