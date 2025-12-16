"use client"

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import ProviderLayout from '@/components/provider/ProviderLayout';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  MapPin,
  ChevronRight,
  Briefcase,
} from 'lucide-react';

interface Worker {
  id: string;
  firstName: string;
  lastName: string;
}

interface TodayJob {
  id: string;
  customerName: string;
  customerPhone: string;
  serviceType: string;
  address: string;
  startTime: string;
  endTime: string;
  status: string;
  totalAmount: number | null;
  workers: Worker[];
}

interface UpcomingJob {
  id: string;
  startTime: string;
  serviceType: string;
  customerName?: string;
  address?: string;
}

interface Stats {
  todaysJobsCount: number;
  weeklyRevenue: number;
  monthlyRevenue: number;
  pendingInvoicesCount: number;
  pendingInvoicesAmount: number;
  newLeadsCount: number;
  completedThisWeek: number;
  completedThisMonth: number;
}

interface RevenueDataPoint {
  date: string;
  amount: number;
  label?: string;
  day?: string;
}

interface HomeData {
  todaysJobs: TodayJob[];
  upcomingJobs: UpcomingJob[];
  stats: Stats;
  revenueHistory: RevenueDataPoint[];
}

// Generate realistic test data
function generateTestData(days: number): RevenueDataPoint[] {
  const data: RevenueDataPoint[] = [];
  const today = new Date();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    // Realistic revenue patterns: weekends higher, some variation
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const baseAmount = isWeekend ? 300 : 180;
    const variation = Math.floor(Math.random() * 150) - 50;
    const amount = Math.max(50, baseAmount + variation);

    data.push({
      date: date.toISOString().split('T')[0],
      amount,
      label: format(date, 'MMM d'),
      day: dayNames[date.getDay()],
    });
  }
  return data;
}

// Custom tooltip for the chart
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg shadow-lg p-3">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-lg font-semibold text-foreground">
          ${payload[0].value.toLocaleString()}
        </p>
      </div>
    );
  }
  return null;
}

