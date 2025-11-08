"use client"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp,
  Target,
  Clock,
  DollarSign,
  Award,
  Calendar,
  ArrowLeft
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer 
} from 'recharts';
import Link from 'next/link';

interface Analytics {
  totalLeads: number;
  acceptedLeads: number;
  convertedLeads: number;
  unqualifiedLeads: number;
  acceptanceRate: number;
  conversionRate: number;
  avgDaysToConvert: number;
  totalRevenue: number;
  conversionTrend: { date: string; conversions: number }[];
  statusBreakdown: { name: string; value: number; color: string }[];
}

export default function ProviderAnalytics() {
  const router = useRouter();
  const [providerId, setProviderId] = useState('');
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<30 | 60 | 90>(30);

  useEffect(() => {
    const id = localStorage.getItem('providerId');
    if (!id) {
      router.push('/provider/login');
      return;
    }
    setProviderId(id);
    fetchAnalytics(id, timeRange);
  }, [router, timeRange]);

  const fetchAnalytics = async (id: string, days: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/provider/analytics?providerId=${id}&days=${days}`);
      const data = await res.json();
      if (data.analytics) {
        setAnalytics(data.analytics);
      }
    } catch (error) {
      console.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-400">Loading analytics...</div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-400">No analytics data available</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="border-b border-zinc-800 bg-zinc-900/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Link href="/provider/dashboard">
            <Button variant="ghost" className="mb-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-zinc-100">Performance Analytics</h1>
          <p className="text-sm text-zinc-400 mt-1">Track your lead conversion performance</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Time Range Selector */}
        <div className="flex gap-2 mb-6">
          {[30, 60, 90].map((days) => (
            <Button
              key={days}
              variant={timeRange === days ? "default" : "outline"}
              onClick={() => setTimeRange(days as 30 | 60 | 90)}
              className={timeRange === days ? "bg-blue-600" : "border-zinc-700"}
            >
              Last {days} Days
            </Button>
          ))}
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-zinc-400 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Acceptance Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-400">
                {analytics.acceptanceRate}%
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                {analytics.acceptedLeads} of {analytics.totalLeads} leads
              </p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-zinc-400 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Conversion Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-400">
                {analytics.conversionRate}%
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                {analytics.convertedLeads} conversions
              </p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-zinc-400 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Avg Close Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-400">
                {analytics.avgDaysToConvert}
              </div>
              <p className="text-xs text-zinc-500 mt-1">days to convert</p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-zinc-400 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Est. Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-400">
                ${analytics.totalRevenue.toLocaleString()}
              </div>
              <p className="text-xs text-zinc-500 mt-1">from conversions</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Conversion Trend */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-zinc-100 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Conversion Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.conversionTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#71717a"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="#71717a"
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#18181b', 
                      border: '1px solid #27272a',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="conversions" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    name="Conversions"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Status Breakdown */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-zinc-100 flex items-center gap-2">
                <Award className="h-5 w-5" />
                Lead Status Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.statusBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {analytics.statusBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#18181b', 
                      border: '1px solid #27272a',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Performance Insights */}
        <Card className="bg-zinc-900/50 border-zinc-800 mt-6">
          <CardHeader>
            <CardTitle className="text-zinc-100">Performance Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.conversionRate > 50 && (
                <div className="flex items-start gap-3 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-emerald-400 mt-0.5" />
                  <div>
                    <p className="text-emerald-400 font-semibold">Excellent Performance!</p>
                    <p className="text-sm text-zinc-400 mt-1">
                      Your conversion rate is above 50%. Keep up the great work!
                    </p>
                  </div>
                </div>
              )}
              
              {analytics.acceptanceRate < 70 && (
                <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                  <Target className="h-5 w-5 text-amber-400 mt-0.5" />
                  <div>
                    <p className="text-amber-400 font-semibold">Opportunity to Improve</p>
                    <p className="text-sm text-zinc-400 mt-1">
                      Consider accepting more leads to increase your opportunities. Current acceptance rate: {analytics.acceptanceRate}%
                    </p>
                  </div>
                </div>
              )}

              {analytics.avgDaysToConvert > 14 && (
                <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <Clock className="h-5 w-5 text-blue-400 mt-0.5" />
                  <div>
                    <p className="text-blue-400 font-semibold">Speed Up Your Process</p>
                    <p className="text-sm text-zinc-400 mt-1">
                      Your average time to convert is {analytics.avgDaysToConvert} days. 
                      Faster response times often lead to higher conversion rates.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}