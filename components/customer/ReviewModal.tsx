'use client';

import { useState } from 'react';
import { Star, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  jobId: string;
  providerName: string;
  serviceType: string;
}

export default function ReviewModal({
  isOpen,
  onClose,
  onSubmit,
  jobId,
  providerName,
  serviceType,
}: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [qualityRating, setQualityRating] = useState(0);
  const [timelinessRating, setTimelinessRating] = useState(0);
  const [communicationRating, setCommunicationRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      toast.error('Please select an overall rating');
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch('/api/customer/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          rating,
          qualityRating: qualityRating || null,
          timelinessRating: timelinessRating || null,
          communicationRating: communicationRating || null,
          comment: comment.trim() || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit review');
      }

      toast.success('Thank you for your review!');
      onSubmit();
      onClose();
    } catch (error: any) {
      console.error('Error submitting review:', error);
      toast.error(error.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const StarRating = ({
    value,
    onChange,
    label,
  }: {
    value: number;
    onChange: (val: number) => void;
    label: string;
  }) => {
    const [hover, setHover] = useState(0);

    return (
      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-2">
          {label}
        </label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              className="transition-transform hover:scale-110"
            >
              <Star
                className={`h-8 w-8 ${
                  star <= (hover || value)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-zinc-300'
                }`}
              />
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-zinc-200 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-zinc-900">Rate Your Service</h2>
            <p className="text-zinc-600 mt-1">
              {serviceType} by {providerName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-zinc-500" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Overall Rating */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              Overall Rating <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-125"
                >
                  <Star
                    className={`h-12 w-12 ${
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
                {rating === 4 && '⭐ Very Good!'}
                {rating === 3 && '⭐ Good'}
                {rating === 2 && '⭐ Fair'}
                {rating === 1 && '⭐ Needs Improvement'}
              </p>
            )}
          </div>

          {/* Detailed Ratings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-zinc-200">
            <StarRating
              value={qualityRating}
              onChange={setQualityRating}
              label="Quality of Work"
            />
            <StarRating
              value={timelinessRating}
              onChange={setTimelinessRating}
              label="Timeliness"
            />
            <StarRating
              value={communicationRating}
              onChange={setCommunicationRating}
              label="Communication"
            />
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              Additional Comments (Optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience with others..."
              rows={4}
              className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              maxLength={500}
            />
            <p className="text-xs text-zinc-500 mt-1">
              {comment.length}/500 characters
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-zinc-200">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="flex-1"
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={rating === 0 || submitting}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Review'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
