'use client';

import { useEffect, useState } from 'react';
import { Tag, Clock, ArrowRight, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface Promotion {
  id: string;
  title: string;
  description: string;
  serviceType: string;
  discountType: string;
  discountValue: number;
  validUntil: string;
  estimatedSavings: string;
  isFromYourProvider: boolean;
  provider: {
    businessName: string;
    rating: number;
  };
}

export default function PromotionsWidget() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/customer/promotions');

      if (!response.ok) {
        throw new Error('Failed to fetch promotions');
      }

      const data = await response.json();
      setPromotions(data.promotions.slice(0, 3)); // Show top 3
    } catch (error: any) {
      console.error('Error fetching promotions:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Expires today!';
    if (diffDays === 1) return 'Expires tomorrow';
    if (diffDays < 7) return `${diffDays} days left`;
    return `Expires ${date.toLocaleDateString()}`;
  };

  if (loading || promotions.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-purple-600" />
        <h2 className="text-lg font-bold text-zinc-900">Special Offers</h2>
      </div>

      <div className="space-y-3">
        {promotions.map((promo) => (
          <div
            key={promo.id}
            className="bg-white rounded-lg p-4 border border-purple-100 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Tag className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-semibold text-purple-700">
                    {promo.estimatedSavings}
                  </span>
                  {promo.isFromYourProvider && (
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                      Your Provider
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-zinc-900 mb-1">
                  {promo.title}
                </h3>
                <p className="text-sm text-zinc-600 mb-2 line-clamp-2">
                  {promo.description}
                </p>
                <div className="flex items-center gap-4 text-xs text-zinc-500">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDate(promo.validUntil)}
                  </span>
                  <span>by {promo.provider.businessName}</span>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-purple-600 flex-shrink-0 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => toast.info('Promotions page coming soon!')}
        className="w-full mt-4 text-sm font-medium text-purple-700 hover:text-purple-800 transition-colors flex items-center justify-center gap-1"
      >
        View all offers
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}
