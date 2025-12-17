'use client';

import { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const SEASON_CONFIG = {
  spring: { emoji: '🌸', title: 'Spring Refresh' },
  summer: { emoji: '☀️', title: 'Summer Maintenance' },
  fall: { emoji: '🍂', title: 'Fall Cleanup' },
  winter: { emoji: '❄️', title: 'Winter Prep' },
};

export default function SeasonalBanner() {
  const [campaign, setCampaign] = useState<any>(null);

  useEffect(() => {
    fetch('/api/customer/seasonal-campaign')
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) setCampaign(data);
      })
      .catch((err) => console.error('Error loading campaign:', err));
  }, []);

  if (!campaign) return null;

  const season = SEASON_CONFIG[campaign.season as keyof typeof SEASON_CONFIG];
  if (!season) return null;

  return (
    <Alert className="border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 mb-6">
      <AlertDescription>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <span className="text-3xl">{season.emoji}</span>
            <div>
              <p className="font-semibold text-emerald-900">
                {season.title} - Save {campaign.discountPercent}%!
              </p>
              <p className="text-sm text-emerald-700">
                {campaign.emailBody?.substring(0, 100) || 'Check out our seasonal offers!'}...
              </p>
            </div>
          </div>
          <Button asChild className="bg-emerald-600 hover:bg-emerald-700 shrink-0">
            <Link href="/customer-portal/packages">Schedule Services</Link>
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
