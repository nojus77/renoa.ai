'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Gift,
  Copy,
  CheckCircle,
  Clock,
  Tag,
  Loader2,
  AlertCircle,
  DollarSign,
  Sparkles,
  Calendar
} from 'lucide-react';
import CustomerLayout from '@/components/customer/CustomerLayout';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Link from 'next/link';

interface Promotion {
  id: string;
  promoCode: string;
  discountPercent: number | null;
  discountAmount: number | null;
  expiresAt: string;
  status: string;
  triggerType: string;
  message: string | null;
  usedAt: string | null;
  createdAt: string;
}

export default function OffersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activePromos, setActivePromos] = useState<Promotion[]>([]);
  const [expiredPromos, setExpiredPromos] = useState<Promotion[]>([]);
  const [usedPromos, setUsedPromos] = useState<Promotion[]>([]);
  const [creditBalance, setCreditBalance] = useState(0);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      setLoading(true);

      // Fetch promotions
      const promosResponse = await fetch('/api/customer/promotions');
      const promosData = await promosResponse.json();

      if (promosData.active) setActivePromos(promosData.active);
      if (promosData.expired) setExpiredPromos(promosData.expired);
      if (promosData.used) setUsedPromos(promosData.used);

      // Fetch credits
      const creditsResponse = await fetch('/api/customer/credits');
      const creditsData = await creditsResponse.json();

      if (creditsData.totalAvailable) {
        setCreditBalance(creditsData.totalAvailable);
      }
    } catch (error) {
      console.error('Error fetching offers:', error);
      toast.error('Failed to load offers');
    } finally {
      setLoading(false);
    }
  };

  const copyPromoCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success('Promo code copied!');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getTimeLeft = (expiresAt: string) => {
    const now = new Date().getTime();
    const expiry = new Date(expiresAt).getTime();
    const diff = expiry - now;

    if (diff <= 0) return 'Expired';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h left`;
    if (hours > 0) return `${hours}h left`;
    return 'Expiring soon';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
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

  const hasActiveOffers = activePromos.length > 0 || creditBalance > 0;

  return (
    <CustomerLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 mb-2">Your Offers</h1>
        <p className="text-zinc-600">
          Active promotions, credits, and rewards
        </p>
      </div>

      {/* Active Promotions Section */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-zinc-900 mb-4 flex items-center gap-2">
          <Tag className="h-5 w-5 text-emerald-600" />
          Active Promotions
        </h2>

        {activePromos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activePromos.map((promo) => (
              <div
                key={promo.id}
                className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border-2 border-emerald-200 p-6 relative overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-300/20 rounded-full -mr-16 -mt-16"></div>

                <div className="relative z-10">
                  {/* Promo code */}
                  <div className="mb-4">
                    <p className="text-xs text-zinc-600 mb-2">Promo Code</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-white border-2 border-dashed border-emerald-300 rounded-lg px-4 py-2 font-mono font-bold text-emerald-700">
                        {promo.promoCode}
                      </code>
                      <Button
                        onClick={() => copyPromoCode(promo.promoCode)}
                        size="sm"
                        variant="outline"
                        className={copiedCode === promo.promoCode ? 'bg-green-100 border-green-500' : 'border-emerald-300'}
                      >
                        {copiedCode === promo.promoCode ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Discount */}
                  <div className="mb-4">
                    <p className="text-3xl font-bold text-emerald-700">
                      {promo.discountPercent
                        ? `${promo.discountPercent}% OFF`
                        : `$${promo.discountAmount} OFF`}
                    </p>
                  </div>

                  {/* Message */}
                  {promo.message && (
                    <p className="text-sm text-zinc-700 mb-4">
                      {promo.message}
                    </p>
                  )}

                  {/* Expiry */}
                  <div className="flex items-center gap-2 text-orange-700 bg-orange-100 border border-orange-200 rounded-lg px-3 py-2 mb-4">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm font-semibold">
                      {getTimeLeft(promo.expiresAt)}
                    </span>
                  </div>

                  {/* CTA */}
                  <Button
                    onClick={() => router.push('/customer-portal/jobs')}
                    className="w-full bg-emerald-600 hover:bg-emerald-500"
                  >
                    Use This Offer
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-zinc-50 rounded-xl border-2 border-dashed border-zinc-200 p-8 text-center">
            <Tag className="h-12 w-12 text-zinc-400 mx-auto mb-3" />
            <p className="text-zinc-600 mb-2">No active promotions</p>
            <p className="text-sm text-zinc-500">
              Check back soon for special offers!
            </p>
          </div>
        )}
      </div>

      {/* Referral Credits Section */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-zinc-900 mb-4 flex items-center gap-2">
          <Gift className="h-5 w-5 text-emerald-600" />
          Referral Credits
        </h2>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200 p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-zinc-600 mb-1">Available Credit Balance</p>
              <p className="text-4xl font-bold text-green-700">
                ${creditBalance.toFixed(0)}
              </p>
            </div>
            <div className="h-16 w-16 rounded-full bg-green-600 flex items-center justify-center shadow-lg">
              <DollarSign className="h-8 w-8 text-white" />
            </div>
          </div>

          <p className="text-sm text-zinc-600 mb-4">
            Earned from referrals and will be automatically applied to your next booking
          </p>

          <Link href="/customer-portal/referrals">
            <Button
              variant="outline"
              className="w-full border-green-600 text-green-700 hover:bg-green-50"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              View Referral Program
            </Button>
          </Link>
        </div>
      </div>

      {/* Used/Expired Section */}
      {(usedPromos.length > 0 || expiredPromos.length > 0) && (
        <div>
          <h2 className="text-xl font-bold text-zinc-900 mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-zinc-600" />
            Past Offers
          </h2>

          <div className="space-y-3">
            {/* Used Promos */}
            {usedPromos.map((promo) => (
              <div
                key={promo.id}
                className="bg-zinc-50 rounded-lg border border-zinc-200 p-4 opacity-75"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <code className="font-mono font-bold text-zinc-600">
                        {promo.promoCode}
                      </code>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                        <CheckCircle className="h-3 w-3" />
                        Used
                      </span>
                    </div>
                    <p className="text-sm text-zinc-600">
                      {promo.discountPercent
                        ? `${promo.discountPercent}% discount`
                        : `$${promo.discountAmount} discount`}
                      {' • Used on '}
                      {promo.usedAt && formatDate(promo.usedAt)}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-green-700">
                    Saved!
                  </p>
                </div>
              </div>
            ))}

            {/* Expired Promos */}
            {expiredPromos.map((promo) => (
              <div
                key={promo.id}
                className="bg-zinc-50 rounded-lg border border-zinc-200 p-4 opacity-60"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <code className="font-mono font-bold text-zinc-500">
                        {promo.promoCode}
                      </code>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-200 text-zinc-600">
                        Expired
                      </span>
                    </div>
                    <p className="text-sm text-zinc-500">
                      Expired on {formatDate(promo.expiresAt)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!hasActiveOffers && usedPromos.length === 0 && expiredPromos.length === 0 && (
        <div className="bg-white rounded-xl border-2 border-zinc-200 p-12 text-center">
          <Gift className="h-16 w-16 text-zinc-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-zinc-900 mb-2">
            No offers yet
          </h3>
          <p className="text-zinc-600 mb-6 max-w-md mx-auto">
            Check back soon for exclusive promotions, or earn $50 credit by referring a friend!
          </p>
          <Link href="/customer-portal/referrals">
            <Button className="bg-emerald-600 hover:bg-emerald-500">
              <Sparkles className="h-4 w-4 mr-2" />
              Invite Friends & Earn $50
            </Button>
          </Link>
        </div>
      )}
    </CustomerLayout>
  );
}
