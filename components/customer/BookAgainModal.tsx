'use client';

import { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, DollarSign, CheckCircle, Loader2, Tag, Sparkles, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

interface Promotion {
  id: string;
  promoCode: string;
  discountPercent: number | null;
  discountAmount: number | null;
  expiresAt: string;
  status: string;
  triggerType: string;
  message: string | null;
}

interface Upsell {
  id: string;
  upsellService: string;
  upsellPrice: number;
  description: string;
}

interface BookAgainModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  serviceType: string;
  providerId: string;
  providerName: string;
  address: string;
  estimatedValue?: number;
  bookingSource: string; // Track where the booking came from
}

export default function BookAgainModal({
  isOpen,
  onClose,
  onSuccess,
  serviceType,
  providerId,
  providerName,
  address,
  estimatedValue = 150,
  bookingSource,
}: BookAgainModalProps) {
  const [step, setStep] = useState<'booking' | 'success'>('booking');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [duration, setDuration] = useState(2); // hours
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [availablePromos, setAvailablePromos] = useState<Promotion[]>([]);
  const [selectedPromo, setSelectedPromo] = useState<Promotion | null>(null);
  const [loadingPromos, setLoadingPromos] = useState(false);
  const [availableUpsells, setAvailableUpsells] = useState<Upsell[]>([]);
  const [selectedUpsells, setSelectedUpsells] = useState<string[]>([]);
  const [loadingUpsells, setLoadingUpsells] = useState(false);

  // Fetch available promotions and upsells when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchAvailablePromos();
      fetchAvailableUpsells();
    }
  }, [isOpen, serviceType]);

  const fetchAvailablePromos = async () => {
    try {
      setLoadingPromos(true);
      const response = await fetch('/api/customer/promotions');
      const data = await response.json();

      if (data.active && data.active.length > 0) {
        setAvailablePromos(data.active);

        // Auto-apply the best promo (highest discount)
        const bestPromo = data.active.reduce((best: Promotion, current: Promotion) => {
          const bestValue = best.discountPercent
            ? Number(best.discountPercent)
            : Number(best.discountAmount || 0);
          const currentValue = current.discountPercent
            ? Number(current.discountPercent)
            : Number(current.discountAmount || 0);
          return currentValue > bestValue ? current : best;
        });

        setSelectedPromo(bestPromo);
      }
    } catch (error) {
      console.error('Error fetching promos:', error);
    } finally {
      setLoadingPromos(false);
    }
  };

  const fetchAvailableUpsells = async () => {
    try {
      setLoadingUpsells(true);
      const response = await fetch(`/api/customer/upsells?baseService=${encodeURIComponent(serviceType)}`);
      const data = await response.json();

      if (data.upsells && data.upsells.length > 0) {
        setAvailableUpsells(data.upsells);
      }
    } catch (error) {
      console.error('Error fetching upsells:', error);
    } finally {
      setLoadingUpsells(false);
    }
  };

  const calculateUpsellsTotal = () => {
    return availableUpsells
      .filter((upsell) => selectedUpsells.includes(upsell.id))
      .reduce((sum, upsell) => sum + upsell.upsellPrice, 0);
  };

  const calculateDiscount = () => {
    if (!selectedPromo) return 0;

    if (selectedPromo.discountPercent) {
      return (estimatedValue * Number(selectedPromo.discountPercent)) / 100;
    }

    if (selectedPromo.discountAmount) {
      return Number(selectedPromo.discountAmount);
    }

    return 0;
  };

  const getSubtotal = () => {
    return estimatedValue + calculateUpsellsTotal();
  };

  const getFinalPrice = () => {
    return Math.max(0, getSubtotal() - calculateDiscount());
  };

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!date || !startTime) {
      toast.error('Please select a date and time');
      return;
    }

    try {
      setSubmitting(true);

      const startDateTime = new Date(`${date}T${startTime}`);
      const endDateTime = new Date(startDateTime);
      endDateTime.setHours(endDateTime.getHours() + duration);

      // Prepare upsells data
      const upsellsData = availableUpsells
        .filter((upsell) => selectedUpsells.includes(upsell.id))
        .map((upsell) => ({
          service: upsell.upsellService,
          price: upsell.upsellPrice,
        }));

      const response = await fetch('/api/customer/jobs/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceType,
          address,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          estimatedValue,
          customerNotes: notes || undefined,
          bookingSource,
          promoCode: selectedPromo?.promoCode || undefined,
          upsells: upsellsData.length > 0 ? upsellsData : undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to book service');
      }

      setStep('success');
    } catch (error: any) {
      console.error('Error booking service:', error);
      toast.error(error.message || 'Failed to book service');
    } finally {
      setSubmitting(false);
    }
  };

  const getEndTime = () => {
    if (!startTime) return '';
    const [hours, minutes] = startTime.split(':');
    const endHour = (parseInt(hours) + duration) % 24;
    return `${endHour.toString().padStart(2, '0')}:${minutes}`;
  };

  if (step === 'success') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-md w-full p-8 relative animate-in fade-in zoom-in duration-300">
          <button
            onClick={() => {
              onClose();
              setStep('booking');
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
              Service Booked!
            </h2>
            <p className="text-zinc-600 mb-6">
              Your {serviceType.toLowerCase()} service has been scheduled with {providerName}.
            </p>

            {/* Booking Details */}
            <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-4 mb-6 text-left">
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-zinc-700">
                  <Calendar className="h-4 w-4 text-emerald-600" />
                  <span>{new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-700">
                  <Clock className="h-4 w-4 text-emerald-600" />
                  <span>{startTime} - {getEndTime()}</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-700">
                  <MapPin className="h-4 w-4 text-emerald-600" />
                  <span>{address}</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-700">
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                  <span>Est. ${estimatedValue.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <Button
              onClick={() => {
                onClose();
                setStep('booking');
                window.location.href = '/customer-portal/jobs';
              }}
              className="w-full bg-emerald-600 hover:bg-emerald-500"
            >
              View My Jobs
            </Button>

            <button
              onClick={() => {
                onClose();
                setStep('booking');
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
            Book {serviceType} Again
          </h2>
          <p className="text-zinc-600">
            Schedule your next service with {providerName}
          </p>
        </div>

        {/* Service Details */}
        <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4 mb-6">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-600">Service:</span>
              <span className="font-semibold text-zinc-900">{serviceType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-600">Provider:</span>
              <span className="font-semibold text-zinc-900">{providerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-600">Address:</span>
              <span className="font-semibold text-zinc-900">{address}</span>
            </div>
          </div>
        </div>

        {/* Promo Code Section */}
        {availablePromos.length > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-semibold text-zinc-700 mb-2">
              Promo Code
            </label>
            <select
              value={selectedPromo?.id || 'none'}
              onChange={(e) => {
                const promoId = e.target.value;
                if (promoId === 'none') {
                  setSelectedPromo(null);
                } else {
                  const promo = availablePromos.find((p) => p.id === promoId);
                  setSelectedPromo(promo || null);
                }
              }}
              className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="none">No promo code</option>
              {availablePromos.map((promo) => (
                <option key={promo.id} value={promo.id}>
                  {promo.promoCode} -{' '}
                  {promo.discountPercent
                    ? `${promo.discountPercent}% OFF`
                    : `$${promo.discountAmount} OFF`}
                </option>
              ))}
            </select>
            {selectedPromo && (
              <div className="mt-2 flex items-start gap-2 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                <Sparkles className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-xs text-emerald-700">
                  {selectedPromo.message || 'Promo code will be applied to your booking!'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Price Breakdown */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-lg p-4 mb-6">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-zinc-700">
              <span>Base Service:</span>
              <span>${estimatedValue.toFixed(2)}</span>
            </div>
            {calculateUpsellsTotal() > 0 && (
              <div className="flex justify-between text-purple-700 font-medium">
                <span className="flex items-center gap-1">
                  <Plus className="h-4 w-4" />
                  Add-ons ({selectedUpsells.length})
                </span>
                <span>+${calculateUpsellsTotal().toFixed(2)}</span>
              </div>
            )}
            {(calculateUpsellsTotal() > 0 || selectedPromo) && (
              <>
                <div className="border-t border-emerald-300 my-2"></div>
                <div className="flex justify-between text-zinc-700">
                  <span>Subtotal:</span>
                  <span className={selectedPromo ? 'line-through' : 'font-semibold'}>
                    ${getSubtotal().toFixed(2)}
                  </span>
                </div>
              </>
            )}
            {selectedPromo && (
              <>
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span className="flex items-center gap-1">
                    <Tag className="h-4 w-4" />
                    Promo: {selectedPromo.promoCode}
                  </span>
                  <span>-${calculateDiscount().toFixed(2)}</span>
                </div>
                <div className="border-t border-emerald-300 my-2"></div>
              </>
            )}
            <div className="flex justify-between items-center">
              <span className="font-bold text-zinc-900">Total:</span>
              <span className="text-2xl font-bold text-emerald-600">
                ${getFinalPrice().toFixed(2)}
              </span>
            </div>
            {selectedPromo && (
              <div className="bg-green-100 border border-green-300 rounded-md px-3 py-2 text-center">
                <p className="text-sm font-semibold text-green-700">
                  You saved ${calculateDiscount().toFixed(2)}!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Date Selection */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-zinc-700 mb-2">
            Preferred Date *
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>

        {/* Time Selection */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-zinc-700 mb-2">
            Preferred Start Time *
          </label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
          <p className="text-xs text-zinc-500 mt-1">
            Estimated duration: {duration} hour{duration > 1 ? 's' : ''} (ends around {getEndTime()})
          </p>
        </div>

        {/* Duration Selection */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-zinc-700 mb-2">
            Estimated Duration
          </label>
          <select
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          >
            <option value={1}>1 hour</option>
            <option value={2}>2 hours</option>
            <option value={3}>3 hours</option>
            <option value={4}>4 hours</option>
            <option value={6}>6 hours</option>
            <option value={8}>Full day (8 hours)</option>
          </select>
        </div>

        {/* Maximize Your Visit - Upsells Section */}
        {availableUpsells.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Plus className="h-5 w-5 text-purple-600" />
              <h3 className="text-lg font-bold text-zinc-900">Maximize Your Visit</h3>
            </div>
            <p className="text-sm text-zinc-600 mb-4">
              While we&apos;re there, add these popular services and save time:
            </p>

            {loadingUpsells ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {availableUpsells.map((upsell) => (
                  <div
                    key={upsell.id}
                    className={`p-4 border-2 rounded-lg transition-all cursor-pointer ${
                      selectedUpsells.includes(upsell.id)
                        ? 'border-purple-300 bg-purple-50'
                        : 'border-zinc-200 hover:border-purple-200 bg-white'
                    }`}
                    onClick={() => {
                      if (selectedUpsells.includes(upsell.id)) {
                        setSelectedUpsells(selectedUpsells.filter((id) => id !== upsell.id));
                      } else {
                        setSelectedUpsells([...selectedUpsells, upsell.id]);
                      }
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedUpsells.includes(upsell.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedUpsells([...selectedUpsells, upsell.id]);
                          } else {
                            setSelectedUpsells(selectedUpsells.filter((id) => id !== upsell.id));
                          }
                        }}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-semibold text-zinc-900">{upsell.upsellService}</h4>
                          <span className="text-emerald-600 font-bold text-sm whitespace-nowrap ml-2">
                            +${upsell.upsellPrice}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-600">{upsell.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedUpsells.length > 0 && (
              <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-purple-900 font-semibold">
                    {selectedUpsells.length} add-on{selectedUpsells.length > 1 ? 's' : ''} selected
                  </span>
                  <span className="text-purple-600 font-bold">
                    +${calculateUpsellsTotal().toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Optional Notes */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-zinc-700 mb-2">
            Additional Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any special instructions or requests..."
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
            disabled={submitting || !date || !startTime}
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Booking...
              </>
            ) : (
              'Confirm Booking'
            )}
          </Button>
        </div>

        <p className="text-xs text-center text-zinc-500 mt-3">
          Your provider will confirm your booking shortly
        </p>
      </div>
    </div>
  );
}
