"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Building2, Eye, EyeOff } from 'lucide-react';

export default function ProviderLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/provider/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: password || undefined }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Login failed');
        return;
      }

      // Store session data
      localStorage.setItem('providerId', data.provider.id);
      localStorage.setItem('providerName', data.provider.businessName);

      // If multi-user login, also store user data
      if (data.user) {
        localStorage.setItem('userId', data.user.id);
        localStorage.setItem('userEmail', data.user.email);
        localStorage.setItem('userRole', data.user.role);
        localStorage.setItem('userName', `${data.user.firstName} ${data.user.lastName}`);

        // Store worker-specific data for field workers
        if (data.user.role === 'field') {
          localStorage.setItem('workerUserId', data.user.id);
          localStorage.setItem('workerProviderId', data.provider.id);
          localStorage.setItem('workerFirstName', data.user.firstName);
        }
      }

      // If needs password setup (legacy provider auto-migrated)
      if (data.needsPasswordSetup) {
        toast.success('Login successful! Please set up a password for your account.', {
          duration: 5000,
        });
      } else {
        toast.success('Login successful!');
      }

      // Route based on user role
      if (data.user && data.user.role === 'field') {
        router.push('/worker/dashboard');
      } else if (data.user && data.user.role === 'office') {
        router.push('/provider/calendar');
      } else {
        // Owner and other roles go to home
        router.push('/provider/home');
      }
    } catch (error) {
      toast.error('Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-900 to-emerald-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-zinc-950 border-zinc-800">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-emerald-500/20 rounded-full">
              <Building2 className="h-8 w-8 text-emerald-400" />
            </div>
          </div>
          <CardTitle className="text-2xl text-zinc-100">Provider Portal</CardTitle>
          <CardDescription className="text-zinc-400">
            Sign in to view your leads and manage your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
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
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-zinc-200">
                Password <span className="text-zinc-500 text-xs">(optional for legacy accounts)</span>
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="bg-zinc-900 border-zinc-800 text-zinc-100 pr-10"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-300"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>

            <div className="flex justify-center">
              <a
                href="/provider/forgot-password"
                className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                Forgot password?
              </a>
            </div>

            <p className="text-xs text-zinc-500 text-center mt-4">
              Team members: Use your email and password provided by your administrator
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}