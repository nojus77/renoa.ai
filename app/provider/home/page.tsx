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
}

interface HomeData {
  todaysJobs: TodayJob[];
  upcomingJobs: UpcomingJob[];
  stats: Stats;
  revenueHistory: RevenueDataPoint[];
}

// Clean line chart - no dots, straight lines
function RevenueChart({ data }: { data: RevenueDataPoint[] }) {
  if (data.length === 0) return null;

  const maxValue = Math.max(...data.map(d => d.amount), 1);
  const minValue = Math.min(...data.map(d => d.amount));
  const range = maxValue - minValue || 1;

  // Create points with straight lines (no bezier curves)
  const points = data.map((d, i) => ({
    x: (i / Math.max(data.length - 1, 1)) * 100,
    y: 100 - ((d.amount - minValue) / range) * 85 - 7.5,
  }));

  // Create straight line path (L = line to, not bezier curves)
  const pathData = points.reduce((acc, point, i) => {
    if (i === 0) return `M ${point.x} ${point.y}`;
    return `${acc} L ${point.x} ${point.y}`;
  }, '');

  // Create gradient fill path
  const fillPath = `${pathData} L 100 100 L 0 100 Z`;

  // Show fewer labels based on data length
  const labelInterval = data.length <= 7 ? 1 : Math.ceil(data.length / 6);
  const labelsToShow = data.filter((_, i) => i % labelInterval === 0 || i === data.length - 1);

  return (
    <div className="relative w-full h-full">
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="w-full h-full"
      >
        <defs>
          <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgb(16, 185, 129)" stopOpacity="0.2" />
            <stop offset="100%" stopColor="rgb(16, 185, 129)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Subtle grid lines */}
        {[25, 50, 75].map((y) => (
          <line
            key={y}
            x1="0"
            y1={y}
            x2="100"
            y2={y}
            stroke="currentColor"
            strokeOpacity="0.05"
            strokeWidth="0.3"
          />
        ))}

        {/* Gradient fill */}
        <path
          d={fillPath}
          fill="url(#chartGradient)"
        />

        {/* Line - no dots */}
        <path
          d={pathData}
          fill="none"
          stroke="rgb(16, 185, 129)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {/* X-axis labels */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[9px] text-muted-foreground px-0.5 translate-y-4">
        {labelsToShow.map((d, i) => (
          <span key={i}>{format(new Date(d.date), 'M/d')}</span>
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
          revenueHistory: result.data.revenueHistory || [],
        });
      }
    } catch (error) {
      console.error('Error loading home data:', error);
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
      return homeData.revenueHistory.slice(-7);
    }
    return homeData.revenueHistory;
  }, [homeData?.revenueHistory, viewMode]);

  if (loading) {
    return (
      <ProviderLayout providerName={providerName}>
        <div className="h-[calc(100vh-120px)] flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </ProviderLayout>
    );
  }

  if (!homeData) {
    return (
      <ProviderLayout providerName={providerName}>
        <div className="h-[calc(100vh-120px)] flex items-center justify-center">
          <div className="text-muted-foreground">Failed to load data</div>
        </div>
      </ProviderLayout>
    );
  }

  const { todaysJobs, upcomingJobs, stats } = homeData;

  return (
    <ProviderLayout providerName={providerName}>
      <div className="h-[calc(100vh-120px)] overflow-hidden">
        <div className="h-full max-w-7xl mx-auto px-4 py-4">
          {/* Header - Compact */}
          <div className="mb-4">
            <h1 className="text-2xl font-light text-foreground">
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {format(new Date(), 'EEEE, MMMM d')}
            </p>
          </div>

          {/* Main Grid - 60/40 split */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 h-[calc(100%-80px)]">

            {/* Left Column - Revenue (60%) */}
            <div className="lg:col-span-3 flex flex-col gap-4">

              {/* Revenue Card */}
              <div className="bg-card rounded-xl border border-border p-5 flex-1 flex flex-col min-h-0">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Revenue</p>
                    <p className="text-3xl font-light text-foreground">
                      {formatCurrency(viewMode === 'week' ? stats.weeklyRevenue : stats.monthlyRevenue)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {viewMode === 'week' ? 'This week' : 'This month'}
                    </p>
                  </div>

                  {/* View Toggle */}
                  <div className="flex bg-muted rounded-md p-0.5">
                    <button
                      onClick={() => setViewMode('week')}
                      className={`px-2.5 py-1 text-xs rounded transition-colors ${
                        viewMode === 'week'
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Week
                    </button>
                    <button
                      onClick={() => setViewMode('month')}
                      className={`px-2.5 py-1 text-xs rounded transition-colors ${
                        viewMode === 'month'
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Month
                    </button>
                  </div>
                </div>

                {/* Chart - fills remaining space */}
                <div className="flex-1 min-h-0 pb-5">
                  <RevenueChart data={chartData} />
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border">
                  <div>
                    <p className="text-xl font-semibold text-foreground">
                      {viewMode === 'week' ? stats.completedThisWeek : stats.completedThisMonth}
                    </p>
                    <p className="text-xs text-muted-foreground">Jobs done</p>
                  </div>
                  <div>
                    <p className="text-xl font-semibold text-foreground">
                      {formatCurrency(
                        (viewMode === 'week' ? stats.weeklyRevenue : stats.monthlyRevenue) /
                        Math.max(viewMode === 'week' ? stats.completedThisWeek : stats.completedThisMonth, 1)
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">Avg/job</p>
                  </div>
                  <div>
                    <p className="text-xl font-semibold text-emerald-500">
                      {stats.todaysJobsCount}
                    </p>
                    <p className="text-xs text-muted-foreground">Today</p>
                  </div>
                </div>
              </div>

              {/* Week at a Glance - Compact */}
              <div className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-foreground">Week at a Glance</h3>
                  <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 bg-muted/30 rounded-lg">
                    <p className="text-2xl font-semibold text-foreground">{stats.todaysJobsCount}</p>
                    <p className="text-[10px] text-muted-foreground">Today</p>
                  </div>
                  <div className="text-center p-3 bg-muted/30 rounded-lg">
                    <p className="text-2xl font-semibold text-foreground">{stats.completedThisWeek}</p>
                    <p className="text-[10px] text-muted-foreground">Completed</p>
                  </div>
                  <div className="text-center p-3 bg-emerald-500/10 rounded-lg">
                    <p className="text-2xl font-semibold text-emerald-500">{formatCurrency(stats.weeklyRevenue)}</p>
                    <p className="text-[10px] text-muted-foreground">Revenue</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Jobs (40%) */}
            <div className="lg:col-span-2 flex flex-col gap-4 min-h-0">

              {/* Today's Jobs */}
              <div className="bg-card rounded-xl border border-border p-4 flex-shrink-0 max-h-[40%] overflow-auto">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-foreground">Today</h3>
                  <span className="text-xs text-muted-foreground">{todaysJobs.length} jobs</span>
                </div>
                {todaysJobs.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No jobs today</p>
                ) : (
                  <div className="space-y-2">
                    {todaysJobs.slice(0, 3).map((job) => (
                      <button
                        key={job.id}
                        onClick={() => router.push(`/provider/jobs/${job.id}`)}
                        className="w-full p-3 bg-muted/30 hover:bg-muted/50 rounded-lg text-left transition-colors"
                      >
                        <div className="flex items-start justify-between mb-1">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{job.serviceType}</p>
                            <p className="text-xs text-muted-foreground truncate">{job.customerName}</p>
                          </div>
                          <div className="text-right ml-2">
                            <p className="text-xs font-medium text-emerald-500">{formatTime(job.startTime)}</p>
                            {job.status === 'in_progress' && (
                              <span className="inline-flex items-center text-[9px] text-orange-500 font-medium">
                                <span className="w-1 h-1 bg-orange-500 rounded-full mr-1 animate-pulse" />
                                Active
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center text-[10px] text-muted-foreground">
                          <MapPin className="h-2.5 w-2.5 mr-1 flex-shrink-0" />
                          <span className="truncate">{job.address}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Coming Up */}
              <div className="bg-card rounded-xl border border-border p-4 flex-1 min-h-0 overflow-auto">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-foreground">Coming Up</h3>
                  <button
                    onClick={() => router.push('/provider/calendar')}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-0.5"
                  >
                    View all
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </div>

                {upcomingJobs.length === 0 ? (
                  <div className="text-center py-6">
                    <Calendar className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">No upcoming jobs</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {upcomingJobs.slice(0, 4).map((job) => (
                      <button
                        key={job.id}
                        onClick={() => router.push(`/provider/jobs/${job.id}`)}
                        className="w-full flex items-center justify-between p-2 hover:bg-muted/30 rounded-lg transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-8 h-8 rounded-md bg-muted/50 flex items-center justify-center flex-shrink-0">
                            <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-foreground truncate">{job.serviceType}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {format(new Date(job.startTime), 'EEE, MMM d')} · {formatTime(job.startTime)}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Needs Attention - Compact */}
              {(stats.pendingInvoicesCount > 0 || stats.newLeadsCount > 0) && (
                <div className="bg-card rounded-xl border border-border p-4 flex-shrink-0">
                  <h3 className="text-sm font-medium text-foreground mb-2">Attention</h3>
                  <div className="space-y-1.5">
                    {stats.pendingInvoicesCount > 0 && (
                      <button
                        onClick={() => router.push('/provider/invoices')}
                        className="w-full flex items-center justify-between p-2 bg-amber-500/10 hover:bg-amber-500/20 rounded-lg transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-3.5 w-3.5 text-amber-500" />
                          <span className="text-xs text-foreground">
                            {stats.pendingInvoicesCount} unpaid
                          </span>
                        </div>
                        <span className="text-xs font-medium text-amber-500">
                          {formatCurrency(stats.pendingInvoicesAmount)}
                        </span>
                      </button>
                    )}
                    {stats.newLeadsCount > 0 && (
                      <button
                        onClick={() => router.push('/provider/leads')}
                        className="w-full flex items-center justify-between p-2 bg-purple-500/10 hover:bg-purple-500/20 rounded-lg transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-3.5 w-3.5 text-purple-500" />
                          <span className="text-xs text-foreground">
                            {stats.newLeadsCount} new leads
                          </span>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-purple-500" />
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
