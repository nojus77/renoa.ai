'use client';

import { useState } from 'react';
import { Sparkles, Calendar, DollarSign, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SubscriptionWidgetProps {
  providerName: string;
  serviceType?: string;
  averageJobPrice?: number;
  onSetupClick: () => void;
}

export default function SubscriptionWidget({
  providerName,
  serviceType = 'Lawn Care',
  averageJobPrice = 150,
  onSetupClick,
}: SubscriptionWidgetProps) {
  // Calculate savings based on frequency
  const weeklyPrice = averageJobPrice * 0.9; // 10% discount
  const biweeklyPrice = averageJobPrice * 0.9;
  const monthlyPrice = averageJobPrice * 0.9;

  const weeklyTotal = weeklyPrice * 4; // 4 weeks
  const biweeklyTotal = biweeklyPrice * 2; // 2 services
  const monthlyTotal = monthlyPrice; // 1 service

  const weeklySavings = (averageJobPrice * 4) - weeklyTotal;
  const biweeklySavings = (averageJobPrice * 2) - biweeklyTotal;
  const monthlySavings = averageJobPrice - monthlyTotal;

  return (
    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center shrink-0">
          <Sparkles className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-emerald-900 mb-1">
            Never Worry About {serviceType} Again!
          </h3>
          <p className="text-sm text-emerald-700">
            Set it and forget it - automatic scheduling + 10% off every service
          </p>
        </div>
      </div>

      {/* Benefits Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <div className="bg-white/80 rounded-lg p-4 border border-emerald-100">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-5 w-5 text-emerald-600" />
            <h4 className="font-semibold text-emerald-900 text-sm">Auto-Schedule</h4>
          </div>
          <p className="text-xs text-emerald-700">
            Your service is automatically scheduled at your preferred frequency
          </p>
        </div>

        <div className="bg-white/80 rounded-lg p-4 border border-emerald-100">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-5 w-5 text-emerald-600" />
            <h4 className="font-semibold text-emerald-900 text-sm">Save 10%</h4>
          </div>
          <p className="text-xs text-emerald-700">
            Get 10% off every service compared to one-time bookings
          </p>
        </div>

        <div className="bg-white/80 rounded-lg p-4 border border-emerald-100">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-5 w-5 text-emerald-600" />
            <h4 className="font-semibold text-emerald-900 text-sm">Flexibility</h4>
          </div>
          <p className="text-xs text-emerald-700">
            Skip, pause, or cancel anytime. You&apos;re always in control
          </p>
        </div>
      </div>

      {/* Pricing Preview */}
      <div className="bg-white/90 rounded-lg p-4 mb-5 border border-emerald-200">
        <h4 className="font-bold text-emerald-900 mb-3 text-sm">Pricing Examples</h4>
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-emerald-700">Weekly (4x/month):</span>
            <div className="text-right">
              <span className="font-bold text-emerald-900">${weeklyTotal.toFixed(0)}/mo</span>
              <span className="text-xs text-emerald-600 ml-2">Save ${weeklySavings.toFixed(0)}</span>
            </div>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-emerald-700">Bi-weekly (2x/month):</span>
            <div className="text-right">
              <span className="font-bold text-emerald-900">${biweeklyTotal.toFixed(0)}/mo</span>
              <span className="text-xs text-emerald-600 ml-2">Save ${biweeklySavings.toFixed(0)}</span>
            </div>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-emerald-700">Monthly (1x/month):</span>
            <div className="text-right">
              <span className="font-bold text-emerald-900">${monthlyTotal.toFixed(0)}/mo</span>
              <span className="text-xs text-emerald-600 ml-2">Save ${monthlySavings.toFixed(0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Button */}
      <Button
        onClick={onSetupClick}
        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
      >
        <Sparkles className="h-4 w-4 mr-2" />
        Set Up Recurring Service
      </Button>

      <p className="text-xs text-center text-emerald-600 mt-3">
        No commitment required • Cancel anytime
      </p>
    </div>
  );
}
