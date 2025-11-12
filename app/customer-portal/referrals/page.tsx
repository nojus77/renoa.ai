'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Gift,
  Copy,
  Mail,
  MessageSquare,
  CheckCircle,
  TrendingUp,
  DollarSign,
  Clock,
  UserCheck,
  Loader2,
  AlertCircle,
  Share2,
  QrCode,
  Sparkles
} from 'lucide-react';
import CustomerLayout from '@/components/customer/CustomerLayout';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Referral {
  id: string;
  referredEmail: string;
  referredPhone: string | null;
  status: string;
  createdAt: string;
  referredCustomer: {
    name: string;
    email: string | null;
  } | null;
  creditAmount: number;
}

interface ReferralStats {
  totalEarned: number;
  availableCredit: number;
  thisMonthReferrals: number;
  totalReferrals: number;
  successfulReferrals: number;
}

export default function ReferralsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [referralCode, setReferralCode] = useState('');
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [stats, setStats] = useState<ReferralStats>({
    totalEarned: 0,
    availableCredit: 0,
    thisMonthReferrals: 0,
    totalReferrals: 0,
    successfulReferrals: 0
  });
  const [copied, setCopied] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePhone, setInvitePhone] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchReferralData();
  }, []);

  const fetchReferralData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/customer/referrals');

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/customer-portal/login');
          return;
        }
        throw new Error('Failed to fetch referral data');
      }

      const data = await response.json();

      if (data.referralCode) {
        setReferralCode(data.referralCode);
      }

      if (data.referrals) {
        setReferrals(data.referrals);
      }

      if (data.stats) {
        setStats(data.stats);
      }
    } catch (error: any) {
      console.error('Error fetching referral data:', error);
      toast.error(error.message || 'Failed to load referral data');
    } finally {
      setLoading(false);
    }
  };

  const referralLink = typeof window !== 'undefined' ? `${window.location.origin}/r/${referralCode}` : '';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareEmail = (customEmail?: string) => {
    const email = customEmail || '';
    const subject = encodeURIComponent('Get $50 off your first home service!');
    const body = encodeURIComponent(
      `Hey! I use Renoa for home services and love it. Get $50 off your first booking:\n\n${referralLink}\n\nJust click the link to sign up. You'll save $50 and I'll earn a credit too!`
    );
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  };

  const handleShareText = () => {
    const message = encodeURIComponent(
      `Hey! I use Renoa for home services and love it. Get $50 off your first booking: ${referralLink}`
    );
    window.location.href = `sms:?&body=${message}`;
  };

  const handleSendInvite = async () => {
    if (!inviteEmail && !invitePhone) {
      toast.error('Please enter an email or phone number');
      return;
    }

    try {
      setSending(true);

      const response = await fetch('/api/customer/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referredEmail: inviteEmail,
          referredPhone: invitePhone
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send invite');
      }

      toast.success('Invite sent successfully!');
      setInviteEmail('');
      setInvitePhone('');
      fetchReferralData(); // Refresh data
    } catch (error: any) {
      console.error('Error sending invite:', error);
      toast.error(error.message || 'Failed to send invite');
    } finally {
      setSending(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200">
            <Clock className="h-3 w-3" />
            Pending
          </span>
        );
      case 'signed_up':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
            <UserCheck className="h-3 w-3" />
            Signed Up
          </span>
        );
      case 'completed_job':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200">
            <CheckCircle className="h-3 w-3" />
            Completed Job
          </span>
        );
      case 'credited':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
            <DollarSign className="h-3 w-3" />
            You Earned $50!
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <CustomerLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 mb-2">Referral Program</h1>
        <p className="text-zinc-600">
          Share the love and earn $50 for every friend who completes their first service
        </p>
      </div>

      {/* How It Works */}
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border-2 border-emerald-200 p-6 mb-8">
        <h2 className="text-xl font-bold text-zinc-900 mb-6 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-emerald-600" />
          How It Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-600 text-white text-2xl font-bold flex items-center justify-center mx-auto mb-3 shadow-lg">
              1
            </div>
            <h3 className="font-bold text-zinc-900 mb-2">Share Your Link</h3>
            <p className="text-sm text-zinc-600">
              Send your unique referral link to friends via text, email, or social media
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-teal-600 text-white text-2xl font-bold flex items-center justify-center mx-auto mb-3 shadow-lg">
              2
            </div>
            <h3 className="font-bold text-zinc-900 mb-2">They Get $50 Off</h3>
            <p className="text-sm text-zinc-600">
              Your friend signs up and gets $50 off their first service
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-green-600 text-white text-2xl font-bold flex items-center justify-center mx-auto mb-3 shadow-lg">
              3
            </div>
            <h3 className="font-bold text-zinc-900 mb-2">You Earn $50</h3>
            <p className="text-sm text-zinc-600">
              When they complete their first job, you get $50 credit!
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Stats Cards */}
        <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-zinc-600">This Month</p>
              <p className="text-2xl font-bold text-zinc-900">{stats.thisMonthReferrals}</p>
            </div>
          </div>
          <p className="text-xs text-zinc-500">Referrals sent</p>
        </div>

        <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-zinc-600">Total Earned</p>
              <p className="text-2xl font-bold text-zinc-900">${stats.totalEarned.toFixed(0)}</p>
            </div>
          </div>
          <p className="text-xs text-zinc-500">From {stats.successfulReferrals} successful referral{stats.successfulReferrals !== 1 ? 's' : ''}</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl border border-emerald-300 p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center">
              <Gift className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-emerald-100">Available Credit</p>
              <p className="text-2xl font-bold text-white">${stats.availableCredit.toFixed(0)}</p>
            </div>
          </div>
          <p className="text-xs text-emerald-100">Ready to use on your next service</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Share Section */}
        <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-zinc-900 mb-4 flex items-center gap-2">
            <Share2 className="h-5 w-5 text-emerald-600" />
            Share Your Link
          </h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              Your Referral Link
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={referralLink}
                readOnly
                className="flex-1 px-4 py-3 border border-zinc-300 rounded-lg bg-zinc-50 font-mono text-sm"
              />
              <Button
                onClick={handleCopyLink}
                className={copied ? 'bg-green-600 hover:bg-green-600' : 'bg-emerald-600 hover:bg-emerald-500'}
              >
                {copied ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              Pre-Written Message Template
            </label>
            <textarea
              readOnly
              value={`Hey! I use Renoa for home services and love it. Get $50 off your first booking:\n\n${referralLink}\n\nJust click the link to sign up. You'll save $50 and I'll earn a credit too!`}
              rows={4}
              className="w-full px-4 py-3 border border-zinc-300 rounded-lg bg-zinc-50 text-sm resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleShareText}
              variant="outline"
              className="border-emerald-300 hover:bg-emerald-50"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Share via Text
            </Button>
            <Button
              onClick={() => handleShareEmail()}
              variant="outline"
              className="border-emerald-300 hover:bg-emerald-50"
            >
              <Mail className="h-4 w-4 mr-2" />
              Share via Email
            </Button>
          </div>
        </div>

        {/* Send Invite Section */}
        <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-zinc-900 mb-4 flex items-center gap-2">
            <Mail className="h-5 w-5 text-emerald-600" />
            Send Direct Invite
          </h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="friend@example.com"
              className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              Phone Number (Optional)
            </label>
            <input
              type="tel"
              value={invitePhone}
              onChange={(e) => setInvitePhone(e.target.value)}
              placeholder="(555) 123-4567"
              className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <Button
            onClick={handleSendInvite}
            disabled={sending || (!inviteEmail && !invitePhone)}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50"
          >
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4 mr-2" />
                Send Invitation
              </>
            )}
          </Button>

          <p className="text-xs text-zinc-500 text-center mt-3">
            We&apos;ll track this referral and notify you when they sign up
          </p>
        </div>
      </div>

      {/* Referral History */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm">
        <div className="p-6 border-b border-zinc-200">
          <h2 className="text-lg font-bold text-zinc-900">Referral History</h2>
          <p className="text-sm text-zinc-600">Track the progress of your referrals</p>
        </div>

        {referrals.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-50 border-b border-zinc-200">
                <tr>
                  <th className="text-left p-4 text-sm font-semibold text-zinc-700">Contact</th>
                  <th className="text-left p-4 text-sm font-semibold text-zinc-700">Status</th>
                  <th className="text-left p-4 text-sm font-semibold text-zinc-700">Date Referred</th>
                  <th className="text-left p-4 text-sm font-semibold text-zinc-700">Reward</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {referrals.map((referral) => (
                  <tr key={referral.id} className="hover:bg-zinc-50">
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-zinc-900">
                          {referral.referredCustomer?.name || referral.referredEmail}
                        </p>
                        {referral.referredCustomer?.email && (
                          <p className="text-sm text-zinc-600">{referral.referredCustomer.email}</p>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      {getStatusBadge(referral.status)}
                    </td>
                    <td className="p-4 text-sm text-zinc-600">
                      {formatDate(referral.createdAt)}
                    </td>
                    <td className="p-4">
                      {referral.status === 'credited' ? (
                        <span className="font-bold text-green-600">+${referral.creditAmount.toFixed(0)}</span>
                      ) : (
                        <span className="text-zinc-400">$0</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <Gift className="h-12 w-12 text-zinc-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-zinc-900 mb-2">No referrals yet</h3>
            <p className="text-zinc-600 mb-4">
              Share your referral link to start earning rewards!
            </p>
          </div>
        )}
      </div>
    </CustomerLayout>
  );
}
