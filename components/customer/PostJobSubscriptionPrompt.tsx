'use client';

import { useState } from 'react';
import { X, Sparkles, Calendar, DollarSign, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PostJobSubscriptionPromptProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  serviceType: string;
  providerId: string;
  providerName: string;
  jobPrice: number;
  onSetupSubscription: () => void;
}

export default function PostJobSubscriptionPrompt({
  isOpen,
  onClose,
  jobId,
  serviceType,
  providerId,
  providerName,
  jobPrice,
  onSetupSubscription,
}: PostJobSubscriptionPromptProps) {
  if (!isOpen) return null;

  const discountedPrice = jobPrice * 0.9; // 10% discount
  const savings = jobPrice - discountedPrice;
  const monthlySavings = savings * 4; // Assuming weekly service

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full p-6 relative animate-in fade-in zoom-in duration-300">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-zinc-900 mb-2">
            Love Your Service? Make It Recurring!
          </h2>
          <p className="text-zinc-600">
            Get the same great {serviceType.toLowerCase()} service automatically scheduled + save 10% every time
          </p>
        </div>

        {/* Benefits */}
        <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-5 mb-6">
          <h3 className="font-bold text-emerald-900 mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            What You Get:
          </h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-emerald-900 text-sm">
                  Automatic Scheduling
                </p>
                <p className="text-xs text-emerald-700">
                  Never worry about booking - we&apos;ll schedule it for you
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-emerald-900 text-sm">
                  10% Off Every Service
                </p>
                <p className="text-xs text-emerald-700">
                  Save ${savings.toFixed(0)} per service - that&apos;s ${monthlySavings.toFixed(0)}/month!
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-emerald-900 text-sm">
                  Total Flexibility
                </p>
                <p className="text-xs text-emerald-700">
                  Skip, pause, or cancel anytime - no strings attached
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Comparison */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-zinc-50 rounded-lg p-4 border border-zinc-200">
            <p className="text-xs text-zinc-600 mb-1">One-Time Price</p>
            <p className="text-2xl font-bold text-zinc-400 line-through">
              ${jobPrice.toFixed(0)}
            </p>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg p-4 border-2 border-emerald-300 relative overflow-hidden">
            <div className="absolute top-1 right-1 bg-emerald-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              SAVE 10%
            </div>
            <p className="text-xs text-emerald-700 mb-1">Subscription Price</p>
            <p className="text-2xl font-bold text-emerald-600">
              ${discountedPrice.toFixed(0)}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={onSetupSubscription}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold py-6"
          >
            <Sparkles className="h-5 w-5 mr-2" />
            Yes! Set Up Recurring Service
          </Button>
          <button
            onClick={onClose}
            className="w-full text-sm text-zinc-500 hover:text-zinc-700 py-2"
          >
            Maybe Later
          </button>
        </div>

        <p className="text-xs text-center text-zinc-500 mt-4">
          No credit card required now • Cancel anytime
        </p>
      </div>
    </div>
  );
}
