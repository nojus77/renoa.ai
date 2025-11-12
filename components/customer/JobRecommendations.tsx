'use client';

import { useState, useEffect } from 'react';
import { ChevronRight, DollarSign, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ServiceRequestModal from './ServiceRequestModal';

interface Recommendation {
  id: string;
  baseService: string;
  recommendedService: string;
  recommendedPrice: number;
  description: string | null;
  badge: string | null;
}

interface JobRecommendationsProps {
  serviceType: string;
}

export default function JobRecommendations({ serviceType }: JobRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecommendation, setSelectedRecommendation] = useState<Recommendation | null>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);

  useEffect(() => {
    fetchRecommendations();
  }, [serviceType]);

  const fetchRecommendations = async () => {
    try {
      const response = await fetch('/api/customer/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceType }),
      });
      const data = await response.json();
      setRecommendations(data.recommendations || []);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestService = (recommendation: Recommendation) => {
    setSelectedRecommendation(recommendation);
    setShowRequestModal(true);
  };

  if (loading || recommendations.length === 0) {
    return null; // Don't show section if no recommendations
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-zinc-200 p-6">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-5 w-5 text-emerald-600" />
          <h2 className="text-lg font-bold text-zinc-900">
            Customers Who Got {serviceType} Also Booked:
          </h2>
        </div>
        <p className="text-sm text-zinc-600 mb-5">
          Popular service add-ons from your trusted provider
        </p>

        {/* Horizontal scroll on mobile, grid on desktop */}
        <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2 md:grid md:grid-cols-3 md:overflow-visible">
          {recommendations.map((recommendation) => (
            <div
              key={recommendation.id}
              className="min-w-[280px] md:min-w-0 bg-gradient-to-br from-zinc-50 to-emerald-50 rounded-lg p-4 border border-emerald-200 hover:border-emerald-300 hover:shadow-md transition-all group cursor-pointer flex-shrink-0"
              onClick={() => handleRequestService(recommendation)}
            >
              {/* Badge */}
              {recommendation.badge && (
                <div className="mb-2">
                  <span className="inline-block text-xs bg-emerald-600 text-white px-2 py-1 rounded-full font-semibold">
                    {recommendation.badge}
                  </span>
                </div>
              )}

              {/* Service Name */}
              <h3 className="font-bold text-zinc-900 mb-2 group-hover:text-emerald-600 transition-colors">
                {recommendation.recommendedService}
              </h3>

              {/* Description */}
              <p className="text-xs text-zinc-600 mb-3 line-clamp-2">
                {recommendation.description || 'Perfect complement to your service'}
              </p>

              {/* Price */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                  <span className="text-lg font-bold text-emerald-600">
                    ${recommendation.recommendedPrice.toFixed(0)}
                  </span>
                </div>
                <button className="p-2 rounded-lg bg-emerald-600 text-white group-hover:bg-emerald-700 transition-colors">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Info Note */}
        <div className="mt-4 pt-4 border-t border-zinc-200">
          <p className="text-xs text-zinc-500 text-center">
            Click any service to request a quote from your provider
          </p>
        </div>
      </div>

      {/* Service Request Modal */}
      {selectedRecommendation && (
        <ServiceRequestModal
          isOpen={showRequestModal}
          onClose={() => {
            setShowRequestModal(false);
            setSelectedRecommendation(null);
          }}
          onSuccess={() => {
            setShowRequestModal(false);
            setSelectedRecommendation(null);
          }}
          recommendationId={selectedRecommendation.id}
          serviceType={selectedRecommendation.recommendedService}
          estimatedPrice={selectedRecommendation.recommendedPrice}
          description={selectedRecommendation.description || ''}
        />
      )}
    </>
  );
}
