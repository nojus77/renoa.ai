'use client';

import { useState, useEffect } from 'react';
import { Package, CheckCircle, ChevronRight, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ServiceBundle {
  id: string;
  name: string;
  description: string;
  serviceTypes: string[];
  regularPrice: number;
  bundlePrice: number;
  savings: number;
  season: string | null;
}

interface ServiceBundlesWidgetProps {
  onSelectBundle?: (bundle: ServiceBundle) => void;
}

export default function ServiceBundlesWidget({ onSelectBundle }: ServiceBundlesWidgetProps) {
  const [bundles, setBundles] = useState<ServiceBundle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBundles();
  }, []);

  const fetchBundles = async () => {
    try {
      const response = await fetch('/api/customer/bundles');
      const data = await response.json();
      setBundles(data.bundles || []);
    } catch (error) {
      console.error('Error fetching bundles:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border-2 border-zinc-200 p-6">
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      </div>
    );
  }

  if (bundles.length === 0) {
    return null; // Don't show widget if no bundles available
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200 p-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-300/20 rounded-full -mr-16 -mt-16"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-pink-300/20 rounded-full -ml-12 -mb-12"></div>

      {/* Header */}
      <div className="flex items-start justify-between mb-5 relative z-10">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 mb-1 flex items-center gap-2">
            <Package className="h-5 w-5 text-purple-600" />
            Seasonal Packages
          </h2>
          <p className="text-sm text-zinc-600">Save big with bundled services</p>
        </div>
        <div className="bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full">
          SAVE UP TO ${Math.max(...bundles.map((b) => b.savings))}
        </div>
      </div>

      {/* Bundles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
        {bundles.slice(0, 2).map((bundle) => (
          <div
            key={bundle.id}
            className="bg-white rounded-lg p-5 border border-zinc-200 hover:border-purple-300 hover:shadow-lg transition-all group cursor-pointer"
            onClick={() => onSelectBundle?.(bundle)}
          >
            {/* Savings Badge */}
            <div className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold mb-3">
              <Sparkles className="h-3 w-3" />
              Save ${bundle.savings}!
            </div>

            {/* Package Name */}
            <h3 className="font-bold text-lg text-zinc-900 mb-2 group-hover:text-purple-600 transition-colors">
              {bundle.name}
            </h3>

            {/* Services List */}
            <div className="space-y-1.5 mb-4">
              {bundle.serviceTypes.slice(0, 3).map((service, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm text-zinc-600">
                  <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>{service}</span>
                </div>
              ))}
              {bundle.serviceTypes.length > 3 && (
                <div className="flex items-center gap-2 text-sm text-zinc-500 italic">
                  <span className="ml-6">+ {bundle.serviceTypes.length - 3} more</span>
                </div>
              )}
            </div>

            {/* Pricing */}
            <div className="flex items-end justify-between mb-3">
              <div>
                <div className="text-sm text-zinc-500 line-through mb-0.5">
                  ${bundle.regularPrice.toFixed(0)}
                </div>
                <div className="text-2xl font-bold text-purple-600">
                  ${bundle.bundlePrice.toFixed(0)}
                </div>
              </div>
              <div className="flex items-center gap-1 text-emerald-600 text-sm font-semibold">
                <span>View Details</span>
                <ChevronRight className="h-4 w-4" />
              </div>
            </div>

            {/* CTA Button */}
            <Button className="w-full bg-purple-600 hover:bg-purple-500 text-white">
              Book Package
            </Button>
          </div>
        ))}
      </div>

      {/* View All Link */}
      {bundles.length > 2 && (
        <div className="mt-5 text-center relative z-10">
          <a
            href="/customer-portal/packages"
            className="text-sm text-purple-600 hover:text-purple-700 font-semibold inline-flex items-center gap-1"
          >
            View {bundles.length - 2} more packages
            <ChevronRight className="h-4 w-4" />
          </a>
        </div>
      )}
    </div>
  );
}
