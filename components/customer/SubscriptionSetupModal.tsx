'use client';

import { useState } from 'react';
import { X, Calendar, DollarSign, CreditCard, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface SubscriptionSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  providerId: string;
  providerName: string;
  serviceTypes: string[];
  averageJobPrice?: number;
}

export default function SubscriptionSetupModal({
  isOpen,
  onClose,
  providerId,
  providerName,
  serviceTypes,
  averageJobPrice = 150,
}: SubscriptionSetupModalProps) {
  const [step, setStep] = useState<'setup' | 'payment' | 'success'>('setup');
  const [serviceType, setServiceType] = useState(serviceTypes[0] || '');
  const [frequency, setFrequency] = useState<'weekly' | 'biweekly' | 'monthly'>('biweekly');
  const [startDate, setStartDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  // Calculate price with discount
  const basePrice = averageJobPrice;
  const discountedPrice = basePrice * 0.9; // 10% discount
  const savings = basePrice - discountedPrice;

  const handleSetupSubscription = async () => {
    try {
      setSubmitting(true);

      const response = await fetch('/api/customer/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceType,
          frequency,
          price: discountedPrice,
          startDate,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create subscription');
      }

      // Move to success step
      setStep('success');
    } catch (error: any) {
      console.error('Error creating subscription:', error);
      toast.error(error.message || 'Failed to create subscription');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaymentSetup = () => {
    // In production, this would integrate with Stripe
    // For now, just move to success
    setStep('success');
  };

  if (step === 'success') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-md w-full p-8 relative animate-in fade-in zoom-in duration-300">
          <button
            onClick={() => {
              onClose();
              setStep('setup');
            }}
            className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="text-center">
            {/* Success Icon */}
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-emerald-600" />
            </div>

            {/* Success Message */}
            <h2 className="text-2xl font-bold text-zinc-900 mb-2">
              Subscription Active!
            </h2>
            <p className="text-zinc-600 mb-6">
              Your {frequency} {serviceType.toLowerCase()} service has been set up successfully.
            </p>

            {/* Summary Box */}
            <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-4 mb-6 text-left">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-5 w-5 text-emerald-600" />
                <h3 className="font-bold text-emerald-900">Your Subscription</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-600">Service:</span>
                  <span className="font-semibold text-zinc-900">{serviceType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600">Frequency:</span>
                  <span className="font-semibold text-zinc-900 capitalize">{frequency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600">Next Service:</span>
                  <span className="font-semibold text-zinc-900">
                    {new Date(startDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-emerald-200">
                  <span className="text-zinc-600">Price per service:</span>
                  <div>
                    <span className="font-bold text-emerald-600">
                      ${discountedPrice.toFixed(2)}
                    </span>
                    <span className="text-xs text-emerald-600 ml-1">
                      (Save ${savings.toFixed(2)})
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <Button
              onClick={() => {
                onClose();
                setStep('setup');
                window.location.href = '/customer-portal/subscriptions';
              }}
              className="w-full bg-emerald-600 hover:bg-emerald-500"
            >
              View My Subscriptions
            </Button>

            <button
              onClick={() => {
                onClose();
                setStep('setup');
              }}
              className="text-sm text-zinc-500 hover:text-zinc-700 mt-3"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'payment') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-zinc-900 mb-2">
              Set Up Payment
            </h2>
            <p className="text-zinc-600">
              Add your payment method for automatic billing
            </p>
          </div>

          {/* Payment Method Placeholder */}
          <div className="bg-zinc-50 border-2 border-dashed border-zinc-300 rounded-xl p-8 mb-6">
            <div className="text-center">
              <CreditCard className="h-12 w-12 text-zinc-400 mx-auto mb-3" />
              <p className="text-zinc-600 mb-4">
                Stripe payment integration would go here
              </p>
              <p className="text-sm text-zinc-500">
                In production, this would use Stripe Elements to securely collect payment info
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={() => setStep('setup')}
              variant="outline"
              className="flex-1"
            >
              Back
            </Button>
            <Button
              onClick={handleSetupSubscription}
              disabled={submitting}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500"
            >
              {submitting ? 'Setting Up...' : 'Complete Setup'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-zinc-900 mb-2">
            Set Up Recurring Service
          </h2>
          <p className="text-zinc-600">
            Never worry about scheduling again - get 10% off every service
          </p>
        </div>

        {/* Service Type Selection */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-zinc-700 mb-2">
            Service Type *
          </label>
          <select
            value={serviceType}
            onChange={(e) => setServiceType(e.target.value)}
            className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          >
            {serviceTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* Frequency Selection */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-zinc-700 mb-3">
            Frequency *
          </label>
          <div className="grid grid-cols-1 gap-3">
            {/* Weekly */}
            <button
              type="button"
              onClick={() => setFrequency('weekly')}
              className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                frequency === 'weekly'
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-zinc-200 hover:border-zinc-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-emerald-600" />
                <div className="text-left">
                  <div className="font-semibold text-zinc-900">Weekly</div>
                  <div className="text-xs text-zinc-600">Every 7 days</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-emerald-600">${discountedPrice.toFixed(0)}</div>
                <div className="text-xs text-zinc-500 line-through">${basePrice.toFixed(0)}</div>
              </div>
            </button>

            {/* Bi-weekly */}
            <button
              type="button"
              onClick={() => setFrequency('biweekly')}
              className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                frequency === 'biweekly'
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-zinc-200 hover:border-zinc-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-emerald-600" />
                <div className="text-left">
                  <div className="font-semibold text-zinc-900">Bi-weekly</div>
                  <div className="text-xs text-zinc-600">Every 14 days</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-emerald-600">${discountedPrice.toFixed(0)}</div>
                <div className="text-xs text-zinc-500 line-through">${basePrice.toFixed(0)}</div>
              </div>
            </button>

            {/* Monthly */}
            <button
              type="button"
              onClick={() => setFrequency('monthly')}
              className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                frequency === 'monthly'
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-zinc-200 hover:border-zinc-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-emerald-600" />
                <div className="text-left">
                  <div className="font-semibold text-zinc-900">Monthly</div>
                  <div className="text-xs text-zinc-600">Every 30 days</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-emerald-600">${discountedPrice.toFixed(0)}</div>
                <div className="text-xs text-zinc-500 line-through">${basePrice.toFixed(0)}</div>
              </div>
            </button>
          </div>
        </div>

        {/* Start Date */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-zinc-700 mb-2">
            Start Date *
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
          <p className="text-xs text-zinc-500 mt-1">
            When would you like your first service?
          </p>
        </div>

        {/* Summary */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-5 w-5 text-emerald-600" />
            <h3 className="font-bold text-emerald-900">Subscription Summary</h3>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-600">Regular price:</span>
              <span className="line-through text-zinc-500">${basePrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-600">Your price (10% off):</span>
              <span className="font-bold text-emerald-600">${discountedPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-emerald-700 pt-1 border-t border-emerald-200">
              <span className="font-semibold">You save:</span>
              <span className="font-bold">${savings.toFixed(2)} per service</span>
            </div>
          </div>
        </div>

        {/* Continue Button */}
        <Button
          onClick={handleSetupSubscription}
          disabled={submitting || !serviceType || !startDate}
          className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50"
        >
          {submitting ? 'Setting Up...' : 'Continue to Payment'}
        </Button>

        <p className="text-xs text-center text-zinc-500 mt-3">
          You can skip, pause, or cancel anytime
        </p>
      </div>
    </div>
  );
}
