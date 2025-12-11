"use client"

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Shield, Key, Search, Eye, EyeOff } from 'lucide-react';

interface Provider {
  id: string;
  businessName: string;
  email: string;
  ownerName: string;
}

export default function AdminResetPasswordPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [filteredProviders, setFilteredProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProviderId, setSelectedProviderId] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    fetchProviders();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const filtered = providers.filter(
        (p) =>
          p.businessName.toLowerCase().includes(query) ||
          p.email.toLowerCase().includes(query) ||
          p.ownerName.toLowerCase().includes(query)
      );
      setFilteredProviders(filtered);
      setShowDropdown(true);
    } else {
      setFilteredProviders(providers);
      setShowDropdown(false);
    }
  }, [searchQuery, providers]);

  const fetchProviders = async () => {
    try {
      const res = await fetch('/api/admin/reset-password');
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Failed to fetch providers');
        return;
      }

      setProviders(data.providers);
      setFilteredProviders(data.providers);
    } catch (error) {
      toast.error('Failed to fetch providers');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProvider = (provider: Provider) => {
    setSelectedProviderId(provider.id);
    setSearchQuery(`${provider.businessName} (${provider.email})`);
    setShowDropdown(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProviderId) {
      toast.error('Please select a provider');
      return;
    }

    if (!newPassword) {
      toast.error('Please enter a new password');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    setResetting(true);
    try {
      const res = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId: selectedProviderId,
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Failed to reset password');
        return;
      }

      toast.success(data.message || 'Password reset successfully');

      // Clear form
      setSelectedProviderId('');
      setSearchQuery('');
      setNewPassword('');
      setShowPassword(false);
    } catch (error) {
      toast.error('Failed to reset password');
    } finally {
      setResetting(false);
    }
  };

  const selectedProvider = providers.find((p) => p.id === selectedProviderId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-900 to-blue-900 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Shield className="h-6 w-6 text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold text-zinc-100">Admin Password Reset</h1>
          </div>
          <p className="text-zinc-400">
            Reset provider passwords without requiring email verification
          </p>
        </div>

        <Card className="bg-zinc-950 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100 flex items-center gap-2">
              <Key className="h-5 w-5 text-blue-400" />
              Reset Provider Password
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Select a provider and enter a new password to reset their account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleResetPassword} className="space-y-6">
              {/* Provider Search/Select */}
              <div className="space-y-2">
                <Label htmlFor="provider" className="text-zinc-200">
                  Select Provider
                </Label>
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <Input
                      id="provider"
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => searchQuery && setShowDropdown(true)}
                      placeholder="Search by company name or email..."
                      className="bg-zinc-900 border-zinc-800 text-zinc-100 pl-10"
                      disabled={loading}
                    />
                  </div>

                  {/* Dropdown */}
                  {showDropdown && filteredProviders.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-zinc-900 border border-zinc-800 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredProviders.map((provider) => (
                        <button
                          key={provider.id}
                          type="button"
                          onClick={() => handleSelectProvider(provider)}
                          className="w-full text-left px-4 py-3 hover:bg-zinc-800 transition-colors border-b border-zinc-800 last:border-b-0"
                        >
                          <div className="font-medium text-zinc-100">
                            {provider.businessName}
                          </div>
                          <div className="text-sm text-zinc-400">
                            {provider.email} • {provider.ownerName}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Selected Provider Display */}
                {selectedProvider && (
                  <div className="mt-2 p-3 bg-zinc-900 border border-zinc-800 rounded-lg">
                    <div className="text-sm text-zinc-400">Selected:</div>
                    <div className="font-medium text-zinc-100">
                      {selectedProvider.businessName}
                    </div>
                    <div className="text-sm text-zinc-400">
                      {selectedProvider.email}
                    </div>
                  </div>
                )}
              </div>

              {/* New Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-zinc-200">
                  New Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="bg-zinc-900 border-zinc-800 text-zinc-100 pr-10"
                    disabled={resetting || !selectedProviderId}
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
                <p className="text-xs text-zinc-500">
                  Must be at least 8 characters long
                </p>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500"
                disabled={resetting || !selectedProviderId || !newPassword}
              >
                {resetting ? 'Resetting Password...' : 'Reset Password'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <Card className="bg-zinc-950 border-zinc-800">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-zinc-100">
                {providers.length}
              </div>
              <div className="text-sm text-zinc-400">Total Providers</div>
            </CardContent>
          </Card>
          <Card className="bg-zinc-950 border-zinc-800">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-400">Admin</div>
              <div className="text-sm text-zinc-400">Password Reset Tool</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
