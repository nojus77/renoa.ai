'use client';

import { useState, useEffect } from 'react';
import { Gift, Copy, Mail, MessageSquare, CheckCircle, TrendingUp, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Link from 'next/link';

interface ReferralStats {
  totalEarned: number;
  availableCredit: number;
  thisMonthReferrals: number;
}

export default function ReferralWidget() {
  const [loading, setLoading] = useState(true);
  const [referralCode, setReferralCode] = useState('');
  const [stats, setStats] = useState<ReferralStats>({
    totalEarned: 0,
    availableCredit: 0,
    thisMonthReferrals: 0
  });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchReferralData();
  }, []);

  const fetchReferralData = async () => {
    try {
      const response = await fetch('/api/customer/referrals');
      const data = await response.json();

      if (data.referralCode) {
        setReferralCode(data.referralCode);
      }

      if (data.stats) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const referralLink = `${window.location.origin}/r/${referralCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareEmail = () => {
    const subject = encodeURIComponent('Get $50 off your first home service!');
    const body = encodeURIComponent(
      `Hey! I use Renoa for home services and love it. Get $50 off your first booking:\n\n${referralLink}\n\nJust click the link to sign up. You'll save $50 and I'll earn a credit too!`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handleShareText = () => {
    const message = encodeURIComponent(
      `Hey! I use Renoa for home services and love it. Get $50 off your first booking: ${referralLink}`
    );
    window.location.href = `sms:?&body=${message}`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border-2 border-zinc-200 p-6 animate-pulse">
        <div className="h-6 w-48 bg-zinc-200 rounded mb-4"></div>
        <div className="h-20 bg-zinc-100 rounded"></div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 rounded-xl border-2 border-emerald-200 p-6 relative overflow-hidden shadow-lg">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-300/20 rounded-full -mr-20 -mt-20"></div>
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-teal-300/20 rounded-full -ml-16 -mb-16"></div>

      {/* Header */}
      <div className="relative z-10 mb-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
              <Gift className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-zinc-900 mb-1">
                Earn $50 for Every Friend!
              </h2>
              <p className="text-sm text-zinc-700">
                Give friends <span className="font-bold text-emerald-700">$50 off</span> their first service
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur rounded-lg p-4 border border-emerald-200">
          <p className="text-xs text-zinc-600 mb-2 font-medium">Your Unique Referral Link:</p>
          <div className="flex items-center gap-2 bg-white rounded-lg p-3 border border-zinc-200">
            <code className="text-sm font-mono text-zinc-900 flex-1 truncate">
              {referralLink}
            </code>
            <Button
              onClick={handleCopyLink}
              size="sm"
              className={`shrink-0 transition-all ${
                copied
                  ? 'bg-green-600 hover:bg-green-600'
                  : 'bg-emerald-600 hover:bg-emerald-500'
              }`}
            >
              {copied ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Share Buttons */}
      <div className="grid grid-cols-2 gap-3 mb-5 relative z-10">
        <Button
          onClick={handleShareText}
          variant="outline"
          className="border-emerald-300 bg-white/80 hover:bg-white hover:border-emerald-400"
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Share via Text
        </Button>
        <Button
          onClick={handleShareEmail}
          variant="outline"
          className="border-emerald-300 bg-white/80 hover:bg-white hover:border-emerald-400"
        >
          <Mail className="h-4 w-4 mr-2" />
          Share via Email
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4 relative z-10">
        <div className="bg-white/80 backdrop-blur rounded-lg p-3 border border-emerald-200">
          <div className="flex items-center gap-1 text-emerald-600 mb-1">
            <TrendingUp className="h-3.5 w-3.5" />
            <p className="text-xs font-medium">This Month</p>
          </div>
          <p className="text-2xl font-bold text-zinc-900">{stats.thisMonthReferrals}</p>
          <p className="text-xs text-zinc-600">Referrals</p>
        </div>

        <div className="bg-white/80 backdrop-blur rounded-lg p-3 border border-emerald-200">
          <div className="flex items-center gap-1 text-emerald-600 mb-1">
            <DollarSign className="h-3.5 w-3.5" />
            <p className="text-xs font-medium">Earned</p>
          </div>
          <p className="text-2xl font-bold text-zinc-900">${stats.totalEarned.toFixed(0)}</p>
          <p className="text-xs text-zinc-600">Total</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-600 to-teal-600 rounded-lg p-3 border border-emerald-300 shadow-md">
          <div className="flex items-center gap-1 text-emerald-100 mb-1">
            <Gift className="h-3.5 w-3.5" />
            <p className="text-xs font-medium">Available</p>
          </div>
          <p className="text-2xl font-bold text-white">${stats.availableCredit.toFixed(0)}</p>
          <p className="text-xs text-emerald-100">Credit</p>
        </div>
      </div>

      {/* CTA */}
      <Link href="/customer-portal/referrals">
        <Button className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold relative z-10 shadow-lg">
          View All Referrals & Rewards
        </Button>
      </Link>

      {/* Info */}
      <p className="text-xs text-center text-zinc-600 mt-3 relative z-10">
        You get $50 credit when they complete their first job
      </p>
    </div>
  );
}
