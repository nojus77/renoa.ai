'use client';

import { useState, useEffect } from 'react';
import { Sparkles, ChevronRight, TrendingUp, Clock, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ServiceRequestModal from './ServiceRequestModal';

interface Recommendation {
  id: string;
  baseService: string;
  recommendedService: string;
  recommendedPrice: number;
  description: string | null;
  badge: string | null;
  baseServiceContext: string;
}

export default function RecommendationsWidget() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecommendation, setSelectedRecommendation] = useState<Recommendation | null>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      const response = await fetch('/api/customer/recommendations');
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

  if (loading) {
    return (
      <div className="bg-white rounded-xl border-2 border-zinc-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 w-48 bg-zinc-200 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-24 bg-zinc-100 rounded-lg"></div>
            <div className="h-24 bg-zinc-100 rounded-lg"></div>
            <div className="h-24 bg-zinc-100 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return null; // Don't show widget if no recommendations
  }

  return (
    <>
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border-2 border-emerald-200 p-6 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-200/30 rounded-full -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-teal-200/30 rounded-full -ml-12 -mb-12"></div>

        {/* Header */}
        <div className="flex items-start justify-between mb-5 relative z-10">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 mb-1 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-600" />
              Recommended For You
            </h2>
            <p className="text-sm text-zinc-600">
              Based on your recent services
            </p>
          </div>
          <div className="bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full">
            PERSONALIZED
          </div>
        </div>

        {/* Recommendations List */}
        <div className="space-y-3 relative z-10">
          {recommendations.slice(0, 3).map((recommendation) => (
            <div
              key={recommendation.id}
              className="bg-white rounded-lg p-4 border border-zinc-200 hover:border-emerald-300 hover:shadow-md transition-all group cursor-pointer"
              onClick={() => handleRequestService(recommendation)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-zinc-900 group-hover:text-emerald-600 transition-colors">
                      {recommendation.recommendedService}
                    </h3>
                    {recommendation.badge && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                        {recommendation.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-600 mb-2">
                    {recommendation.description || `Perfect complement to your ${recommendation.baseServiceContext}`}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-zinc-500">
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      <span className="font-semibold text-emerald-600">
                        ${recommendation.recommendedPrice.toFixed(0)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      <span>Popular add-on</span>
                    </div>
                  </div>
                </div>
                <button className="p-2 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors shrink-0">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* View All Link */}
        {recommendations.length > 3 && (
          <button className="text-sm text-emerald-600 hover:text-emerald-700 font-semibold mt-4 flex items-center gap-1 relative z-10">
            View {recommendations.length - 3} more recommendations
            <ChevronRight className="h-4 w-4" />
          </button>
        )}

        {/* Quick Info */}
        <div className="mt-5 pt-5 border-t border-emerald-200 relative z-10">
          <div className="flex items-center gap-2 text-xs text-zinc-600">
            <Clock className="h-4 w-4 text-emerald-600" />
            <span>Get quotes from your trusted providers</span>
          </div>
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
