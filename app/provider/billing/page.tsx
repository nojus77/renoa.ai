'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProviderLayout from '@/components/provider/ProviderLayout';
import { Button } from '@/components/ui/button';
import { CreditCard, Users, Download, AlertCircle, CheckCircle, Calendar, DollarSign, Info } from 'lucide-react';
import { toast } from 'sonner';

interface SeatUsage {
  activeSeats: number;
  maxSeats: number;
  pricePerSeat: number;
  planType: string | null;
  currentPeriodEnd: Date | null;
  canAddSeats: boolean;
  subscriptionStatus: string | null;
  proratedCostForNewSeat: number;
  isNearingLimit?: boolean;
  isAtLimit?: boolean;
}

interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: string;
}

export default function BillingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [providerId, setProviderId] = useState('');
  const [providerName, setProviderName] = useState('');
  const [userRole, setUserRole] = useState('');
  const [seatUsage, setSeatUsage] = useState<SeatUsage | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  useEffect(() => {
    const id = localStorage.getItem('providerId');
    const name = localStorage.getItem('providerName');
    const role = localStorage.getItem('userRole');

    if (!id || !name) {
      router.push('/provider/login');
      return;
    }

    if (role !== 'owner') {
      toast.error('Only owners can access billing');
      router.push('/provider/home');
      return;
    }

    setProviderId(id);
    setProviderName(name);
    setUserRole(role);

    fetchData(id);
  }, [router]);

  const fetchData = async (id: string) => {
    setLoading(true);
    try {
      // Fetch seat usage
      const seatRes = await fetch(`/api/provider/billing/seats?providerId=${id}`);
      const seatData = await seatRes.json();
      if (seatRes.ok) {
        setSeatUsage(seatData);
      }

      // Fetch team members
      const teamRes = await fetch(`/api/provider/team?providerId=${id}`);
      const teamData = await teamRes.json();
      if (teamRes.ok) {
        setTeamMembers(teamData.users || []);
      }
    } catch (error) {
      console.error('Error fetching billing data:', error);
      toast.error('Failed to load billing data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getTotalMonthly = () => {
    if (!seatUsage) return 0;
    return seatUsage.activeSeats * seatUsage.pricePerSeat;
  };

  const handleUpgrade = () => {
    // TODO: Implement plan upgrade
    toast.info('Plan upgrade coming soon!');
  };

  const handleUpdatePayment = () => {
    // TODO: Implement payment method update
    toast.info('Payment method update coming soon!');
  };

  const handleCancelSubscription = () => {
    if (!confirm('Are you sure you want to cancel your subscription? Your team will lose access at the end of the billing period.')) {
      return;
    }
    // TODO: Implement subscription cancellation
    toast.info('Subscription cancellation coming soon!');
  };

  if (loading) {
    return (
      <ProviderLayout providerName={providerName}>
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
        </div>
      </ProviderLayout>
    );
  }

  return (
    <ProviderLayout providerName={providerName}>
      <div className="min-h-screen bg-zinc-950 p-6">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-zinc-100 mb-2">Subscription & Billing</h1>
            <p className="text-zinc-400">Manage your plan, seats, and payment methods</p>
          </div>

          {/* Subscription Overview */}
          <div className="bg-gradient-to-br from-emerald-900/20 to-emerald-800/10 border border-emerald-500/30 rounded-xl p-6 mb-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-zinc-100 mb-1">Current Plan</h2>
                <p className="text-sm text-zinc-400">
                  {seatUsage?.planType === 'monthly' ? 'Monthly' : seatUsage?.planType === 'annual' ? 'Annual' : 'No active plan'}
                </p>
              </div>
              {seatUsage?.subscriptionStatus && (
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  seatUsage.subscriptionStatus === 'active' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                  seatUsage.subscriptionStatus === 'past_due' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                  'bg-zinc-500/20 text-zinc-400 border border-zinc-500/30'
                }`}>
                  {seatUsage.subscriptionStatus.replace('_', ' ')}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800 relative group">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-emerald-400" />
                    <p className="text-xs text-zinc-400">Price per Seat</p>
                  </div>
                  <div className="relative">
                    <Info className="h-3 w-3 text-zinc-600 cursor-help" />
                    <div className="absolute bottom-full right-0 mb-1 px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-[10px] text-zinc-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                      Monthly cost per team member
                    </div>
                  </div>
                </div>
                <p className="text-2xl font-bold text-zinc-100">
                  {seatUsage ? formatCurrency(seatUsage.pricePerSeat) : '$0.00'}
                  <span className="text-sm text-zinc-400 ml-1">/mo</span>
                </p>
              </div>

              <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800 relative group">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-400" />
                    <p className="text-xs text-zinc-400">Active Seats</p>
                  </div>
                  <div className="relative">
                    <Info className="h-3 w-3 text-zinc-600 cursor-help" />
                    <div className="absolute bottom-full right-0 mb-1 px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-[10px] text-zinc-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                      Team members using paid seats
                    </div>
                  </div>
                </div>
                <p className="text-2xl font-bold text-zinc-100">
                  {seatUsage?.activeSeats}
                  <span className="text-sm text-zinc-400 ml-1">seats</span>
                </p>
              </div>

              <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800 relative group">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-purple-400" />
                    <p className="text-xs text-zinc-400">Next Billing</p>
                  </div>
                  <div className="relative">
                    <Info className="h-3 w-3 text-zinc-600 cursor-help" />
                    <div className="absolute bottom-full right-0 mb-1 px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-[10px] text-zinc-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                      Date of next subscription charge
                    </div>
                  </div>
                </div>
                <p className="text-sm font-semibold text-zinc-100">
                  {formatDate(seatUsage?.currentPeriodEnd || null)}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
              <div>
                <p className="text-sm text-zinc-400 mb-1">Total per month</p>
                <p className="text-3xl font-bold text-emerald-400">
                  {formatCurrency(getTotalMonthly())}
                </p>
              </div>
              {seatUsage?.planType === 'monthly' && (
                <Button
                  onClick={handleUpgrade}
                  className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400"
                >
                  Upgrade to Annual (Save 33%)
                </Button>
              )}
            </div>
          </div>

          {/* Seat Management */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-zinc-100">Team Members</h2>
                <p className="text-sm text-zinc-400 mt-1">
                  Add team members anytime - {formatCurrency(seatUsage?.pricePerSeat || 0)} per seat/month
                </p>
              </div>
              <Button
                onClick={() => router.push('/provider/settings/team')}
                className="bg-emerald-600 hover:bg-emerald-500"
              >
                <Users className="h-4 w-4 mr-2" />
                Add Team Member
              </Button>
            </div>

            <div className="space-y-2">
              {teamMembers.filter(m => m.status === 'active').map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 bg-zinc-800/30 rounded-lg border border-zinc-800"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-400 flex items-center justify-center text-white font-bold">
                      {member.firstName[0]}{member.lastName[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-100">
                        {member.firstName} {member.lastName}
                      </p>
                      <p className="text-xs text-zinc-400">{member.email}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    member.role === 'owner' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                    member.role === 'office' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                    'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {member.role}
                  </span>
                </div>
              ))}
            </div>

            {seatUsage && seatUsage.canAddSeats && seatUsage.proratedCostForNewSeat > 0 && (
              <div className="mt-4 p-4 bg-blue-900/20 border border-blue-600/30 rounded-lg">
                <p className="text-sm text-zinc-300">
                  <strong>Adding a seat:</strong> {formatCurrency(seatUsage.proratedCostForNewSeat)} prorated charge now, then {formatCurrency(seatUsage.pricePerSeat)}/month
                </p>
              </div>
            )}

            {/* Enterprise Notice for teams nearing 50 seats */}
            {seatUsage && seatUsage.isNearingLimit && !seatUsage.isAtLimit && (
              <div className="mt-4 p-4 bg-emerald-900/20 border border-emerald-600/30 rounded-lg">
                <p className="text-sm text-emerald-300">
                  <strong>Growing fast?</strong> Enterprise pricing with volume discounts available for teams over 50 seats.{' '}
                  <a href="mailto:sales@renoa.ai?subject=Enterprise%20Pricing" className="underline hover:text-emerald-200">
                    Contact us
                  </a>
                </p>
              </div>
            )}
          </div>

          {/* Payment & Actions */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-zinc-100 mb-4">Payment & Actions</h2>

            <div className="space-y-3">
              <Button
                onClick={handleUpdatePayment}
                variant="outline"
                className="w-full justify-start border-zinc-700 hover:bg-zinc-800"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Update Payment Method
              </Button>

              <Button
                onClick={() => router.push('/provider/billing/history')}
                variant="outline"
                className="w-full justify-start border-zinc-700 hover:bg-zinc-800"
              >
                <Download className="h-4 w-4 mr-2" />
                View Billing History
              </Button>

              <Button
                onClick={handleCancelSubscription}
                variant="outline"
                className="w-full justify-start border-red-900/50 text-red-400 hover:bg-red-900/20 hover:border-red-900"
              >
                <AlertCircle className="h-4 w-4 mr-2" />
                Cancel Subscription
              </Button>
            </div>
          </div>
        </div>
      </div>
    </ProviderLayout>
  );
}
