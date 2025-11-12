"use client";

import { useState } from 'react';
import { AlertCircle, Camera, CheckCircle, DollarSign, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface CompleteJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (result: { invoiceId?: string; invoiceNumber?: string }) => void;
  hasAfterPhotos: boolean;
  estimatedValue?: number;
  jobId: string;
  customerId: string;
  providerId: string;
  serviceType: string;
}

export default function CompleteJobModal({
  isOpen,
  onClose,
  onComplete,
  hasAfterPhotos,
  estimatedValue = 0,
  jobId,
  customerId,
  providerId,
  serviceType,
}: CompleteJobModalProps) {
  const [step, setStep] = useState<'photos' | 'price' | 'invoice'>('photos');
  const [actualValue, setActualValue] = useState(estimatedValue.toString());
  const [creatingInvoice, setCreatingInvoice] = useState(false);

  if (!isOpen) return null;

  const handleCompleteWithoutInvoice = async () => {
    try {
      // Update job with actual value and mark complete
      const response = await fetch(`/api/provider/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'completed',
          actualValue: parseFloat(actualValue) || estimatedValue,
        }),
      });

      if (!response.ok) throw new Error('Failed to complete job');

      toast.success('Job marked as complete!');
      onComplete({});
      onClose();
    } catch (error) {
      toast.error('Failed to complete job');
    }
  };

  const handleCreateAndSendInvoice = async () => {
    try {
      setCreatingInvoice(true);

      // First, complete the job with actual value
      const jobResponse = await fetch(`/api/provider/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'completed',
          actualValue: parseFloat(actualValue) || estimatedValue,
        }),
      });

      if (!jobResponse.ok) throw new Error('Failed to complete job');

      // Create invoice
      const invoiceDate = new Date();
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30); // 30 days payment terms

      const invoiceResponse = await fetch('/api/provider/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId,
          customerId,
          jobId,
          invoiceDate: invoiceDate.toISOString(),
          dueDate: dueDate.toISOString(),
          lineItems: [
            {
              description: serviceType,
              quantity: 1,
              unitPrice: parseFloat(actualValue) || estimatedValue,
            },
          ],
          taxRate: 0,
          discountType: null,
          discountValue: 0,
          notes: 'Thank you for your business!',
          status: 'sent',
        }),
      });

      if (!invoiceResponse.ok) throw new Error('Failed to create invoice');

      const invoiceData = await invoiceResponse.json();

      toast.success('Job completed and invoice sent!');
      onComplete({
        invoiceId: invoiceData.id,
        invoiceNumber: invoiceData.invoiceNumber,
      });
      onClose();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to create invoice. Job completed, but please create invoice manually.');
      onComplete({});
      onClose();
    } finally {
      setCreatingInvoice(false);
    }
  };

  // Step 1: Photos check
  if (step === 'photos') {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 max-w-md w-full shadow-2xl">
          <div className="p-6 border-b border-zinc-800">
            <h2 className="text-2xl font-bold text-zinc-100">
              Mark this job as complete?
            </h2>
          </div>

          <div className="p-6">
            {!hasAfterPhotos ? (
              <>
                <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg mb-4">
                  <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-yellow-400 mb-1">
                      No after photos yet
                    </p>
                    <p className="text-xs text-zinc-400">
                      Photos help with customer satisfaction, your portfolio, and protection.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button
                    onClick={onClose}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-6 text-base font-semibold"
                  >
                    <Camera className="h-5 w-5 mr-2" />
                    Add Photos First (Recommended)
                  </Button>
                  <Button
                    onClick={() => setStep('price')}
                    variant="outline"
                    className="w-full border-zinc-700 hover:bg-zinc-800 py-3 text-zinc-300"
                  >
                    Continue Without Photos
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start gap-3 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg mb-4">
                  <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-400">
                      Great! After photos uploaded.
                    </p>
                  </div>
                </div>

                <Button
                  onClick={() => setStep('price')}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-6 text-base font-semibold"
                >
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Continue
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Price confirmation
  if (step === 'price') {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 max-w-md w-full shadow-2xl">
          <div className="p-6 border-b border-zinc-800">
            <h2 className="text-2xl font-bold text-zinc-100">
              Confirm final price
            </h2>
            <p className="text-sm text-zinc-400 mt-1">
              Is this the correct amount to charge?
            </p>
          </div>

          <div className="p-6">
            <div className="mb-6">
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Final Amount
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
                <input
                  type="number"
                  value={actualValue}
                  onChange={(e) => setActualValue(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-lg font-semibold"
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
              {estimatedValue > 0 && (
                <p className="text-xs text-zinc-500 mt-2">
                  Estimated: ${estimatedValue.toFixed(2)}
                </p>
              )}
            </div>

            <Button
              onClick={() => setStep('invoice')}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-6 text-base font-semibold mb-2"
              disabled={!actualValue || parseFloat(actualValue) <= 0}
            >
              Confirm Amount
            </Button>
            <Button
              onClick={() => setStep('photos')}
              variant="outline"
              className="w-full border-zinc-700 hover:bg-zinc-800 py-3 text-zinc-300"
            >
              Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Invoice options
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 max-w-md w-full shadow-2xl">
        <div className="p-6 border-b border-zinc-800">
          <h2 className="text-2xl font-bold text-zinc-100">
            Create invoice now?
          </h2>
          <p className="text-sm text-zinc-400 mt-1">
            Save time by creating and sending the invoice immediately
          </p>
        </div>

        <div className="p-6">
          <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-zinc-400">Final amount:</span>
              <span className="text-xl font-bold text-emerald-400">
                ${parseFloat(actualValue).toFixed(2)}
              </span>
            </div>
            <div className="text-xs text-zinc-500">
              Invoice will be created and sent to customer immediately
            </div>
          </div>

          <div className="space-y-2">
            <Button
              onClick={handleCreateAndSendInvoice}
              disabled={creatingInvoice}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-6 text-base font-semibold"
            >
              <FileText className="h-5 w-5 mr-2" />
              {creatingInvoice ? 'Creating Invoice...' : 'Create & Send Invoice'}
            </Button>
            <Button
              onClick={handleCompleteWithoutInvoice}
              disabled={creatingInvoice}
              variant="outline"
              className="w-full border-zinc-700 hover:bg-zinc-800 py-3 text-zinc-300"
            >
              Complete Without Invoice
            </Button>
            <Button
              onClick={() => setStep('price')}
              disabled={creatingInvoice}
              variant="ghost"
              className="w-full text-zinc-500 hover:text-zinc-300"
            >
              Back
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
