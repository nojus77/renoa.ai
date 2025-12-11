'use client';

import { useState, useEffect } from 'react';
import { X, CreditCard, Lock, Zap, Shield, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { loadStripe, StripeCardElement } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

interface SaveCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  showBenefits?: boolean; // Show benefits list (for post-payment modal)
}

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

function SaveCardForm({ onClose, onSuccess, showBenefits }: Omit<SaveCardModalProps, 'isOpen'>) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [setAsDefault, setSetAsDefault] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    try {
      setLoading(true);

      // Create SetupIntent
      const setupIntentResponse = await fetch('/api/customer/payment-methods/setup-intent', {
        method: 'POST',
      });

      if (!setupIntentResponse.ok) {
        throw new Error('Failed to initialize payment setup');
      }

      const { clientSecret } = await setupIntentResponse.json();

      // Get card element
      const cardElement = elements.getElement(CardElement);

      if (!cardElement) {
        throw new Error('Card element not found');
      }

      // Confirm card setup
      const { error, setupIntent } = await stripe.confirmCardSetup(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!setupIntent?.payment_method) {
        throw new Error('Failed to save payment method');
      }

      // Save payment method to database
      const saveResponse = await fetch('/api/customer/payment-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethodId: setupIntent.payment_method,
          setAsDefault,
        }),
      });

      if (!saveResponse.ok) {
        throw new Error('Failed to save payment method');
      }

      toast.success('Payment method saved successfully!');
      onSuccess?.();
    } catch (error: any) {
      console.error('Error saving card:', error);
      toast.error(error.message || 'Failed to save payment method');
    } finally {
      setLoading(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#18181b',
        fontFamily: 'system-ui, sans-serif',
        '::placeholder': {
          color: '#a1a1aa',
        },
      },
      invalid: {
        color: '#dc2626',
        iconColor: '#dc2626',
      },
    },
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Benefits List (for post-payment modal) */}
      {showBenefits && (
        <div className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-4 mb-4">
          <h3 className="font-semibold text-zinc-900 mb-3 flex items-center gap-2">
            <Zap className="h-5 w-5 text-emerald-600" />
            Why save your card?
          </h3>
          <ul className="space-y-2 text-sm text-zinc-700">
            <li className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 bg-emerald-600 rounded-full"></div>
              One-click checkout for future bookings
            </li>
            <li className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 bg-emerald-600 rounded-full"></div>
              Auto-pay for recurring services (optional)
            </li>
            <li className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 bg-emerald-600 rounded-full"></div>
              Securely encrypted and stored by Stripe
            </li>
            <li className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 bg-emerald-600 rounded-full"></div>
              Remove or update anytime
            </li>
          </ul>
        </div>
      )}

      {/* Card Input */}
      <div>
        <label className="block text-sm font-semibold text-zinc-900 mb-2">
          Card Information *
        </label>
        <div className="p-4 border-2 border-zinc-300 rounded-lg focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-200 transition-all">
          <CardElement options={cardElementOptions} />
        </div>
      </div>

      {/* Set as Default Checkbox */}
      <div className="flex items-center gap-3 p-4 bg-zinc-50 rounded-lg">
        <Checkbox
          checked={setAsDefault}
          onCheckedChange={(checked) => setSetAsDefault(checked as boolean)}
          id="setAsDefault"
        />
        <label
          htmlFor="setAsDefault"
          className="text-sm font-medium text-zinc-900 cursor-pointer"
        >
          Set as default payment method
        </label>
      </div>

      {/* Security Notice */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <Shield className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-900">
          <p className="font-semibold mb-1">Secured by Stripe</p>
          <p>Your payment information is encrypted and never stored on our servers.</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        {showBenefits && (
          <Button
            type="button"
            onClick={onClose}
            variant="outline"
            className="flex-1"
            disabled={loading}
          >
            No Thanks
          </Button>
        )}
        <Button
          type="submit"
          disabled={!stripe || loading}
          className={`${showBenefits ? 'flex-1' : 'w-full'} bg-emerald-600 hover:bg-emerald-500`}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Lock className="h-4 w-4 mr-2" />
              Save Card Securely
            </>
          )}
        </Button>
      </div>

      {showBenefits && (
        <p className="text-xs text-center text-zinc-500">
          Don&apos;t show this for 30 days if you click &quot;No Thanks&quot;
        </p>
      )}
    </form>
  );
}

export default function SaveCardModal({
  isOpen,
  onClose,
  onSuccess,
  showBenefits = false,
}: SaveCardModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl flex items-center gap-2">
                <CreditCard className="h-6 w-6 text-emerald-600" />
                {showBenefits ? 'Save Your Card' : 'Add Payment Method'}
              </DialogTitle>
              {!showBenefits && (
                <p className="text-sm text-zinc-600 mt-1">
                  Save a card for faster checkout
                </p>
              )}
            </div>
          </div>
        </DialogHeader>

        <Elements stripe={stripePromise}>
          <SaveCardForm onClose={onClose} onSuccess={onSuccess} showBenefits={showBenefits} />
        </Elements>
      </DialogContent>
    </Dialog>
  );
}
