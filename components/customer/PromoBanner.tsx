'use client';

import { useState, useEffect } from 'react';
import { X, Clock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface Promotion {
  id: string;
  promoCode: string;
  discountPercent: number | null;
  discountAmount: number | null;
  expiresAt: string;
  message: string | null;
}

export default function PromoBanner() {
  const router = useRouter();
  const [promo, setPromo] = useState<Promotion | null>(null);
  const [timeLeft, setTimeLeft] = useState('');
  const [isVisible, setIsVisible] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivePromo();
  }, []);

  useEffect(() => {
    if (!promo) return;

    const updateCountdown = () => {
      const now = new Date().getTime();
      const expiry = new Date(promo.expiresAt).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setIsVisible(false);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m`);
      } else {
        setTimeLeft(`${minutes}m`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [promo]);

  const fetchActivePromo = async () => {
    try {
      const response = await fetch('/api/customer/promotions');
      const data = await response.json();

      if (data.bestPromo) {
        setPromo(data.bestPromo);
      }
    } catch (error) {
      console.error('Error fetching promo:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookNow = () => {
    router.push('/customer-portal/jobs'); // Or wherever booking flow starts
  };

  if (loading || !promo || !isVisible) return null;

  const discountText = promo.discountPercent
    ? `${promo.discountPercent}% off`
    : promo.discountAmount
    ? `$${promo.discountAmount} off`
    : 'Special discount';

  return (
    <div className="mb-6 animate-in slide-in-from-top duration-500">
      <div className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 rounded-xl p-4 sm:p-5 relative overflow-hidden shadow-xl border-2 border-orange-300">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>

        {/* Close button */}
        <button
          onClick={() => setIsVisible(false)}
          className="absolute top-3 right-3 p-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
        >
          <X className="h-4 w-4 text-white" />
        </button>

        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Left side - Message */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-yellow-300" />
                <h3 className="text-xl font-bold text-white">
                  Special Offer Just For You!
                </h3>
              </div>
              <p className="text-white/90 text-lg font-semibold mb-2">
                Get {discountText} your next service
              </p>
              {promo.message && (
                <p className="text-white/80 text-sm">
                  {promo.message}
                </p>
              )}
            </div>

            {/* Right side - Countdown & CTA */}
            <div className="flex flex-col items-start sm:items-end gap-3">
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur rounded-lg px-4 py-2 border border-white/30">
                <Clock className="h-4 w-4 text-yellow-300" />
                <div className="text-white">
                  <p className="text-xs font-medium opacity-90">Expires in:</p>
                  <p className="text-lg font-bold">{timeLeft}</p>
                </div>
              </div>

              <Button
                onClick={handleBookNow}
                size="lg"
                className="bg-white text-orange-600 hover:bg-orange-50 font-bold shadow-lg w-full sm:w-auto"
              >
                Book Now & Save
              </Button>
            </div>
          </div>

          {/* Promo code display */}
          <div className="mt-4 pt-4 border-t border-white/30">
            <p className="text-white/80 text-xs mb-1">Your promo code:</p>
            <code className="bg-white/20 backdrop-blur text-white font-mono font-bold px-3 py-1.5 rounded border border-white/30 text-sm">
              {promo.promoCode}
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}
