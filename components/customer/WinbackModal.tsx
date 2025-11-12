'use client';

import { useState, useEffect } from 'react';
import { Sparkles, X, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';

interface Promotion {
  id: string;
  promoCode: string;
  discountPercent: number | null;
  discountAmount: number | null;
  expiresAt: string;
  message: string | null;
  triggerType: string;
}

interface WinbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WinbackModal({ isOpen: initialIsOpen, onClose }: WinbackModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [promo, setPromo] = useState<Promotion | null>(null);
  const [canDismiss, setCanDismiss] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    checkForWinbackPromo();
  }, []);

  useEffect(() => {
    if (isOpen) {
      // Trigger confetti after modal appears
      setTimeout(() => {
        triggerConfetti();
      }, 300);

      // Enable dismiss after 5 seconds
      setTimeout(() => {
        setCanDismiss(true);
      }, 5000);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!promo) return;

    const updateCountdown = () => {
      const now = new Date().getTime();
      const expiry = new Date(promo.expiresAt).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeLeft('Expired');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

      if (days > 0) {
        setTimeLeft(`${days} day${days > 1 ? 's' : ''} ${hours}h`);
      } else {
        setTimeLeft(`${hours} hours`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);

    return () => clearInterval(interval);
  }, [promo]);

  const checkForWinbackPromo = async () => {
    try {
      // Check if modal was shown recently (last 7 days)
      const lastShown = localStorage.getItem('winback_modal_last_shown');
      if (lastShown) {
        const daysSinceShown = (Date.now() - parseInt(lastShown)) / (1000 * 60 * 60 * 24);
        if (daysSinceShown < 7) {
          return; // Don't show again
        }
      }

      const response = await fetch('/api/customer/promotions');
      const data = await response.json();

      // Check for winback promotion
      const winbackPromo = data.active?.find(
        (p: Promotion) => p.triggerType === 'winback' || p.triggerType === 'inactivity'
      );

      if (winbackPromo) {
        setPromo(winbackPromo);
        setIsOpen(true);
        // Mark as shown
        localStorage.setItem('winback_modal_last_shown', Date.now().toString());
      }
    } catch (error) {
      console.error('Error checking for winback promo:', error);
    }
  };

  const triggerConfetti = () => {
    const duration = 3000;
    const end = Date.now() + duration;

    const colors = ['#10b981', '#06b6d4', '#f59e0b', '#ef4444'];

    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  };

  const handleClaim = () => {
    setIsOpen(false);
    router.push('/customer-portal/jobs'); // Or wherever booking starts
    if (onClose) onClose();
  };

  const handleDismiss = () => {
    if (!canDismiss) return;
    setIsOpen(false);
    if (onClose) onClose();
  };

  if (!isOpen || !promo) return null;

  const discountPercent = promo.discountPercent ? Number(promo.discountPercent) : 0;
  const discountAmount = promo.discountAmount ? Number(promo.discountAmount) : 0;

  // Calculate example before/after prices
  const examplePrice = 200;
  const savings = discountPercent
    ? examplePrice * (discountPercent / 100)
    : discountAmount;
  const finalPrice = examplePrice - savings;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
      <div className="bg-gradient-to-br from-white via-emerald-50 to-teal-50 rounded-2xl max-w-md w-full p-8 relative shadow-2xl border-4 border-emerald-300 animate-in zoom-in duration-500">
        {/* Close button - only shows after 5 seconds */}
        {canDismiss && (
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-2 rounded-full bg-zinc-200 hover:bg-zinc-300 transition-colors"
          >
            <X className="h-4 w-4 text-zinc-600" />
          </button>
        )}

        {/* Content */}
        <div className="text-center">
          {/* Emoji */}
          <div className="text-7xl mb-4 animate-bounce">🎉</div>

          {/* Heading */}
          <h1 className="text-3xl font-bold text-zinc-900 mb-2">
            Welcome Back!
          </h1>
          <p className="text-xl text-zinc-700 mb-6">
            We've Missed You
          </p>

          {/* Discount Display */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-8 mb-6 relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>

            <div className="relative z-10">
              <p className="text-white/90 text-sm font-medium mb-2">
                Exclusive Offer
              </p>
              <p className="text-7xl font-bold text-white mb-2">
                {discountPercent}%
              </p>
              <p className="text-2xl font-bold text-white">OFF</p>
            </div>
          </div>

          {/* Countdown */}
          <div className="flex items-center justify-center gap-2 mb-6 bg-orange-100 border-2 border-orange-300 rounded-lg px-4 py-3">
            <Clock className="h-5 w-5 text-orange-600" />
            <div className="text-left">
              <p className="text-xs text-orange-700 font-medium">Offer expires in:</p>
              <p className="text-lg font-bold text-orange-900">{timeLeft}</p>
            </div>
          </div>

          {/* Before/After Price */}
          <div className="bg-white/80 backdrop-blur rounded-xl p-5 mb-6 border-2 border-emerald-200">
            <div className="flex items-center justify-center gap-4">
              <div>
                <p className="text-xs text-zinc-600 mb-1">Was</p>
                <p className="text-2xl font-bold text-zinc-400 line-through">
                  ${examplePrice}
                </p>
              </div>
              <div className="text-3xl text-emerald-600 font-bold">→</div>
              <div>
                <p className="text-xs text-emerald-700 font-medium mb-1">Now</p>
                <p className="text-3xl font-bold text-emerald-600">
                  ${finalPrice.toFixed(0)}
                </p>
              </div>
            </div>
            <p className="text-sm text-emerald-700 font-semibold mt-3">
              Save ${savings.toFixed(0)} on your next service!
            </p>
          </div>

          {/* Message */}
          {promo.message && (
            <p className="text-sm text-zinc-600 mb-6 italic">
              "{promo.message}"
            </p>
          )}

          {/* CTA */}
          <Button
            onClick={handleClaim}
            size="lg"
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-lg font-bold py-6 shadow-xl mb-3"
          >
            <Sparkles className="h-5 w-5 mr-2" />
            Claim Your Discount
          </Button>

          {/* Maybe Later - only shows after 5 seconds */}
          {canDismiss && (
            <button
              onClick={handleDismiss}
              className="text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
            >
              Maybe later
            </button>
          )}

          {/* Promo Code */}
          <div className="mt-6 pt-6 border-t border-emerald-200">
            <p className="text-xs text-zinc-600 mb-2">Your promo code:</p>
            <code className="bg-emerald-100 text-emerald-800 font-mono font-bold px-4 py-2 rounded-lg text-lg border-2 border-emerald-300">
              {promo.promoCode}
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}
