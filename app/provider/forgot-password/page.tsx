"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Building2, ArrowLeft, Mail } from 'lucide-react';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Failed to send reset email');
        return;
      }

      setSubmitted(true);
      toast.success('Password reset email sent!');
    } catch (error) {
      toast.error('Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-900 to-orange-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-zinc-950 border-zinc-800">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-orange-500/20 rounded-full">
                <Mail className="h-8 w-8 text-orange-400" />
              </div>
            </div>
            <CardTitle className="text-2xl text-zinc-100">Check Your Email</CardTitle>
            <CardDescription className="text-zinc-400">
              We&apos;ve sent password reset instructions to your email
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-sm text-zinc-300">
              <p className="mb-2">
                If an account exists with <strong className="text-zinc-100">{email}</strong>, you will receive a password reset link shortly.
              </p>
              <p className="text-zinc-400">
                The link will expire in 1 hour. Please check your spam folder if you don&apos;t see it in your inbox.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                onClick={() => router.push('/provider/login')}
                className="w-full bg-orange-600 hover:bg-orange-500"
              >
                Back to Login
              </Button>
              <Button
                onClick={() => {
                  setSubmitted(false);
                  setEmail('');
                }}
                variant="outline"
                className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-900"
              >
                Send Another Email
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-900 to-orange-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-zinc-950 border-zinc-800">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-orange-500/20 rounded-full">
              <Building2 className="h-8 w-8 text-orange-400" />
            </div>
          </div>
          <CardTitle className="text-2xl text-zinc-100">Reset Your Password</CardTitle>
          <CardDescription className="text-zinc-400">
            Enter your email address and we&apos;ll send you a password reset link
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-zinc-200">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your-email@company.com"
                className="bg-zinc-900 border-zinc-800 text-zinc-100"
                disabled={loading}
                autoFocus
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-orange-600 hover:bg-orange-500"
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </Button>

            <Link
              href="/provider/login"
              className="flex items-center justify-center gap-2 text-sm text-zinc-400 hover:text-zinc-300 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Login
            </Link>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
