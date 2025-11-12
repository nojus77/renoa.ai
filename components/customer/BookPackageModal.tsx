'use client';

import { useState } from 'react';
import { X, Calendar as CalendarIcon, Clock, MapPin, CheckCircle, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface ServiceBundle {
  id: string;
  name: string;
  description: string;
  serviceTypes: string[];
  regularPrice: number;
  bundlePrice: number;
  savings: number;
}

interface BookPackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  bundle: ServiceBundle | null;
  customerAddress?: string;
}

export default function BookPackageModal({
  isOpen,
  onClose,
  bundle,
  customerAddress = '',
}: BookPackageModalProps) {
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState('09:00');
  const [address, setAddress] = useState(customerAddress);
  const [notes, setNotes] = useState('');
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  if (!bundle) return null;

  // Mock addon services (in real app, these would come from API based on bundle services)
  const addons = [
    { id: '1', name: 'Fertilization', description: 'Premium lawn fertilization', price: 45 },
    { id: '2', name: 'Tree Trimming', description: 'Professional tree trimming', price: 200 },
    { id: '3', name: 'Window Cleaning', description: 'Interior and exterior windows', price: 95 },
  ];

  const calculateTotal = () => {
    const addonsTotal = addons
      .filter((addon) => selectedAddons.includes(addon.id))
      .reduce((sum, addon) => sum + addon.price, 0);
    return bundle.bundlePrice + addonsTotal;
  };

  const calculateAddonsTotal = () => {
    return addons
      .filter((addon) => selectedAddons.includes(addon.id))
      .reduce((sum, addon) => sum + addon.price, 0);
  };

  const handleSubmit = async () => {
    if (!date || !address) {
      toast.error('Please select a date and enter your address');
      return;
    }

    try {
      setSubmitting(true);

      // Combine date and time
      const [hours, minutes] = time.split(':');
      const startDateTime = new Date(date);
      startDateTime.setHours(parseInt(hours), parseInt(minutes));

      const response = await fetch('/api/customer/bookings/package', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bundleId: bundle.id,
          date: startDateTime.toISOString(),
          address,
          notes,
          addons: addons.filter((addon) => selectedAddons.includes(addon.id)),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to book package');
      }

      toast.success('Package booked successfully!');
      onClose();
      window.location.href = '/customer-portal/jobs';
    } catch (error: any) {
      console.error('Error booking package:', error);
      toast.error(error.message || 'Failed to book package');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl">{bundle.name}</DialogTitle>
              <div className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold mt-2">
                <Sparkles className="h-4 w-4" />
                Save ${bundle.savings}!
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Package Summary */}
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <h3 className="font-semibold text-zinc-900 mb-3">What's Included</h3>
            <div className="grid grid-cols-2 gap-2">
              {bundle.serviceTypes.map((service, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>{service}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-purple-200">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-zinc-600">Regular Price</span>
                <span className="line-through text-zinc-500">${bundle.regularPrice}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Package Price</span>
                <span className="text-purple-600">${bundle.bundlePrice}</span>
              </div>
            </div>
          </div>

          {/* Date Selection */}
          <div>
            <label className="block text-sm font-semibold text-zinc-900 mb-2">
              Select Date *
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time Selection */}
          <div>
            <label className="block text-sm font-semibold text-zinc-900 mb-2">
              Preferred Start Time *
            </label>
            <select
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="08:00">8:00 AM</option>
              <option value="09:00">9:00 AM</option>
              <option value="10:00">10:00 AM</option>
              <option value="11:00">11:00 AM</option>
              <option value="12:00">12:00 PM</option>
              <option value="13:00">1:00 PM</option>
              <option value="14:00">2:00 PM</option>
              <option value="15:00">3:00 PM</option>
              <option value="16:00">4:00 PM</option>
            </select>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-semibold text-zinc-900 mb-2">
              Service Address *
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Main St, City, State 12345"
              className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Add Extras */}
          <div>
            <h3 className="font-semibold text-zinc-900 mb-2">Want to add more services?</h3>
            <p className="text-sm text-zinc-600 mb-3">Enhance your package with these add-ons</p>
            <div className="space-y-3">
              {addons.map((addon) => (
                <div
                  key={addon.id}
                  className="flex items-start gap-3 p-3 border border-zinc-200 rounded-lg hover:border-purple-300 transition-colors"
                >
                  <Checkbox
                    checked={selectedAddons.includes(addon.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedAddons([...selectedAddons, addon.id]);
                      } else {
                        setSelectedAddons(selectedAddons.filter((id) => id !== addon.id));
                      }
                    }}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold text-zinc-900">{addon.name}</div>
                        <div className="text-sm text-zinc-600">{addon.description}</div>
                      </div>
                      <div className="text-emerald-600 font-semibold">+${addon.price}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Special Instructions */}
          <div>
            <label className="block text-sm font-semibold text-zinc-900 mb-2">
              Special Instructions (optional)
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special requests or instructions..."
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-zinc-500 mt-1">{notes.length}/500 characters</p>
          </div>

          {/* Price Summary */}
          <div className="bg-emerald-50 rounded-lg p-4 border-2 border-emerald-200 sticky bottom-0">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Package Price</span>
                <span>${bundle.bundlePrice}</span>
              </div>
              {calculateAddonsTotal() > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Add-ons</span>
                  <span>${calculateAddonsTotal()}</span>
                </div>
              )}
              <div className="border-t border-emerald-300 pt-2 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-emerald-600">${calculateTotal()}</span>
              </div>
              <div className="text-xs text-center text-emerald-700 font-semibold">
                You're saving ${bundle.savings}!
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={submitting || !date || !address}
              className="w-full mt-4 bg-purple-600 hover:bg-purple-500"
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
