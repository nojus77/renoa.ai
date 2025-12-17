'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Trophy, Gift, Star, Sparkles, Loader2, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import confetti from 'canvas-confetti';

const TIER_CONFIG = {
  bronze: {
    color: 'bg-amber-700 text-white',
    icon: '🥉',
    nextTier: 'silver',
    nextThreshold: 1000,
  },
  silver: {
    color: 'bg-gray-400 text-white',
    icon: '🥈',
    nextTier: 'gold',
    nextThreshold: 2500,
  },
  gold: {
    color: 'bg-yellow-500 text-white',
    icon: '🥇',
    nextTier: 'platinum',
    nextThreshold: 5000,
  },
  platinum: {
    color: 'bg-purple-500 text-white',
    icon: '💎',
    nextTier: null,
    nextThreshold: null,
  },
};

interface LoyaltyData {
  id: string;
  points: number;
  lifetimePoints: number;
  tier: string;
  transactions: Array<{
    id: string;
    points: number;
    type: string;
    description: string;
    createdAt: string;
  }>;
}

interface Reward {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  rewardValue: number;
  rewardType: string;
  active: boolean;
}

export default function RewardsPage() {
  const [loyalty, setLoyalty] = useState<LoyaltyData | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [redeeming, setRedeeming] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/customer/loyalty').then((r) => r.json()),
      fetch('/api/customer/loyalty/rewards').then((r) => r.json()),
    ])
      .then(([loyaltyData, rewardsData]) => {
        if (!loyaltyData.error) setLoyalty(loyaltyData);
        if (!rewardsData.error) setRewards(rewardsData.rewards);
      })
      .catch((err) => console.error('Error loading rewards:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleRedeem = async () => {
    if (!selectedReward || !loyalty) return;

    setRedeeming(true);
    try {
      const response = await fetch('/api/customer/loyalty/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rewardId: selectedReward.id }),
      });

      const data = await response.json();

      if (data.success) {
        // Fire confetti
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });

        // Update local state
        setLoyalty((prev) =>
          prev ? { ...prev, points: prev.points - selectedReward.pointsCost } : null
        );

        // Close modal after a moment
        setTimeout(() => setSelectedReward(null), 2000);
      } else {
        alert(data.error || 'Failed to redeem reward');
      }
    } catch (error) {
      console.error('Error redeeming reward:', error);
      alert('Failed to redeem reward');
    } finally {
      setRedeeming(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!loyalty) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Unable to Load Rewards</CardTitle>
            <CardDescription>Please try again later.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const tierConfig = TIER_CONFIG[(loyalty.tier || 'bronze') as keyof typeof TIER_CONFIG];
  const progressToNext = tierConfig?.nextThreshold
    ? ((loyalty.lifetimePoints || 0) / tierConfig.nextThreshold) * 100
    : 100;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">Loyalty Rewards</h1>
          <p className="text-zinc-600">Earn points with every service and redeem amazing rewards</p>
        </div>
        <Trophy className="h-12 w-12 text-emerald-600" />
      </div>

      {/* Points Balance Card */}
      <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">Your Points</CardTitle>
            <Badge className={tierConfig?.color || 'bg-amber-700 text-white'}>
              {tierConfig?.icon || '🥉'} {(loyalty.tier || 'bronze').toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-5xl font-bold text-emerald-600">
                {(loyalty.points || 0).toLocaleString()}
              </p>
              <p className="text-sm text-zinc-500 mt-1">
                {(loyalty.lifetimePoints || 0).toLocaleString()} lifetime points earned
              </p>
            </div>

            {tierConfig?.nextTier && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-600">Progress to {tierConfig.nextTier}</span>
                  <span className="font-medium">
                    {loyalty.lifetimePoints || 0} / {tierConfig.nextThreshold}
                  </span>
                </div>
                <Progress value={progressToNext} className="h-3" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Ways to Earn */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-emerald-600" />
            Ways to Earn Points
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3 p-4 bg-emerald-50 rounded-lg">
              <Star className="h-5 w-5 text-emerald-600 mt-1" />
              <div>
                <p className="font-semibold text-zinc-900">Book Services</p>
                <p className="text-sm text-zinc-600">Earn 1 point per $1 spent</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
              <Gift className="h-5 w-5 text-blue-600 mt-1" />
              <div>
                <p className="font-semibold text-zinc-900">Tier Bonuses</p>
                <p className="text-sm text-zinc-600">Silver: 5%, Gold: 10%, Platinum: 15%</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg">
              <Trophy className="h-5 w-5 text-purple-600 mt-1" />
              <div>
                <p className="font-semibold text-zinc-900">Special Offers</p>
                <p className="text-sm text-zinc-600">Bonus points on select services</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Rewards */}
      <Card>
        <CardHeader>
          <CardTitle>Available Rewards</CardTitle>
          <CardDescription>Redeem your points for exclusive benefits</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(rewards || [])
              .filter((r) => r.active)
              .sort((a, b) => a.pointsCost - b.pointsCost)
              .map((reward) => {
                const canAfford = (loyalty.points || 0) >= reward.pointsCost;
                return (
                  <Card
                    key={reward.id}
                    className={`border-2 ${
                      canAfford ? 'border-emerald-200 hover:border-emerald-400' : 'border-zinc-200 opacity-60'
                    } transition-all cursor-pointer`}
                    onClick={() => canAfford && setSelectedReward(reward)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-lg">{reward.name}</CardTitle>
                        <Badge variant={canAfford ? 'default' : 'secondary'}>
                          {reward.pointsCost.toLocaleString()} pts
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-zinc-600 mb-4">{reward.description}</p>
                      <Button
                        className="w-full"
                        disabled={!canAfford}
                        onClick={() => canAfford && setSelectedReward(reward)}
                      >
                        {canAfford ? 'Redeem' : `Need ${(reward.pointsCost - (loyalty.points || 0)).toLocaleString()} more`}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </CardContent>
      </Card>

      {/* Points History */}
      <Card>
        <CardHeader>
          <CardTitle>Points History</CardTitle>
          <CardDescription>Your recent point transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {loyalty.transactions && loyalty.transactions.length > 0 ? (
              loyalty.transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-full ${
                        transaction.points > 0 ? 'bg-green-100' : 'bg-red-100'
                      }`}
                    >
                      {transaction.points > 0 ? (
                        <Star className="h-4 w-4 text-green-600" />
                      ) : (
                        <Gift className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-zinc-900">{transaction.description}</p>
                      <p className="text-xs text-zinc-500">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`font-bold ${
                      transaction.points > 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {transaction.points > 0 ? '+' : ''}
                    {transaction.points.toLocaleString()}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-center text-zinc-500 py-8">No transactions yet</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Redemption Dialog */}
      <Dialog open={!!selectedReward} onOpenChange={() => setSelectedReward(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redeem Reward</DialogTitle>
            <DialogDescription>
              Are you sure you want to redeem this reward?
            </DialogDescription>
          </DialogHeader>
          {selectedReward && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 rounded-lg">
                <p className="font-semibold text-lg text-zinc-900">{selectedReward.name}</p>
                <p className="text-sm text-zinc-600 mt-1">{selectedReward.description}</p>
              </div>
              <div className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg">
                <span className="text-zinc-600">Cost:</span>
                <span className="font-bold text-emerald-600">
                  {selectedReward.pointsCost.toLocaleString()} points
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg">
                <span className="text-zinc-600">Remaining Balance:</span>
                <span className="font-bold">
                  {((loyalty.points || 0) - selectedReward.pointsCost).toLocaleString()} points
                </span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedReward(null)} disabled={redeeming}>
              Cancel
            </Button>
            <Button onClick={handleRedeem} disabled={redeeming}>
              {redeeming ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Redeeming...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Confirm Redemption
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
