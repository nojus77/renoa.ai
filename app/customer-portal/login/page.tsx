'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Phone, Mail, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function CustomerLoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [loginMethod, setLoginMethod] = useState<'phone' | 'email'>('phone');
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');

  // Format phone number as user types
  const formatPhoneNumber = (value: string) => {
    const phoneNumber = value.replace(/[^\d]/g, '');
    const phoneNumberLength = phoneNumber.length;

    if (phoneNumberLength < 4) return phoneNumber;
    if (phoneNumberLength < 7) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    }
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
  };

  const handleSendVerification = async () => {
    if (loginMethod === 'phone') {
      const cleaned = phone.replace(/[^\d]/g, '');
      if (cleaned.length !== 10) {
        toast.error('Please enter a valid 10-digit phone number');
        return;
      }
    } else {
      if (!email || !email.includes('@')) {
        toast.error('Please enter a valid email address');
        return;
      }
    }

    setLoading(true);

    try {
      const response = await fetch('/api/customer/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: loginMethod,
          phone: loginMethod === 'phone' ? phone.replace(/[^\d]/g, '') : undefined,
          email: loginMethod === 'email' ? email : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send verification');
      }

      setVerificationSent(true);
      toast.success(`Verification code sent to your ${loginMethod}`);

      // In development, show the code
      if (data.devCode) {
        toast.info(`DEV MODE: Your code is ${data.devCode}`, { duration: 10000 });
      }
    } catch (error: any) {
      console.error('Error sending verification:', error);
      toast.error(error.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) {
      toast.error('Please enter the 6-digit code');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/customer/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: loginMethod,
          phone: loginMethod === 'phone' ? phone.replace(/[^\d]/g, '') : undefined,
          email: loginMethod === 'email' ? email : undefined,
          code: verificationCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Invalid verification code');
      }

      toast.success('Login successful!');
      router.push('/customer-portal/dashboard');
    } catch (error: any) {
      console.error('Error verifying code:', error);
      toast.error(error.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-emerald-600 mb-2">Renoa</h1>
          <p className="text-zinc-600">Customer Portal</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-zinc-200 p-8">
          {!verificationSent ? (
            <>
              <h2 className="text-2xl font-bold text-zinc-900 mb-2">Welcome back!</h2>
              <p className="text-zinc-600 mb-6">Sign in to track your jobs and invoices</p>

              {/* Login Method Tabs */}
              <div className="flex gap-2 p-1 bg-zinc-100 rounded-lg mb-6">
                <button
                  onClick={() => setLoginMethod('phone')}
                  className={`flex-1 py-2.5 px-4 rounded-md font-medium transition-all ${
                    loginMethod === 'phone'
                      ? 'bg-white text-emerald-600 shadow-sm'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  <Phone className="h-4 w-4 inline mr-2" />
                  Phone
                </button>
                <button
                  onClick={() => setLoginMethod('email')}
                  className={`flex-1 py-2.5 px-4 rounded-md font-medium transition-all ${
                    loginMethod === 'email'
                      ? 'bg-white text-emerald-600 shadow-sm'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  <Mail className="h-4 w-4 inline mr-2" />
                  Email
                </button>
              </div>

              {/* Phone Input */}
              {loginMethod === 'phone' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-zinc-700 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={handlePhoneChange}
                      placeholder="(555) 123-4567"
                      maxLength={14}
                      className="w-full pl-11 pr-4 py-3.5 bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-900 text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                  <p className="text-xs text-zinc-500 mt-2">
                    We'll send you a verification code via SMS
                  </p>
                </div>
              )}

              {/* Email Input */}
              {loginMethod === 'email' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-zinc-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full pl-11 pr-4 py-3.5 bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-900 text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                  <p className="text-xs text-zinc-500 mt-2">
                    We'll send you a magic link to sign in
                  </p>
                </div>
              )}

              <Button
                onClick={handleSendVerification}
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-6 text-lg font-semibold rounded-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-zinc-900 mb-2">Enter verification code</h2>
              <p className="text-zinc-600 mb-6">
                We sent a 6-digit code to{' '}
                <span className="font-semibold">
                  {loginMethod === 'phone' ? phone : email}
                </span>
              </p>

              <div className="mb-6">
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Verification Code
                </label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/[^\d]/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full px-4 py-4 bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-900 text-2xl text-center tracking-widest font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <Button
                onClick={handleVerifyCode}
                disabled={loading || verificationCode.length !== 6}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-6 text-lg font-semibold rounded-lg mb-4"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify & Sign In'
                )}
              </Button>

              <button
                onClick={() => {
                  setVerificationSent(false);
                  setVerificationCode('');
                }}
                className="w-full text-emerald-600 hover:text-emerald-700 font-medium py-2"
              >
                Use a different {loginMethod === 'phone' ? 'phone number' : 'email'}
              </button>

              <button
                onClick={handleSendVerification}
                disabled={loading}
                className="w-full text-zinc-600 hover:text-zinc-900 text-sm py-2 mt-2"
              >
                Didn't receive the code? Resend
              </button>
            </>
          )}
        </div>

        {/* Help Text */}
        <p className="text-center text-zinc-600 text-sm mt-6">
          Need help? Contact your service provider
        </p>
      </div>
    </div>
  );
}
