'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Calendar,
  DollarSign,
  Pause,
  Play,
  X,
  SkipForward,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import CustomerLayout from '@/components/customer/CustomerLayout';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import SubscriptionSetupModal from '@/components/customer/SubscriptionSetupModal';

interface Subscription {
  id: string;
  serviceType: string;
  frequency: 'weekly' | 'biweekly' | 'monthly';
  price: number;
  discountPercent: number;
  status: 'active' | 'paused' | 'cancelled';
  nextScheduledDate: string;
  startDate: string;
  pausedUntil?: string;
  provider: {
    id: string;
    businessName: string;
    phone: string;
    email: string;
  };
}

export default function SubscriptionsPage() {
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [setupModalOpen, setSetupModalOpen] = useState(false);
  const [pauseModalOpen, setPauseModalOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [pauseUntilDate, setPauseUntilDate] = useState('');
  const [providerData, setProviderData] = useState<any>(null);

  useEffect(() => {
    fetchSubscriptions();
    fetchProviderData();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const response = await fetch('/api/customer/subscriptions');
      if (!response.ok) throw new Error('Failed to fetch subscriptions');
      const data = await response.json();
      setSubscriptions(data.subscriptions || []);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      toast.error('Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const fetchProviderData = async () => {
    try {
      const response = await fetch('/api/customer/dashboard');
      if (response.ok) {
        const data = await response.json();
        setProviderData(data);
      }
    } catch (error) {
      console.error('Error fetching provider data:', error);
    }
  };

  const handlePause = async () => {
    if (!selectedSubscription || !pauseUntilDate) {
      toast.error('Please select a date to pause until');
      return;
    }

    try {
      const response = await fetch(`/api/customer/subscriptions/${selectedSubscription.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'pause',
          pausedUntil: pauseUntilDate,
        }),
      });

      if (!response.ok) throw new Error('Failed to pause subscription');

      toast.success('Subscription paused successfully');
      setPauseModalOpen(false);
      setSelectedSubscription(null);
      setPauseUntilDate('');
      fetchSubscriptions();
    } catch (error) {
      console.error('Error pausing subscription:', error);
      toast.error('Failed to pause subscription');
    }
  };

  const handleResume = async (subscriptionId: string) => {
    try {
      const response = await fetch(`/api/customer/subscriptions/${subscriptionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resume' }),
      });

      if (!response.ok) throw new Error('Failed to resume subscription');

      toast.success('Subscription resumed successfully');
      fetchSubscriptions();
    } catch (error) {
      console.error('Error resuming subscription:', error);
      toast.error('Failed to resume subscription');
    }
  };

  const handleSkip = async (subscriptionId: string) => {
    if (!confirm('Are you sure you want to skip the next scheduled service?')) return;

    try {
      const response = await fetch(`/api/customer/subscriptions/${subscriptionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'skip' }),
      });

      if (!response.ok) throw new Error('Failed to skip service');

      toast.success('Next service skipped successfully');
      fetchSubscriptions();
    } catch (error) {
      console.error('Error skipping service:', error);
      toast.error('Failed to skip service');
    }
  };

  const handleCancel = async (subscriptionId: string) => {
    if (!confirm('Are you sure you want to cancel this subscription?')) return;

    try {
      const response = await fetch(`/api/customer/subscriptions/${subscriptionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      });

      if (!response.ok) throw new Error('Failed to cancel subscription');

      toast.success('Subscription cancelled successfully');
      fetchSubscriptions();
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast.error('Failed to cancel subscription');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
            <CheckCircle className="h-3 w-3" />
            Active
          </span>
        );
      case 'paused':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
            <Clock className="h-3 w-3" />
            Paused
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-zinc-100 text-zinc-700 text-xs font-semibold rounded-full">
            <XCircle className="h-3 w-3" />
            Cancelled
          </span>
        );
    }
  };

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case 'weekly':
        return 'Every week';
      case 'biweekly':
        return 'Every 2 weeks';
      case 'monthly':
        return 'Every month';
      default:
        return frequency;
    }
  };

  if (loading) {
    return (
      <CustomerLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 mb-2">My Subscriptions</h1>
            <p className="text-zinc-600">
              Manage your recurring services and never worry about scheduling again
            </p>
          </div>
          <Button
            onClick={() => setSetupModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-500"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Add Subscription
          </Button>
        </div>

        {/* Empty State */}
        {subscriptions.length === 0 && (
          <div className="bg-white border-2 border-dashed border-zinc-300 rounded-xl p-12 text-center">
            <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-8 w-8 text-zinc-400" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 mb-2">No Subscriptions Yet</h3>
            <p className="text-zinc-600 mb-6 max-w-md mx-auto">
              Set up a recurring service to save 10% on every booking and never worry about scheduling again.
            </p>
            <Button
              onClick={() => setSetupModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-500"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Set Up Your First Subscription
            </Button>
          </div>
        )}

        {/* Subscriptions List */}
        <div className="space-y-4">
          {subscriptions.map((subscription) => (
            <div
              key={subscription.id}
              className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                    <Calendar className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold text-zinc-900">
                        {subscription.serviceType}
                      </h3>
                      {getStatusBadge(subscription.status)}
                    </div>
                    <p className="text-sm text-zinc-600 mb-1">
                      {subscription.provider.businessName}
                    </p>
                    <p className="text-sm text-zinc-500">
                      {getFrequencyLabel(subscription.frequency)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-emerald-600">
                    ${subscription.price.toFixed(2)}
                  </div>
                  <div className="text-xs text-emerald-600">
                    {subscription.discountPercent}% off
                  </div>
                </div>
              </div>

              {/* Next Service / Pause Info */}
              <div className="bg-zinc-50 rounded-lg p-3 mb-4">
                {subscription.status === 'active' && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-zinc-500" />
                    <span className="text-zinc-600">Next service:</span>
                    <span className="font-semibold text-zinc-900">
                      {new Date(subscription.nextScheduledDate).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                )}
                {subscription.status === 'paused' && subscription.pausedUntil && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-amber-600" />
                    <span className="text-zinc-600">Paused until:</span>
                    <span className="font-semibold text-amber-600">
                      {new Date(subscription.pausedUntil).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {subscription.status === 'cancelled' && (
                  <div className="flex items-center gap-2 text-sm">
                    <XCircle className="h-4 w-4 text-zinc-500" />
                    <span className="text-zinc-600">
                      This subscription has been cancelled
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {subscription.status === 'active' && (
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => handleSkip(subscription.id)}
                    variant="outline"
                    size="sm"
                  >
                    <SkipForward className="h-4 w-4 mr-1" />
                    Skip Next
                  </Button>
                  <Button
                    onClick={() => {
                      setSelectedSubscription(subscription);
                      setPauseModalOpen(true);
                    }}
                    variant="outline"
                    size="sm"
                  >
                    <Pause className="h-4 w-4 mr-1" />
                    Pause
                  </Button>
                  <Button
                    onClick={() => handleCancel(subscription.id)}
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:border-red-300"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              )}

              {subscription.status === 'paused' && (
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleResume(subscription.id)}
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-500"
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Resume
                  </Button>
                  <Button
                    onClick={() => handleCancel(subscription.id)}
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:border-red-300"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Setup Modal */}
      {providerData && (
        <SubscriptionSetupModal
          isOpen={setupModalOpen}
          onClose={() => {
            setSetupModalOpen(false);
            fetchSubscriptions();
          }}
          providerId={providerData.provider.id}
          providerName={providerData.provider.businessName}
          serviceTypes={providerData.provider.serviceTypes || ['Lawn Care', 'Landscaping']}
          averageJobPrice={150}
        />
      )}

      {/* Pause Modal */}
      {pauseModalOpen && selectedSubscription && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 relative">
            <button
              onClick={() => {
                setPauseModalOpen(false);
                setSelectedSubscription(null);
                setPauseUntilDate('');
              }}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-xl font-bold text-zinc-900 mb-4">Pause Subscription</h2>
            <p className="text-zinc-600 mb-4">
              Choose when you&apos;d like to resume your {selectedSubscription.serviceType} service.
            </p>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-zinc-700 mb-2">
                Resume Date *
              </label>
              <input
                type="date"
                value={pauseUntilDate}
                onChange={(e) => setPauseUntilDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setPauseModalOpen(false);
                  setSelectedSubscription(null);
                  setPauseUntilDate('');
                }}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handlePause}
                disabled={!pauseUntilDate}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500"
              >
                Confirm Pause
              </Button>
            </div>
          </div>
        </div>
      )}
    </CustomerLayout>
  );
}
