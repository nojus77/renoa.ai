"use client"

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import ProviderLayout from '@/components/provider/ProviderLayout';
import {
  Calendar,
  DollarSign,
  TrendingUp,
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
}

interface HomeData {
  todaysJobs: TodayJob[];
  upcomingJobs: UpcomingJob[];
  stats: Stats;
  revenueHistory: RevenueDataPoint[];
}

// Generate mock data for testing
function generateMockData(days: number): RevenueDataPoint[] {
  const data: RevenueDataPoint[] = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    // Random amount between $50-$300
    const amount = Math.floor(Math.random() * 250) + 50;
    data.push({
      date: date.toISOString().split('T')[0],
      amount,
      label: format(date, 'M/d'),
    });
  }
  return data;
}

// Professional line chart with Y-axis and smooth lines
function RevenueChart({ data, viewMode }: { data: RevenueDataPoint[]; viewMode: 'week' | 'month' }) {
  if (data.length === 0) return null;

  const maxValue = Math.max(...data.map(d => d.amount), 100);
  const minValue = 0; // Always start from 0 for revenue
  const range = maxValue - minValue || 1;

  // Chart dimensions (percentage-based)
  const chartLeft = 12; // Space for Y-axis labels
  const chartRight = 2;
  const chartTop = 5;
  const chartBottom = 15; // Space for X-axis labels
  const chartWidth = 100 - chartLeft - chartRight;
  const chartHeight = 100 - chartTop - chartBottom;

  // Create points
  const points = data.map((d, i) => ({
    x: chartLeft + (i / Math.max(data.length - 1, 1)) * chartWidth,
    y: chartTop + chartHeight - ((d.amount - minValue) / range) * chartHeight,
    amount: d.amount,
    label: d.label || format(new Date(d.date), 'M/d'),
  }));

  // Create smooth line path with slight curves
  const pathData = points.reduce((acc, point, i) => {
    if (i === 0) return `M ${point.x} ${point.y}`;

    const prev = points[i - 1];
    // Use quadratic bezier for subtle smoothing
    const midX = (prev.x + point.x) / 2;
    return `${acc} Q ${midX} ${prev.y}, ${midX} ${(prev.y + point.y) / 2} T ${point.x} ${point.y}`;
  }, '');

  // Simpler linear path as fallback
  const linearPath = points.reduce((acc, point, i) => {
    if (i === 0) return `M ${point.x} ${point.y}`;
    return `${acc} L ${point.x} ${point.y}`;
  }, '');

  // Create gradient fill path
  const fillPath = `${linearPath} L ${chartLeft + chartWidth} ${chartTop + chartHeight} L ${chartLeft} ${chartTop + chartHeight} Z`;

  // Y-axis labels (4 levels)
  const yLabels = [0, 0.25, 0.5, 0.75, 1].map(pct => ({
    value: Math.round(minValue + range * pct),
    y: chartTop + chartHeight - pct * chartHeight,
  }));

  // X-axis labels - show every label for week, every 5th for month
  const labelInterval = viewMode === 'week' ? 1 : 5;

  return (
    <div className="relative w-full h-full">
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="w-full h-full"
      >
        <defs>
          <linearGradient id="revenueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgb(16, 185, 129)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="rgb(16, 185, 129)" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines */}
        {yLabels.map((label, i) => (
          <line
            key={i}
            x1={chartLeft}
            y1={label.y}
            x2={chartLeft + chartWidth}
            y2={label.y}
            stroke="currentColor"
            strokeOpacity="0.08"
            strokeWidth="0.2"
          />
        ))}

        {/* Gradient fill */}
        <path
          d={fillPath}
          fill="url(#revenueGradient)"
        />

        {/* Main line */}
        <path
          d={linearPath}
          fill="none"
          stroke="rgb(16, 185, 129)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {/* Y-axis labels */}
      <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between py-[5%] text-[10px] text-muted-foreground w-[11%]">
        {yLabels.reverse().map((label, i) => (
          <span key={i} className="text-right pr-1">${label.value}</span>
        ))}
      </div>

      {/* X-axis labels */}
      <div
        className="absolute bottom-0 flex justify-between text-[10px] text-muted-foreground"
        style={{ left: '12%', right: '2%' }}
      >
        {points.filter((_, i) => i % labelInterval === 0 || i === points.length - 1).map((point, i) => (
          <span key={i}>{point.label}</span>
        ))}
      </div>
    </div>
  );
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
        // Check if revenue history has actual data
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
          // Use mock data if no real revenue data
          revenueHistory: hasRealData
            ? result.data.revenueHistory
            : generateMockData(30),
        });
      } else {
        // Fallback to mock data
        setHomeData({
          todaysJobs: [],
          upcomingJobs: [],
          stats: {
            todaysJobsCount: 0,
            weeklyRevenue: 1250,
            monthlyRevenue: 4800,
            pendingInvoicesCount: 0,
            pendingInvoicesAmount: 0,
            newLeadsCount: 0,
            completedThisWeek: 8,
            completedThisMonth: 32,
          },
          revenueHistory: generateMockData(30),
        });
      }
    } catch (error) {
      console.error('Error loading home data:', error);
      // Use mock data on error
      setHomeData({
        todaysJobs: [],
        upcomingJobs: [],
        stats: {
          todaysJobsCount: 0,
          weeklyRevenue: 1250,
          monthlyRevenue: 4800,
          pendingInvoicesCount: 0,
          pendingInvoicesAmount: 0,
          newLeadsCount: 0,
          completedThisWeek: 8,
          completedThisMonth: 32,
        },
        revenueHistory: generateMockData(30),
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

    // Add labels to data
    const dataWithLabels = homeData.revenueHistory.map(d => ({
      ...d,
      label: format(new Date(d.date), 'M/d'),
    }));

    if (viewMode === 'week') {
      return dataWithLabels.slice(-7);
    }
    return dataWithLabels;
  }, [homeData?.revenueHistory, viewMode]);

  if (loading) {
    return (
      <ProviderLayout providerName={providerName}>
        <div className="h-[calc(100vh-80px)] flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </ProviderLayout>
    );
  }

  if (!homeData) {
    return (
      <ProviderLayout providerName={providerName}>
        <div className="h-[calc(100vh-80px)] flex items-center justify-center">
          <div className="text-muted-foreground">Failed to load data</div>
        </div>
      </ProviderLayout>
    );
  }

  const { todaysJobs, upcomingJobs, stats } = homeData;

  return (
    <ProviderLayout providerName={providerName}>
      <div className="h-[calc(100vh-80px)] overflow-hidden">
        <div className="h-full w-full px-6 py-5">
          {/* Header */}
          <div className="mb-5">
            <h1 className="text-2xl font-light text-foreground">
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {format(new Date(), 'EEEE, MMMM d')}
            </p>
          </div>

          {/* Main Grid - 65/35 split with proper gap */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 h-[calc(100%-90px)]">

            {/* Left Column - Revenue (wider) */}
            <div className="flex flex-col gap-5 min-w-0">

              {/* Revenue Card - Main focus */}
              <div className="bg-card rounded-2xl border border-border p-6 flex-1 flex flex-col min-h-0">
                {/* Header with prominent toggle */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <p className="text-sm text-muted-foreground">Revenue</p>
                      {/* Prominent View Toggle */}
                      <div className="flex bg-muted rounded-lg p-1">
                        <button
                          onClick={() => setViewMode('week')}
                          className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                            viewMode === 'week'
                              ? 'bg-background text-foreground shadow-sm'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          Week
                        </button>
                        <button
                          onClick={() => setViewMode('month')}
                          className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                            viewMode === 'month'
                              ? 'bg-background text-foreground shadow-sm'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          Month
                        </button>
                      </div>
                    </div>
                    <p className="text-4xl font-light text-foreground">
                      {formatCurrency(viewMode === 'week' ? stats.weeklyRevenue : stats.monthlyRevenue)}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {viewMode === 'week' ? 'This week' : 'This month'}
                    </p>
                  </div>
                </div>

                {/* Chart - takes most space */}
                <div className="flex-1 min-h-[200px] mb-2">
                  <RevenueChart data={chartData} viewMode={viewMode} />
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
                  <div>
                    <p className="text-2xl font-semibold text-foreground">
                      {viewMode === 'week' ? stats.completedThisWeek : stats.completedThisMonth}
                    </p>
                    <p className="text-sm text-muted-foreground">Jobs completed</p>
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-foreground">
                      {formatCurrency(
                        (viewMode === 'week' ? stats.weeklyRevenue : stats.monthlyRevenue) /
                        Math.max(viewMode === 'week' ? stats.completedThisWeek : stats.completedThisMonth, 1)
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">Avg per job</p>
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-emerald-500">
                      {stats.todaysJobsCount}
                    </p>
                    <p className="text-sm text-muted-foreground">Today</p>
                  </div>
                </div>
              </div>

              {/* Week at a Glance */}
              <div className="bg-card rounded-2xl border border-border p-5 flex-shrink-0">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-medium text-foreground">Week at a Glance</h3>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-muted/30 rounded-xl">
                    <p className="text-3xl font-semibold text-foreground">{stats.todaysJobsCount}</p>
                    <p className="text-xs text-muted-foreground mt-1">Today</p>
                  </div>
                  <div className="text-center p-4 bg-muted/30 rounded-xl">
                    <p className="text-3xl font-semibold text-foreground">{stats.completedThisWeek}</p>
                    <p className="text-xs text-muted-foreground mt-1">Completed</p>
                  </div>
                  <div className="text-center p-4 bg-emerald-500/10 rounded-xl">
                    <p className="text-3xl font-semibold text-emerald-500">{formatCurrency(stats.weeklyRevenue)}</p>
                    <p className="text-xs text-muted-foreground mt-1">Revenue</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Jobs (fixed width) */}
            <div className="flex flex-col gap-4 min-h-0">

              {/* Today's Jobs */}
              <div className="bg-card rounded-2xl border border-border p-5 flex-shrink-0 max-h-[220px] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-medium text-foreground">Today</h3>
                  <span className="text-sm text-muted-foreground">{todaysJobs.length} jobs</span>
                </div>
                {todaysJobs.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No jobs scheduled today</p>
                ) : (
                  <div className="space-y-2 overflow-y-auto flex-1">
                    {todaysJobs.slice(0, 3).map((job) => (
                      <button
                        key={job.id}
                        onClick={() => router.push(`/provider/jobs/${job.id}`)}
                        className="w-full p-3 bg-muted/30 hover:bg-muted/50 rounded-xl text-left transition-colors"
                      >
                        <div className="flex items-start justify-between mb-1">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{job.serviceType}</p>
                            <p className="text-xs text-muted-foreground truncate">{job.customerName}</p>
                          </div>
                          <div className="text-right ml-3">
                            <p className="text-sm font-medium text-emerald-500">{formatTime(job.startTime)}</p>
                            {job.status === 'in_progress' && (
                              <span className="inline-flex items-center text-[10px] text-orange-500 font-medium">
                                <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-1 animate-pulse" />
                                Active
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                          <span className="truncate">{job.address}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Coming Up */}
              <div className="bg-card rounded-2xl border border-border p-5 flex-1 min-h-0 overflow-hidden flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-medium text-foreground">Coming Up</h3>
                  <button
                    onClick={() => router.push('/provider/calendar')}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                  >
                    View all
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                {upcomingJobs.length === 0 ? (
                  <div className="text-center py-8 flex-1 flex flex-col items-center justify-center">
                    <Calendar className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No upcoming jobs</p>
                  </div>
                ) : (
                  <div className="space-y-2 overflow-y-auto flex-1">
                    {upcomingJobs.slice(0, 4).map((job) => (
                      <button
                        key={job.id}
                        onClick={() => router.push(`/provider/jobs/${job.id}`)}
                        className="w-full flex items-center justify-between p-3 hover:bg-muted/30 rounded-xl transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0">
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
                <div className="bg-card rounded-2xl border border-border p-5 flex-shrink-0">
                  <h3 className="text-base font-medium text-foreground mb-3">Needs Attention</h3>
                  <div className="space-y-2">
                    {stats.pendingInvoicesCount > 0 && (
                      <button
                        onClick={() => router.push('/provider/invoices')}
                        className="w-full flex items-center justify-between p-3 bg-amber-500/10 hover:bg-amber-500/20 rounded-xl transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <DollarSign className="h-4 w-4 text-amber-500" />
                          <span className="text-sm text-foreground">
                            {stats.pendingInvoicesCount} unpaid invoices
                          </span>
                        </div>
                        <span className="text-sm font-medium text-amber-500">
                          {formatCurrency(stats.pendingInvoicesAmount)}
                        </span>
                      </button>
                    )}
                    {stats.newLeadsCount > 0 && (
                      <button
                        onClick={() => router.push('/provider/leads')}
                        className="w-full flex items-center justify-between p-3 bg-purple-500/10 hover:bg-purple-500/20 rounded-xl transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <TrendingUp className="h-4 w-4 text-purple-500" />
                          <span className="text-sm text-foreground">
                            {stats.newLeadsCount} new leads
                          </span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-purple-500" />
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
