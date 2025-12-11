'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Trophy, Loader2 } from 'lucide-react';

const TIER_COLORS = {
  bronze: 'bg-amber-700 text-white',
  silver: 'bg-gray-400 text-white',
  gold: 'bg-yellow-500 text-white',
  platinum: 'bg-purple-500 text-white',
};

const NEXT_REWARDS = [
  { points: 250, reward: '$25 Credit' },
  { points: 500, reward: '$50 Credit' },
  { points: 1000, reward: '$100 Credit' },
  { points: 1500, reward: 'Free Service' },
  { points: 2000, reward: 'Priority Scheduling' },
  { points: 3000, reward: 'VIP Package' },
];

export default function LoyaltyWidget() {
  const [loyalty, setLoyalty] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/customer/loyalty')
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) setLoyalty(data);
      })
      .catch((err) => console.error('Error loading loyalty:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </CardContent>
      </Card>
    );
  }

  if (!loyalty) return null;

  const nextReward =
    NEXT_REWARDS.find((r) => r.points > loyalty.points) ||
    NEXT_REWARDS[NEXT_REWARDS.length - 1];
  const progress = Math.min((loyalty.points / nextReward.points) * 100, 100);

  return (
    <Card className="border-2 border-emerald-200">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-emerald-600" />
            Your Rewards
          </span>
          <Badge className={TIER_COLORS[loyalty.tier as keyof typeof TIER_COLORS]}>
            {loyalty.tier.toUpperCase()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-4xl font-bold text-emerald-600">
              {loyalty.points.toLocaleString()}
              <span className="text-sm text-zinc-500 ml-2 font-normal">points</span>
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              Lifetime: {loyalty.lifetimePoints.toLocaleString()} points
            </p>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-zinc-600">Next: {nextReward.reward}</span>
              <span className="font-medium">
                {loyalty.points}/{nextReward.points}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <Button asChild className="w-full bg-emerald-600 hover:bg-emerald-700">
            <Link href="/customer-portal/rewards">View All Rewards</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
