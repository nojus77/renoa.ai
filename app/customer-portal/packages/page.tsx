'use client';

import { useState, useEffect } from 'react';
import { Package, CheckCircle, Sparkles, Loader2, Star } from 'lucide-react';
import CustomerLayout from '@/components/customer/CustomerLayout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import BookPackageModal from '@/components/customer/BookPackageModal';

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

export default function PackagesPage() {
  const [bundles, setBundles] = useState<ServiceBundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeason, setSelectedSeason] = useState<string | null>('all');
  const [selectedBundle, setSelectedBundle] = useState<ServiceBundle | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchBundles();
  }, []);

  const fetchBundles = async () => {
    try {
      const response = await fetch('/api/customer/bundles?season=all');
      const data = await response.json();
      setBundles(data.bundles || []);
    } catch (error) {
      console.error('Error fetching bundles:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeasonEmoji = (season: string | null) => {
    if (!season) return '🏠';
    switch (season) {
      case 'spring':
        return '🌸';
      case 'summer':
        return '☀️';
      case 'fall':
        return '🍂';
      case 'winter':
        return '❄️';
      default:
        return '🏠';
    }
  };

  const filteredBundles =
    selectedSeason === 'all'
      ? bundles
      : bundles.filter((b) => b.season === selectedSeason || b.season === null);

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
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-8 mb-8 border-2 border-purple-200">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-bold text-zinc-900 mb-3 flex items-center gap-3">
            <Package className="h-10 w-10 text-purple-600" />
            Service Packages
          </h1>
          <p className="text-xl text-zinc-700 mb-2">
            Save up to <span className="font-bold text-purple-600">25%</span> when you bundle services
          </p>
          <p className="text-zinc-600">
            Bundle your home maintenance services together and enjoy significant savings on
            professional care for your property.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <Tabs value={selectedSeason || 'all'} onValueChange={setSelectedSeason} className="mb-8">
        <TabsList className="grid w-full grid-cols-5 max-w-2xl">
          <TabsTrigger value="all">All Packages</TabsTrigger>
          <TabsTrigger value="spring">🌸 Spring</TabsTrigger>
          <TabsTrigger value="summer">☀️ Summer</TabsTrigger>
          <TabsTrigger value="fall">🍂 Fall</TabsTrigger>
          <TabsTrigger value="winter">❄️ Winter</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Bundles Grid */}
      {filteredBundles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBundles.map((bundle) => (
            <div
              key={bundle.id}
              className="bg-white rounded-xl border-2 border-zinc-200 hover:border-purple-300 hover:shadow-xl transition-all overflow-hidden group"
            >
              {/* Savings Badge */}
              <div className="relative bg-gradient-to-br from-green-500 to-emerald-600 px-4 py-3">
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getSeasonEmoji(bundle.season)}</span>
                    <div>
                      <div className="text-xs opacity-90">Save</div>
                      <div className="text-2xl font-bold">${bundle.savings}</div>
                    </div>
                  </div>
                  <Sparkles className="h-6 w-6" />
                </div>
              </div>

              <div className="p-6">
                {/* Package Name */}
                <h3 className="text-xl font-bold text-zinc-900 mb-2 group-hover:text-purple-600 transition-colors">
                  {bundle.name}
                </h3>

                {/* Season Badge */}
                {bundle.season && (
                  <Badge variant="outline" className="mb-3 capitalize">
                    {bundle.season}
                  </Badge>
                )}

                {/* Description */}
                <p className="text-sm text-zinc-600 mb-4 line-clamp-3">{bundle.description}</p>

                {/* What's Included Accordion */}
                <Accordion type="single" collapsible className="mb-4">
                  <AccordionItem value="services" className="border-none">
                    <AccordionTrigger className="text-sm font-semibold text-purple-600 hover:text-purple-700 py-2">
                      What&apos;s Included ({bundle.serviceTypes.length} services)
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 pt-2">
                        {bundle.serviceTypes.map((service, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm text-zinc-700">
                            <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                            <span>{service}</span>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                {/* Pricing */}
                <div className="bg-zinc-50 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-zinc-500">Regular Price</span>
                    <span className="text-sm text-zinc-500 line-through">
                      ${bundle.regularPrice.toFixed(0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-zinc-900">Package Price</span>
                    <span className="text-2xl font-bold text-purple-600">
                      ${bundle.bundlePrice.toFixed(0)}
                    </span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-zinc-200">
                    <div className="text-xs text-emerald-600 font-semibold text-center">
                      You save ${bundle.savings}!
                    </div>
                  </div>
                </div>

                {/* Rating (placeholder for now) */}
                <div className="flex items-center gap-1 mb-4 text-sm text-zinc-600">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">4.8</span>
                  <span className="text-zinc-400">(23 reviews)</span>
                </div>

                {/* CTA Button */}
                <Button
                  className="w-full bg-purple-600 hover:bg-purple-500 text-white"
                  onClick={() => {
                    setSelectedBundle(bundle);
                    setModalOpen(true);
                  }}
                >
                  Book This Package
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-xl border-2 border-dashed border-zinc-300 p-12 text-center">
          <Package className="h-16 w-16 text-zinc-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-zinc-900 mb-2">No packages available</h3>
          <p className="text-zinc-600 mb-6">
            {selectedSeason === 'all'
              ? 'No service packages are currently available.'
              : `No packages available for ${selectedSeason}. Check out packages for other seasons!`}
          </p>
          {selectedSeason !== 'all' && (
            <Button onClick={() => setSelectedSeason('all')} variant="outline">
              View All Packages
            </Button>
          )}
        </div>
      )}

      {/* Book Package Modal */}
      <BookPackageModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedBundle(null);
        }}
        bundle={selectedBundle}
      />
    </CustomerLayout>
  );
}
