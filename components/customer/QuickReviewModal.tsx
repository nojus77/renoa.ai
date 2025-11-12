'use client';

import { useState } from 'react';
import { X, Star, ThumbsUp, ThumbsDown, Clock, MessageSquare, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface QuickReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  providerId: string;
  providerName: string;
  serviceType: string;
}

export default function QuickReviewModal({
  isOpen,
  onClose,
  jobId,
  providerId,
  providerName,
  serviceType,
}: QuickReviewModalProps) {
  const [step, setStep] = useState<'review' | 'thankyou'>('review');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [quality, setQuality] = useState<'good' | 'bad' | null>(null);
  const [timeliness, setTimeliness] = useState<'on-time' | 'late' | null>(null);
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [promoCode, setPromoCode] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Please select a star rating');
      return;
    }

    try {
      setSubmitting(true);

      // Map quick answers to detailed ratings
      const qualityRating = quality === 'good' ? 5 : quality === 'bad' ? 2 : rating;
      const timelinessRating = timeliness === 'on-time' ? 5 : timeliness === 'late' ? 2 : rating;
      const communicationRating = rating; // Use overall rating for communication

      const response = await fetch('/api/customer/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          rating,
          qualityRating,
          timelinessRating,
          communicationRating,
          comment: comment || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit review');
      }

      // Generate promo code based on rating
      let generatedPromo = '';
      if (rating >= 4) {
        generatedPromo = 'THANKS15'; // 15% off for good reviews
      } else if (rating >= 3) {
        generatedPromo = 'THANKS10'; // 10% off for average reviews
      }
      setPromoCode(generatedPromo);

      // Move to thank you step
      setStep('thankyou');
    } catch (error: any) {
      console.error('Error submitting review:', error);
      toast.error(error.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  if (step === 'thankyou') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-md w-full p-8 relative animate-in fade-in zoom-in duration-300">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="text-center">
            {/* Success Icon */}
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-8 w-8 text-emerald-600" />
            </div>

            {/* Thank You Message */}
            <h2 className="text-2xl font-bold text-zinc-900 mb-2">
              Thank You! 🎉
            </h2>
            <p className="text-zinc-600 mb-6">
              Your feedback helps us improve and helps other customers make informed decisions.
            </p>

            {/* Promo Code Section */}
            {promoCode && (
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-xl p-6 mb-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Sparkles className="h-5 w-5 text-emerald-600" />
                  <h3 className="text-lg font-bold text-emerald-900">
                    Here's a Special Thank You!
                  </h3>
                </div>
                <p className="text-sm text-emerald-700 mb-3">
                  Get {promoCode === 'THANKS15' ? '15% off' : '10% off'} your next service with us
                </p>
                <div className="bg-white rounded-lg px-4 py-3 border-2 border-dashed border-emerald-300">
                  <p className="text-xs text-emerald-600 font-medium mb-1">Your Promo Code</p>
                  <p className="text-2xl font-bold text-emerald-600 font-mono tracking-wider">
                    {promoCode}
                  </p>
                </div>
                <p className="text-xs text-emerald-600 mt-3">
                  Valid for 30 days on your next booking
                </p>
              </div>
            )}

            {/* CTA Button */}
            <Button
              onClick={onClose}
              className="w-full bg-emerald-600 hover:bg-emerald-500"
            >
              Continue
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
            How was your experience?
          </h2>
          <p className="text-zinc-600">
            {serviceType} by {providerName}
          </p>
        </div>

        {/* Star Rating */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-zinc-700 mb-3">
            Overall Rating *
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="transition-all duration-200 hover:scale-110"
              >
                <Star
                  className={`h-10 w-10 transition-colors ${
                    star <= (hoverRating || rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-zinc-300'
                  }`}
                />
              </button>
            ))}
          </div>
          {rating > 0 && (
            <p className="text-sm text-zinc-600 mt-2">
              {rating === 5 && '⭐ Excellent!'}
              {rating === 4 && '😊 Great!'}
              {rating === 3 && '👍 Good'}
              {rating === 2 && '😐 Could be better'}
              {rating === 1 && '😞 Needs improvement'}
            </p>
          )}
        </div>

        {/* Quick Questions */}
        <div className="space-y-4 mb-6">
          {/* Quality */}
          <div>
            <label className="block text-sm font-semibold text-zinc-700 mb-2">
              Quality of work?
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setQuality('good')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                  quality === 'good'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-zinc-200 hover:border-zinc-300 text-zinc-600'
                }`}
              >
                <ThumbsUp className="h-5 w-5" />
                <span className="font-medium">Great</span>
              </button>
              <button
                type="button"
                onClick={() => setQuality('bad')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                  quality === 'bad'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-zinc-200 hover:border-zinc-300 text-zinc-600'
                }`}
              >
                <ThumbsDown className="h-5 w-5" />
                <span className="font-medium">Poor</span>
              </button>
            </div>
          </div>

          {/* Timeliness */}
          <div>
            <label className="block text-sm font-semibold text-zinc-700 mb-2">
              Was the service on time?
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setTimeliness('on-time')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                  timeliness === 'on-time'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-zinc-200 hover:border-zinc-300 text-zinc-600'
                }`}
              >
                <Clock className="h-5 w-5" />
                <span className="font-medium">On Time</span>
              </button>
              <button
                type="button"
                onClick={() => setTimeliness('late')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                  timeliness === 'late'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-zinc-200 hover:border-zinc-300 text-zinc-600'
                }`}
              >
                <Clock className="h-5 w-5" />
                <span className="font-medium">Late</span>
              </button>
            </div>
          </div>

          {/* Would Recommend */}
          <div>
            <label className="block text-sm font-semibold text-zinc-700 mb-2">
              Would you recommend {providerName}?
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setWouldRecommend(true)}
                className={`flex-1 px-4 py-3 rounded-lg border-2 font-medium transition-all ${
                  wouldRecommend === true
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-zinc-200 hover:border-zinc-300 text-zinc-600'
                }`}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setWouldRecommend(false)}
                className={`flex-1 px-4 py-3 rounded-lg border-2 font-medium transition-all ${
                  wouldRecommend === false
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-zinc-200 hover:border-zinc-300 text-zinc-600'
                }`}
              >
                No
              </button>
            </div>
          </div>
        </div>

        {/* Optional Comment */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-zinc-700 mb-2">
            Additional comments (optional)
          </label>
          <div className="relative">
            <MessageSquare className="absolute left-3 top-3 h-5 w-5 text-zinc-400" />
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share more about your experience..."
              maxLength={500}
              rows={3}
              className="w-full pl-10 pr-4 py-3 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
            />
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            {comment.length}/500 characters
          </p>
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={submitting || rating === 0}
          className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50"
        >
          {submitting ? 'Submitting...' : 'Submit Review'}
        </Button>
      </div>
    </div>
  );
}
