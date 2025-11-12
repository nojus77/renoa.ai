'use client';

import { useState } from 'react';
import { X, MapPin, DollarSign, CheckCircle, Loader2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ServiceRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  recommendationId: string;
  serviceType: string;
  estimatedPrice: number;
  description: string;
}

export default function ServiceRequestModal({
  isOpen,
  onClose,
  onSuccess,
  recommendationId,
  serviceType,
  estimatedPrice,
  description,
}: ServiceRequestModalProps) {
  const [step, setStep] = useState<'request' | 'success'>('request');
  const [address, setAddress] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [notes, setNotes] = useState('');
  const [sameProvider, setSameProvider] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!address) {
      toast.error('Please enter your service address');
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch('/api/customer/recommendations/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recommendationId,
          serviceType,
          address,
          preferredDate: preferredDate || null,
          customerNotes: notes || undefined,
          sameProvider,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to request service');
      }

      setStep('success');
    } catch (error: any) {
      console.error('Error requesting service:', error);
      toast.error(error.message || 'Failed to request service');
    } finally {
      setSubmitting(false);
    }
  };

  if (step === 'success') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-md w-full p-8 relative animate-in fade-in zoom-in duration-300">
          <button
            onClick={() => {
              onClose();
              setStep('request');
              if (onSuccess) onSuccess();
            }}
            className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="text-center">
            {/* Success Icon */}
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-emerald-600" />
            </div>

            {/* Success Message */}
            <h2 className="text-2xl font-bold text-zinc-900 mb-2">
              Request Sent!
            </h2>
            <p className="text-zinc-600 mb-6">
              Your service provider will review your request and send you a quote soon.
            </p>

            {/* Request Details */}
            <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-4 mb-6 text-left">
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-zinc-700">
                  <span className="font-semibold">Service:</span>
                  <span>{serviceType}</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-700">
                  <MapPin className="h-4 w-4 text-emerald-600" />
                  <span>{address}</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-700">
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                  <span>Est. ${estimatedPrice.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <Button
              onClick={() => {
                onClose();
                setStep('request');
                if (onSuccess) onSuccess();
              }}
              className="w-full bg-emerald-600 hover:bg-emerald-500"
            >
              Got It
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
            Request {serviceType}
          </h2>
          <p className="text-zinc-600">
            {description || 'Get a quote from your trusted provider'}
          </p>
        </div>

        {/* Service Details */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-zinc-600 mb-1">Estimated Price</p>
              <p className="text-2xl font-bold text-emerald-600">
                ${estimatedPrice.toFixed(0)}
              </p>
            </div>
            <div className="bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full">
              RECOMMENDED
            </div>
          </div>
        </div>

        {/* Address Input */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-zinc-700 mb-2">
            Service Address *
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter your address"
            className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>

        {/* Preferred Date (Optional) */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-zinc-700 mb-2">
            Preferred Date (Optional)
          </label>
          <input
            type="date"
            value={preferredDate}
            onChange={(e) => setPreferredDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>

        {/* Same Provider Toggle */}
        <div className="mb-4">
          <label className="flex items-center gap-3 p-4 border border-zinc-300 rounded-lg cursor-pointer hover:bg-zinc-50 transition-colors">
            <input
              type="checkbox"
              checked={sameProvider}
              onChange={(e) => setSameProvider(e.target.checked)}
              className="w-5 h-5 text-emerald-600 rounded focus:ring-2 focus:ring-emerald-500"
            />
            <div>
              <p className="text-sm font-semibold text-zinc-900">
                Use my current provider
              </p>
              <p className="text-xs text-zinc-600">
                Request this service from the same provider you trust
              </p>
            </div>
          </label>
        </div>

        {/* Additional Notes */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-zinc-700 mb-2">
            Additional Details (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any specific requirements or questions..."
            maxLength={500}
            rows={3}
            className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
          />
          <p className="text-xs text-zinc-500 mt-1">
            {notes.length}/500 characters
          </p>
        </div>

        {/* Submit Button */}
        <div className="flex gap-3">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1"
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !address}
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              'Request Quote'
            )}
          </Button>
        </div>

        <p className="text-xs text-center text-zinc-500 mt-3">
          Your provider will send you a detailed quote within 24 hours
        </p>
      </div>
    </div>
  );
}