export default function ProviderHome() {
  const router = useRouter();
  const [providerName, setProviderName] = useState('');
  const [providerId, setProviderId] = useState('');
  const [loading, setLoading] = useState(true);
  const [homeData, setHomeData] = useState<HomeData | null>(null);
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');

  const loadData = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/provider/home?providerId=${id}`);
      const result = await res.json();

      if (result.success && result.data) {
        const hasRealData = result.data.revenueHistory?.some((d: RevenueDataPoint) => d.amount > 0);

        setHomeData({
          todaysJobs: result.data.todaysJobs || [],
          upcomingJobs: result.data.upcomingJobs || [],
          stats: result.data.stats || {
            todaysJobsCount: 0,
            weeklyRevenue: 0,
            monthlyRevenue: 0,
            pendingInvoicesCount: 0,
            pendingInvoicesAmount: 0,
            newLeadsCount: 0,
            completedThisWeek: 0,
            completedThisMonth: 0,
          },
          revenueHistory: hasRealData
            ? result.data.revenueHistory.map((d: RevenueDataPoint) => ({
                ...d,
                label: format(new Date(d.date), 'MMM d'),
              }))
            : generateTestData(30),
        });
      } else {
        // Use test data for demonstration
        const testData = generateTestData(30);
        const weekTotal = testData.slice(-7).reduce((sum, d) => sum + d.amount, 0);
        const monthTotal = testData.reduce((sum, d) => sum + d.amount, 0);

        setHomeData({
          todaysJobs: [],
          upcomingJobs: [],
          stats: {
            todaysJobsCount: 3,
            weeklyRevenue: weekTotal,
            monthlyRevenue: monthTotal,
            pendingInvoicesCount: 2,
            pendingInvoicesAmount: 450,
            newLeadsCount: 5,
            completedThisWeek: 18,
            completedThisMonth: 67,
          },
          revenueHistory: testData,
        });
      }
    } catch (error) {
      console.error('Error loading home data:', error);
      // Use test data on error
      const testData = generateTestData(30);
      const weekTotal = testData.slice(-7).reduce((sum, d) => sum + d.amount, 0);
      const monthTotal = testData.reduce((sum, d) => sum + d.amount, 0);

      setHomeData({
        todaysJobs: [],
        upcomingJobs: [],
        stats: {
          todaysJobsCount: 3,
          weeklyRevenue: weekTotal,
          monthlyRevenue: monthTotal,
          pendingInvoicesCount: 2,
          pendingInvoicesAmount: 450,
          newLeadsCount: 5,
          completedThisWeek: 18,
          completedThisMonth: 67,
        },
        revenueHistory: testData,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const id = localStorage.getItem('providerId');
    const name = localStorage.getItem('providerName');

    if (!id || !name) {
      router.push('/provider/login');
      return;
    }

    setProviderId(id);
    setProviderName(name);
    loadData(id);
  }, [router, loadData]);

  const formatTime = (date: string) => {
    return format(new Date(date), 'h:mm a');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const chartData = useMemo(() => {
    if (!homeData?.revenueHistory) return [];

    if (viewMode === 'week') {
      return homeData.revenueHistory.slice(-7).map(d => ({
        ...d,
        displayLabel: d.label,
      }));
    }

    // For month view, show every 3rd day label
    return homeData.revenueHistory.map((d, i) => ({
      ...d,
      displayLabel: i % 3 === 0 ? d.label : '',
    }));
  }, [homeData?.revenueHistory, viewMode]);

  const totalRevenue = useMemo(() => {
    if (!homeData) return 0;
    return viewMode === 'week' ? homeData.stats.weeklyRevenue : homeData.stats.monthlyRevenue;
  }, [homeData, viewMode]);

  const jobsCompleted = useMemo(() => {
    if (!homeData) return 0;
    return viewMode === 'week' ? homeData.stats.completedThisWeek : homeData.stats.completedThisMonth;
  }, [homeData, viewMode]);

  const avgPerJob = useMemo(() => {
    if (!jobsCompleted) return 0;
    return Math.round(totalRevenue / jobsCompleted);
  }, [totalRevenue, jobsCompleted]);

  // Calculate week-over-week change
  const weekChange = useMemo(() => {
    if (!homeData?.revenueHistory || homeData.revenueHistory.length < 14) return 12;
    const thisWeek = homeData.revenueHistory.slice(-7).reduce((sum, d) => sum + d.amount, 0);
    const lastWeek = homeData.revenueHistory.slice(-14, -7).reduce((sum, d) => sum + d.amount, 0);
    if (lastWeek === 0) return 100;
    return Math.round(((thisWeek - lastWeek) / lastWeek) * 100);
  }, [homeData?.revenueHistory]);

  if (loading) {
    return (
      <ProviderLayout providerName={providerName}>
        <div className="min-h-[600px] flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground text-lg">Loading dashboard...</div>
        </div>
      </ProviderLayout>
    );
  }

  if (!homeData) {
    return (
      <ProviderLayout providerName={providerName}>
        <div className="min-h-[600px] flex items-center justify-center">
          <div className="text-muted-foreground text-lg">Failed to load dashboard</div>
        </div>
      </ProviderLayout>
    );
  }

  const { todaysJobs, upcomingJobs, stats } = homeData;

  return (
    <ProviderLayout providerName={providerName}>
      {/* Main Container - Properly padded, max-width constrained */}
      <div className="w-full min-h-screen bg-background">
        <div className="max-w-[1400px] mx-auto px-8 py-8">

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-foreground mb-1">
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}
            </h1>
            <p className="text-base text-muted-foreground">
              {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </p>
          </div>

          {/* Main Grid: 65% / 32% with 24px gap */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">

            {/* LEFT COLUMN - Revenue */}
            <div className="space-y-6">

              {/* Revenue Card - Main Focus */}
              <div className="bg-card rounded-2xl border border-border shadow-sm p-6">

                {/* Card Header */}
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="flex items-center gap-4 mb-2">
                      <h2 className="text-lg font-semibold text-foreground">Revenue</h2>

                      {/* Toggle Buttons - Prominent */}
                      <div className="flex bg-muted rounded-lg p-1">
                        <button
                          onClick={() => setViewMode('week')}
                          className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                            viewMode === 'week'
                              ? 'bg-background text-foreground shadow-sm'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          Week
                        </button>
                        <button
                          onClick={() => setViewMode('month')}
                          className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                            viewMode === 'month'
                              ? 'bg-background text-foreground shadow-sm'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          Month
                        </button>
                      </div>
                    </div>

                    {/* Big Revenue Number */}
                    <p className="text-4xl font-bold text-foreground">
                      {formatCurrency(totalRevenue)}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {viewMode === 'week' ? 'This week' : 'This month'}
                    </p>
                  </div>

                  {/* Trend Indicator */}
                  <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${
                    weekChange >= 0
                      ? 'bg-emerald-500/10 text-emerald-600'
                      : 'bg-red-500/10 text-red-600'
                  }`}>
                    {weekChange >= 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    {weekChange >= 0 ? '+' : ''}{weekChange}%
                  </div>
                </div>

                {/* Chart Container - Fixed 400px height */}
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={chartData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1A5F4F" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#1A5F4F" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="currentColor"
                        strokeOpacity={0.1}
                        vertical={false}
                      />
                      <XAxis
                        dataKey="displayLabel"
                        stroke="currentColor"
                        strokeOpacity={0.5}
                        tick={{ fill: 'currentColor', opacity: 0.6, fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                        dy={10}
                      />
                      <YAxis
                        stroke="currentColor"
                        strokeOpacity={0.5}
                        tick={{ fill: 'currentColor', opacity: 0.6, fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `$${value}`}
                        dx={-10}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="amount"
                        stroke="#1A5F4F"
                        strokeWidth={3}
                        fill="url(#colorRevenue)"
                        dot={{ r: 4, fill: '#1A5F4F', strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 6, fill: '#1A5F4F', strokeWidth: 2, stroke: '#fff' }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Stats Row - Below Chart */}
                <div className="grid grid-cols-3 gap-6 pt-6 mt-6 border-t border-border">
                  <div>
                    <p className="text-3xl font-bold text-foreground">{jobsCompleted}</p>
                    <p className="text-sm text-muted-foreground mt-1">Jobs completed</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-foreground">{formatCurrency(avgPerJob)}</p>
                    <p className="text-sm text-muted-foreground mt-1">Avg per job</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-emerald-600">{stats.todaysJobsCount}</p>
                    <p className="text-sm text-muted-foreground mt-1">Today&apos;s jobs</p>
                  </div>
                </div>
              </div>

              {/* Week at a Glance - Compact */}
              <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground">Week at a Glance</h3>
                  <TrendingUp className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-5 bg-muted/40 rounded-xl">
                    <p className="text-3xl font-bold text-foreground">{stats.todaysJobsCount}</p>
                    <p className="text-sm text-muted-foreground mt-1">Today</p>
                  </div>
                  <div className="text-center p-5 bg-muted/40 rounded-xl">
                    <p className="text-3xl font-bold text-foreground">{stats.completedThisWeek}</p>
                    <p className="text-sm text-muted-foreground mt-1">Completed</p>
                  </div>
                  <div className="text-center p-5 bg-emerald-500/10 rounded-xl">
                    <p className="text-3xl font-bold text-emerald-600">{formatCurrency(stats.weeklyRevenue)}</p>
                    <p className="text-sm text-muted-foreground mt-1">Revenue</p>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN - Jobs & Actions */}
            <div className="space-y-6">

              {/* Today's Jobs - Max 240px height */}
              <div className="bg-card rounded-2xl border border-border shadow-sm p-6 max-h-[280px] flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground">Today</h3>
                  <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
                    {todaysJobs.length} jobs
                  </span>
                </div>

                {todaysJobs.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-muted-foreground">
                    <p className="text-sm">No jobs scheduled today</p>
                  </div>
                ) : (
                  <div className="space-y-3 overflow-y-auto flex-1 pr-1">
                    {todaysJobs.slice(0, 4).map((job) => (
                      <button
                        key={job.id}
                        onClick={() => router.push(`/provider/jobs/${job.id}`)}
                        className="w-full p-4 bg-muted/40 hover:bg-muted/60 rounded-xl text-left transition-colors"
                      >
                        <div className="flex items-start justify-between mb-1">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{job.serviceType}</p>
                            <p className="text-xs text-muted-foreground truncate">{job.customerName}</p>
                          </div>
                          <div className="text-right ml-3">
                            <p className="text-sm font-semibold text-emerald-600">{formatTime(job.startTime)}</p>
                            {job.status === 'in_progress' && (
                              <span className="inline-flex items-center text-xs text-orange-500 font-medium">
                                <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-1.5 animate-pulse" />
                                Active
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center text-xs text-muted-foreground mt-2">
                          <MapPin className="h-3 w-3 mr-1.5 flex-shrink-0" />
                          <span className="truncate">{job.address}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Coming Up - Max 320px height */}
              <div className="bg-card rounded-2xl border border-border shadow-sm p-6 max-h-[320px] flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground">Coming Up</h3>
                  <button
                    onClick={() => router.push('/provider/calendar')}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                  >
                    View all
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                {upcomingJobs.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground py-8">
                    <Calendar className="h-10 w-10 mb-3 opacity-50" />
                    <p className="text-sm">No upcoming jobs</p>
                  </div>
                ) : (
                  <div className="space-y-2 overflow-y-auto flex-1 pr-1">
                    {upcomingJobs.slice(0, 5).map((job) => (
                      <button
                        key={job.id}
                        onClick={() => router.push(`/provider/jobs/${job.id}`)}
                        className="w-full flex items-center justify-between p-3 hover:bg-muted/40 rounded-xl transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-muted/60 flex items-center justify-center flex-shrink-0">
                            <Briefcase className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{job.serviceType}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(job.startTime), 'EEE, MMM d')} · {formatTime(job.startTime)}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Needs Attention */}
              {(stats.pendingInvoicesCount > 0 || stats.newLeadsCount > 0) && (
                <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Needs Attention</h3>
                  <div className="space-y-3">
                    {stats.pendingInvoicesCount > 0 && (
                      <button
                        onClick={() => router.push('/provider/invoices')}
                        className="w-full flex items-center justify-between p-4 bg-amber-500/10 hover:bg-amber-500/15 rounded-xl transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <DollarSign className="h-5 w-5 text-amber-600" />
                          <span className="text-sm font-medium text-foreground">
                            {stats.pendingInvoicesCount} unpaid invoices
                          </span>
                        </div>
                        <span className="text-sm font-semibold text-amber-600">
                          {formatCurrency(stats.pendingInvoicesAmount)}
                        </span>
                      </button>
                    )}
                    {stats.newLeadsCount > 0 && (
                      <button
                        onClick={() => router.push('/provider/leads')}
                        className="w-full flex items-center justify-between p-4 bg-purple-500/10 hover:bg-purple-500/15 rounded-xl transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <TrendingUp className="h-5 w-5 text-purple-600" />
                          <span className="text-sm font-medium text-foreground">
                            {stats.newLeadsCount} new leads
                          </span>
                        </div>
                        <ChevronRight className="h-5 w-5 text-purple-600" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProviderLayout>
  );
}
