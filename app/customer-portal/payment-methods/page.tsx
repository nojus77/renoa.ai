'use client';

import { useState, useEffect } from 'react';
import { CreditCard, Plus, Trash2, Star, Shield, Loader2 } from 'lucide-react';
import CustomerLayout from '@/components/customer/CustomerLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import SaveCardModal from '@/components/customer/SaveCardModal';

interface PaymentMethod {
  id: string;
  cardBrand: string;
  cardLast4: string;
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
}

export default function PaymentMethodsPage() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);
  const [addCardModalOpen, setAddCardModalOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch('/api/customer/payment-methods');
      const data = await response.json();
      setPaymentMethods(data.paymentMethods || []);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      toast.error('Failed to load payment methods');
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (methodId: string) => {
    try {
      setProcessing(true);
      const response = await fetch(`/api/customer/payment-methods/${methodId}/default`, {
        method: 'PATCH',
      });

      if (!response.ok) {
        throw new Error('Failed to set default payment method');
      }

      toast.success('Default payment method updated');
      fetchPaymentMethods();
    } catch (error: any) {
      console.error('Error setting default:', error);
      toast.error(error.message || 'Failed to update default payment method');
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedMethodId) return;

    try {
      setProcessing(true);
      const response = await fetch(`/api/customer/payment-methods/${selectedMethodId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove payment method');
      }

      toast.success('Payment method removed');
      setDeleteDialogOpen(false);
      setSelectedMethodId(null);
      fetchPaymentMethods();
    } catch (error: any) {
      console.error('Error deleting payment method:', error);
      toast.error(error.message || 'Failed to remove payment method');
    } finally {
      setProcessing(false);
    }
  };

  const getCardIcon = (brand: string) => {
    const brandLower = brand.toLowerCase();
    if (brandLower === 'visa') return '💳';
    if (brandLower === 'mastercard') return '💳';
    if (brandLower === 'amex') return '💳';
    if (brandLower === 'discover') return '💳';
    return '💳';
  };

  if (loading) {
    return (
      <CustomerLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-12 w-12 animate-spin text-emerald-600" />
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 mb-2 flex items-center gap-3">
            <CreditCard className="h-8 w-8 text-emerald-600" />
            Payment Methods
          </h1>
          <p className="text-zinc-600">Manage your saved payment methods securely</p>
        </div>
        <Button
          onClick={() => setAddCardModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Card
        </Button>
      </div>

      {/* Payment Methods Grid */}
      {paymentMethods.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {paymentMethods.map((method) => (
            <div
              key={method.id}
              className={`bg-white rounded-xl border-2 transition-all ${
                method.isDefault
                  ? 'border-emerald-300 shadow-lg'
                  : 'border-zinc-200 hover:border-zinc-300'
              } overflow-hidden`}
            >
              {/* Card Header */}
              <div
                className={`px-6 py-4 ${
                  method.isDefault
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                    : 'bg-gradient-to-r from-zinc-600 to-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getCardIcon(method.cardBrand)}</span>
                    <span className="font-semibold capitalize">{method.cardBrand}</span>
                  </div>
                  {method.isDefault && (
                    <Badge className="bg-white text-emerald-600 hover:bg-white">
                      <Star className="h-3 w-3 mr-1 fill-emerald-600" />
                      Default
                    </Badge>
                  )}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6">
                {/* Card Number */}
                <div className="mb-4">
                  <div className="text-sm text-zinc-500 mb-1">Card Number</div>
                  <div className="text-lg font-mono font-semibold text-zinc-900">
                    •••• •••• •••• {method.cardLast4}
                  </div>
                </div>

                {/* Expiry Date */}
                <div className="mb-4">
                  <div className="text-sm text-zinc-500 mb-1">Expires</div>
                  <div className="text-base font-semibold text-zinc-900">
                    {method.expiryMonth.toString().padStart(2, '0')}/{method.expiryYear}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {!method.isDefault && (
                    <Button
                      onClick={() => handleSetDefault(method.id)}
                      variant="outline"
                      className="flex-1 text-sm"
                      disabled={processing}
                    >
                      Set as Default
                    </Button>
                  )}
                  <Button
                    onClick={() => {
                      setSelectedMethodId(method.id);
                      setDeleteDialogOpen(true);
                    }}
                    variant="outline"
                    className={`${method.isDefault ? 'flex-1' : ''} text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700`}
                    disabled={processing}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-xl border-2 border-dashed border-zinc-300 p-12 text-center mb-8">
          <CreditCard className="h-16 w-16 text-zinc-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-zinc-900 mb-2">No payment methods saved</h3>
          <p className="text-zinc-600 mb-6">
            Add a payment method to speed up future bookings
          </p>
          <Button onClick={() => setAddCardModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-500">
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Card
          </Button>
        </div>
      )}

      {/* Security Footer */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <Shield className="h-6 w-6 text-blue-600 shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-zinc-900 mb-2">Your payments are secure</h3>
            <div className="text-sm text-zinc-700 space-y-1">
              <p>• All payment information is encrypted and securely stored by Stripe</p>
              <p>• We never store your full card number</p>
              <p>• PCI DSS Level 1 compliant</p>
              <p>• 3D Secure authentication for high-value transactions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Payment Method</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this payment method? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={processing}
              className="bg-red-600 hover:bg-red-500"
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Removing...
                </>
              ) : (
                'Remove'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Card Modal */}
      <SaveCardModal
        isOpen={addCardModalOpen}
        onClose={() => setAddCardModalOpen(false)}
        onSuccess={() => {
          setAddCardModalOpen(false);
          fetchPaymentMethods();
        }}
      />
    </CustomerLayout>
  );
}
