'use client';

import { useState, useEffect } from 'react';
import { X, CreditCard, Loader2, AlertCircle } from 'lucide-react';
import StripePaymentForm from './StripePaymentForm';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  invoiceId: string;
  amount: number;
  invoiceNumber: string;
  providerName: string;
}

export default function PaymentModal({
  isOpen,
  onClose,
  onSuccess,
  invoiceId,
  amount,
  invoiceNumber,
  providerName,
}: PaymentModalProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  useEffect(() => {
    if (isOpen && !clientSecret) {
      createPaymentIntent();
    }
  }, [isOpen]);

  const createPaymentIntent = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/customer/invoices/${invoiceId}/create-payment-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to initialize payment');
      }

      const data = await response.json();
      setClientSecret(data.clientSecret);
    } catch (err: any) {
      console.error('Error creating payment intent:', err);
      setError(err.message || 'Failed to initialize payment');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    setClientSecret(null); // Reset for next time
    onSuccess();
  };

  const handleCancel = () => {
    setClientSecret(null); // Reset for next time
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleCancel}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-zinc-200 p-6 flex items-start justify-between rounded-t-xl">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <CreditCard className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-900">Pay Invoice</h2>
              <p className="text-sm text-zinc-600 mt-1">
                Invoice #{invoiceNumber} • {providerName}
              </p>
            </div>
          </div>
          <button
            onClick={handleCancel}
            disabled={loading}
            className="text-zinc-400 hover:text-zinc-600 transition-colors disabled:opacity-50"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Amount Summary */}
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-6 mb-6 border border-emerald-200">
            <p className="text-sm font-medium text-emerald-900 mb-1">Amount Due</p>
            <p className="text-4xl font-bold text-emerald-600">{formatCurrency(amount)}</p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-emerald-600 mb-4" />
              <p className="text-zinc-600">Initializing secure payment...</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="py-8">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-red-900 mb-2">Payment Error</h3>
                <p className="text-red-700 mb-4">{error}</p>
                <button
                  onClick={createPaymentIntent}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* Payment Form */}
          {clientSecret && !loading && !error && (
            <StripePaymentForm
              clientSecret={clientSecret}
              amount={amount}
              invoiceId={invoiceId}
              onSuccess={handleSuccess}
              onCancel={handleCancel}
            />
          )}
        </div>

        {/* Footer Info */}
        <div className="border-t border-zinc-200 p-4 bg-zinc-50 rounded-b-xl">
          <p className="text-xs text-zinc-500 text-center">
            Payments are processed securely through Stripe. We never store your card details.
          </p>
        </div>
      </div>
    </div>
  );
}
