"use client"

import { useEffect, useState, useMemo } from 'react';
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
  label: string;
}

interface HomeData {
  todaysJobs: TodayJob[];
  upcomingJobs: UpcomingJob[];
  stats: Stats;
  revenueHistory?: RevenueDataPoint[];
}

// Simple line chart component
function RevenueChart({ data, height = 200 }: { data: RevenueDataPoint[]; height?: number }) {
  const maxValue = Math.max(...data.map(d => d.amount), 1);
  const minValue = Math.min(...data.map(d => d.amount));
  const range = maxValue - minValue || 1;

  // Create SVG path for smooth curve
  const points = data.map((d, i) => ({
    x: (i / (data.length - 1)) * 100,
    y: 100 - ((d.amount - minValue) / range) * 80 - 10,
  }));

  // Create smooth curve path
  const pathData = points.reduce((acc, point, i) => {
    if (i === 0) return `M ${point.x} ${point.y}`;

    const prev = points[i - 1];
    const cpx1 = prev.x + (point.x - prev.x) / 3;
    const cpx2 = prev.x + (point.x - prev.x) * 2 / 3;

    return `${acc} C ${cpx1} ${prev.y}, ${cpx2} ${point.y}, ${point.x} ${point.y}`;
  }, '');

  // Create gradient fill path
  const fillPath = `${pathData} L 100 100 L 0 100 Z`;

  return (
    <div className="relative w-full" style={{ height }}>
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="w-full h-full"
      >
        <defs>
          <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgb(16, 185, 129)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="rgb(16, 185, 129)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((y) => (
          <line
            key={y}
            x1="0"
            y1={y}
            x2="100"
            y2={y}
            stroke="currentColor"
            strokeOpacity="0.1"
            strokeWidth="0.5"
          />
        ))}

        {/* Gradient fill */}
        <path
          d={fillPath}
          fill="url(#chartGradient)"
        />

        {/* Line */}
        <path
          d={pathData}
          fill="none"
          stroke="rgb(16, 185, 129)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />

        {/* Data points */}
        {points.map((point, i) => (
          <circle
            key={i}
            cx={point.x}
            cy={point.y}
            r="1.5"
            fill="rgb(16, 185, 129)"
            className="transition-all hover:r-3"
          />
        ))}
      </svg>

      {/* X-axis labels */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[10px] text-muted-foreground px-1 -mb-5">
        {data.filter((_, i) => i % Math.ceil(data.length / 7) === 0 || i === data.length - 1).map((d, i) => (
          <span key={i}>{d.label}</span>
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
  const [viewMode, setViewMode] = useState<'week' | 'month'>('month');

  useEffect(() => {
    const id = localStorage.getItem('providerId');
    const name = localStorage.getItem('providerName');

    if (!id || !name) {
      router.push('/provider/login');
      return;
    }

    setProviderId(id);
    setProviderName(name);
    loadMockData();
  }, [router]);

  const loadMockData = () => {
    setLoading(true);
    setTimeout(() => {
      const today = new Date();

      // Generate revenue history for the past 30 days
      const revenueHistory: RevenueDataPoint[] = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const baseAmount = 400 + Math.random() * 300;
        const weekendMultiplier = date.getDay() === 0 || date.getDay() === 6 ? 0.6 : 1;
        revenueHistory.push({
          date: date.toISOString(),
          amount: Math.round(baseAmount * weekendMultiplier),
          label: format(date, 'MMM d'),
        });
      }

      const mockData: HomeData = {
        todaysJobs: [
          {
            id: '1',
            customerName: 'John Smith',
            customerPhone: '(555) 123-4567',
            serviceType: 'Lawn Mowing',
            address: '123 Oak Street, Springfield',
            startTime: new Date(today.setHours(9, 0, 0, 0)).toISOString(),
            endTime: new Date(today.setHours(10, 30, 0, 0)).toISOString(),
            status: 'scheduled',
            totalAmount: 85,
            workers: [{ id: 'w1', firstName: 'Mike', lastName: 'Johnson' }],
          },
          {
            id: '2',
            customerName: 'Sarah Williams',
            customerPhone: '(555) 234-5678',
            serviceType: 'Hedge Trimming',
            address: '456 Maple Ave, Springfield',
            startTime: new Date(today.setHours(11, 0, 0, 0)).toISOString(),
            endTime: new Date(today.setHours(12, 30, 0, 0)).toISOString(),
            status: 'in_progress',
            totalAmount: 120,
            workers: [
              { id: 'w1', firstName: 'Mike', lastName: 'Johnson' },
              { id: 'w2', firstName: 'Carlos', lastName: 'Rodriguez' },
            ],
          },
        ],
        upcomingJobs: [
          {
            id: '4',
            serviceType: 'Spring Cleanup',
            customerName: 'Emily Davis',
            address: '789 Pine Road',
            startTime: new Date(today.getTime() + 86400000).toISOString(),
          },
          {
            id: '5',
            serviceType: 'Lawn Mowing',
            customerName: 'Robert Chen',
            address: '321 Elm Street',
            startTime: new Date(today.getTime() + 172800000).toISOString(),
          },
          {
            id: '6',
            serviceType: 'Fertilization',
            customerName: 'Amanda Foster',
            address: '654 Cedar Lane',
            startTime: new Date(today.getTime() + 259200000).toISOString(),
          },
          {
            id: '7',
            serviceType: 'Tree Trimming',
            customerName: 'David Park',
            address: '987 Birch Ave',
            startTime: new Date(today.getTime() + 345600000).toISOString(),
          },
        ],
        stats: {
          todaysJobsCount: 3,
          weeklyRevenue: 3250,
          monthlyRevenue: 12480,
          pendingInvoicesCount: 5,
          pendingInvoicesAmount: 1850,
          newLeadsCount: 4,
          completedThisWeek: 12,
          completedThisMonth: 48,
        },
        revenueHistory,
      };
      setHomeData(mockData);
      setLoading(false);
    }, 300);
  };

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
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </ProviderLayout>
    );
  }

  if (!homeData) {
    return (
      <ProviderLayout providerName={providerName}>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-muted-foreground">Failed to load data</div>
        </div>
      </ProviderLayout>
    );
  }

  const { todaysJobs, upcomingJobs, stats } = homeData;

  return (
    <ProviderLayout providerName={providerName}>
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-12">

          {/* Header */}
          <div className="mb-10">
            <h1 className="text-3xl md:text-4xl font-light text-foreground mb-1">
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}
            </h1>
            <p className="text-muted-foreground">
              {format(new Date(), 'EEEE, MMMM d')}
            </p>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">

            {/* Left Column - Revenue & Stats */}
            <div className="lg:col-span-2 space-y-6">

              {/* Revenue Card */}
              <div className="bg-card rounded-2xl border border-border p-6 md:p-8">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Revenue</p>
                    <p className="text-4xl md:text-5xl font-light text-foreground">
                      {formatCurrency(viewMode === 'week' ? stats.weeklyRevenue : stats.monthlyRevenue)}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {viewMode === 'week' ? 'This week' : 'This month'}
                    </p>
                  </div>

                  {/* View Toggle */}
                  <div className="flex bg-muted rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('week')}
                      className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                        viewMode === 'week'
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Week
                    </button>
                    <button
                      onClick={() => setViewMode('month')}
                      className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                        viewMode === 'month'
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Month
                    </button>
                  </div>
                </div>

                {/* Chart */}
                <div className="mt-4 pb-6">
                  <RevenueChart data={chartData} height={180} />
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-4 pt-6 border-t border-border">
                  <div>
                    <p className="text-2xl font-semibold text-foreground">
                      {viewMode === 'week' ? stats.completedThisWeek : stats.completedThisMonth}
                    </p>
                    <p className="text-sm text-muted-foreground">Jobs completed</p>
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-foreground">
                      {formatCurrency((viewMode === 'week' ? stats.weeklyRevenue : stats.monthlyRevenue) /
                        (viewMode === 'week' ? stats.completedThisWeek : stats.completedThisMonth) || 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">Avg per job</p>
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-emerald-500">
                      +{Math.round(((stats.weeklyRevenue / (stats.monthlyRevenue / 4)) - 1) * 100)}%
                    </p>
                    <p className="text-sm text-muted-foreground">vs last week</p>
                  </div>
                </div>
              </div>

              {/* Week at a Glance - Compact */}
              <div className="bg-card rounded-2xl border border-border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-foreground">Week at a Glance</h3>
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

            {/* Right Column - Jobs */}
            <div className="space-y-6">

              {/* Today's Jobs */}
              {todaysJobs.length > 0 && (
                <div className="bg-card rounded-2xl border border-border p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-foreground">Today</h3>
                    <span className="text-sm text-muted-foreground">{todaysJobs.length} jobs</span>
                  </div>
                  <div className="space-y-3">
                    {todaysJobs.map((job) => (
                      <button
                        key={job.id}
                        onClick={() => router.push(`/provider/jobs/${job.id}`)}
                        className="w-full p-4 bg-muted/30 hover:bg-muted/50 rounded-xl text-left transition-colors group"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate">{job.serviceType}</p>
                            <p className="text-sm text-muted-foreground truncate">{job.customerName}</p>
                          </div>
                          <div className="text-right ml-3">
                            <p className="text-sm font-medium text-emerald-500">{formatTime(job.startTime)}</p>
                            {job.status === 'in_progress' && (
                              <span className="inline-flex items-center text-[10px] text-orange-500 font-medium">
                                <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-1 animate-pulse" />
                                In progress
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
                </div>
              )}

              {/* Coming Up */}
              <div className="bg-card rounded-2xl border border-border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-foreground">Coming Up</h3>
                  <button
                    onClick={() => router.push('/provider/calendar')}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                  >
                    View all
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                {upcomingJobs.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No upcoming jobs</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {upcomingJobs.map((job) => (
                      <button
                        key={job.id}
                        onClick={() => router.push(`/provider/jobs/${job.id}`)}
                        className="w-full flex items-center justify-between p-3 hover:bg-muted/30 rounded-lg transition-colors group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0">
                            <Briefcase className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-foreground text-sm truncate">{job.serviceType}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(job.startTime), 'EEE, MMM d')} · {formatTime(job.startTime)}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Actions - Minimal */}
              {(stats.pendingInvoicesCount > 0 || stats.newLeadsCount > 0) && (
                <div className="bg-card rounded-2xl border border-border p-6">
                  <h3 className="font-medium text-foreground mb-4">Needs Attention</h3>
                  <div className="space-y-2">
                    {stats.pendingInvoicesCount > 0 && (
                      <button
                        onClick={() => router.push('/provider/invoices')}
                        className="w-full flex items-center justify-between p-3 bg-amber-500/10 hover:bg-amber-500/20 rounded-lg transition-colors"
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
                        onClick={() => router.push('/provider/dashboard')}
                        className="w-full flex items-center justify-between p-3 bg-purple-500/10 hover:bg-purple-500/20 rounded-lg transition-colors"
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
