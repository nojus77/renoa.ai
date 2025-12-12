'use client';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, Calendar, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { useEffect } from 'react';

interface Booking {
  id: string;
  service: string;
  provider: string;
  datetime: string;
  total: number;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: Booking;
  customerEmail: string;
}

export default function BookingSuccessModal({ open, onOpenChange, booking, customerEmail }: Props) {
  useEffect(() => {
    if (open) {
      // Fire confetti when modal opens
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min;
      };

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [open]);

  const handleAddToCalendar = () => {
    const icsContent = generateICS(booking);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `renoa-booking-${booking.id}.ics`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <div className="text-center space-y-4 py-4">
          <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
            <Check className="h-8 w-8 text-emerald-600" />
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-2">Booking Confirmed!</h3>
            <p className="text-zinc-600 text-sm">
              Your service has been scheduled successfully
            </p>
          </div>

          <div className="bg-zinc-50 rounded-lg p-4 space-y-2 text-sm text-left">
            <div className="flex justify-between">
              <span className="text-zinc-600">Service:</span>
              <span className="font-medium">{booking.service}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-600">Provider:</span>
              <span className="font-medium">{booking.provider}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-600">Date & Time:</span>
              <span className="font-medium">{booking.datetime}</span>
            </div>
            <div className="flex justify-between pt-2 border-t">
              <span className="text-zinc-600">Total:</span>
              <span className="font-semibold text-emerald-600 text-lg">
                ${booking.total.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="space-y-2 text-sm text-zinc-600">
            <p className="flex items-center justify-center gap-2">
              <Check className="h-4 w-4 text-emerald-600" />
              Confirmation sent to {customerEmail}
            </p>
            <p className="flex items-center justify-center gap-2">
              <Check className="h-4 w-4 text-emerald-600" />
              Provider will contact you 24 hours before
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleAddToCalendar}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Add to Calendar
            </Button>
            <Button asChild className="flex-1 bg-emerald-600 hover:bg-emerald-700">
              <Link href={`/customer-portal/jobs/${booking.id}`}>
                <ExternalLink className="h-4 w-4 mr-2" />
                View Details
              </Link>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function generateICS(booking: Booking): string {
  const startDate = new Date(booking.datetime);
  const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours later

  const formatICSDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Renoa//Customer Portal//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${booking.id}@renoa.ai
DTSTAMP:${formatICSDate(new Date())}
DTSTART:${formatICSDate(startDate)}
DTEND:${formatICSDate(endDate)}
SUMMARY:${booking.service} - Renoa
DESCRIPTION:Service with ${booking.provider}\\nTotal: $${booking.total.toFixed(2)}
STATUS:CONFIRMED
SEQUENCE:0
BEGIN:VALARM
TRIGGER:-PT24H
ACTION:DISPLAY
DESCRIPTION:Reminder: ${booking.service} tomorrow with ${booking.provider}
END:VALARM
END:VEVENT
END:VCALENDAR`;
}
