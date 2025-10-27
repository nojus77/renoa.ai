"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Building2 } from 'lucide-react';

export default function ProviderLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
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
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Login failed');
        return;
      }

      // Store provider session
      localStorage.setItem('providerId', data.provider.id);
      localStorage.setItem('providerName', data.provider.businessName);
      
      toast.success('Login successful!');
      router.push('/provider/dashboard');
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

            <Button 
              type="submit" 
              className="w-full bg-emerald-600 hover:bg-emerald-500"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>

            <p className="text-xs text-zinc-500 text-center mt-4">
              For security, we'll verify your email is registered in our system
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}