"use client"

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  isFuture,
  eachDayOfInterval,
} from 'date-fns';
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
  ChevronLeft,
  Briefcase,
  Clock,
  User,
  X,
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
  displayLabel?: string;
}

interface HomeData {
  todaysJobs: TodayJob[];
  upcomingJobs: UpcomingJob[];
  stats: Stats;
  revenueHistory: RevenueDataPoint[];
}

interface DateBreakdownJob {
  id: string;
  serviceType: string;
  address: string;
  startTime: string;
  endTime: string;
  status: string;
  amount: number | null;
  customerName: string;
  customerPhone: string;
  assignedUsers: {
    id: string;
    firstName: string;
    lastName: string;
    profilePhotoUrl: string | null;
  }[];
}

interface DateBreakdown {
  date: string;
  jobs: DateBreakdownJob[];
  summary: {
    totalJobs: number;
    completedJobs: number;
    totalRevenue: number;
  };
}

// Generate test data for a specific date range
// Uses seeded random based on date for consistent values
function generateTestDataForRange(startDate: Date, endDate: Date): RevenueDataPoint[] {
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return days.map(date => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const baseAmount = isWeekend ? 320 : 180;
    // Use date string hash for consistent "random" variation
    const hash = dateStr.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const variation = ((hash % 180) - 60);
    const amount = Math.max(50, baseAmount + variation);

    return {
      date: dateStr,
      amount,
      label: format(date, 'MMM d'),
      day: dayNames[date.getDay()],
    };
  });
}

// Custom tooltip for the chart
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; payload: RevenueDataPoint }>; label?: string }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-card border border-border rounded-lg shadow-lg p-3">
        <p className="text-sm text-muted-foreground">{data.label} {data.day ? `(${data.day})` : ''}</p>
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
  const [currentDate, setCurrentDate] = useState(new Date());

  // Date breakdown state (for graph click interaction)
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dateBreakdown, setDateBreakdown] = useState<DateBreakdown | null>(null);
  const [loadingBreakdown, setLoadingBreakdown] = useState(false);
  const breakdownRef = useRef<HTMLDivElement>(null);

  // Get date range based on view mode
  const dateRange = useMemo(() => {
    if (viewMode === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
      const end = endOfWeek(currentDate, { weekStartsOn: 1 }); // Sunday
      return { start, end };
    } else {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      return { start, end };
    }
  }, [viewMode, currentDate]);

  // Format date label for display
  const dateLabel = useMemo(() => {
    if (viewMode === 'week') {
      return `Week of ${format(dateRange.start, 'MMM d')}-${format(dateRange.end, 'd')}`;
    } else {
      return format(currentDate, 'MMMM yyyy');
    }
  }, [viewMode, dateRange, currentDate]);

  // Navigation handlers
  const canGoNext = useMemo(() => {
    if (viewMode === 'week') {
      const nextWeekStart = startOfWeek(addWeeks(currentDate, 1), { weekStartsOn: 1 });
      return !isFuture(nextWeekStart);
    } else {
      const nextMonthStart = startOfMonth(addMonths(currentDate, 1));
      return !isFuture(nextMonthStart);
    }
  }, [viewMode, currentDate]);

  const handlePrev = () => {
    if (viewMode === 'week') {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(subMonths(currentDate, 1));
    }
  };

  const handleNext = () => {
    if (!canGoNext) return;
    if (viewMode === 'week') {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };

  // Handle graph click to show job breakdown
  const handleGraphClick = useCallback(async (data: RevenueDataPoint) => {
    if (!providerId || !data.date) return;

    // Toggle off if clicking the same date
    if (selectedDate === data.date) {
      setSelectedDate(null);
      setDateBreakdown(null);
      return;
    }

    setSelectedDate(data.date);
    setLoadingBreakdown(true);

    try {
      const res = await fetch(`/api/provider/jobs/by-date?providerId=${providerId}&date=${data.date}`);
      const result = await res.json();

      if (result.success && result.data) {
        setDateBreakdown(result.data);
      } else {
        setDateBreakdown(null);
      }
    } catch (error) {
      console.error('Error fetching date breakdown:', error);
      setDateBreakdown(null);
    } finally {
      setLoadingBreakdown(false);
    }
  }, [providerId, selectedDate]);

  // Close breakdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (breakdownRef.current && !breakdownRef.current.contains(event.target as Node)) {
        setSelectedDate(null);
        setDateBreakdown(null);
      }
    };

    if (selectedDate) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selectedDate]);

  // Close breakdown when changing date range
  useEffect(() => {
    setSelectedDate(null);
    setDateBreakdown(null);
  }, [viewMode, currentDate]);

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
            : generateTestDataForRange(
                startOfMonth(subMonths(new Date(), 1)),
                new Date()
              ),
        });
      } else {
        // Use test data for demonstration
        const testData = generateTestDataForRange(
          startOfMonth(subMonths(new Date(), 1)),
          new Date()
        );
        const weekTotal = testData.slice(-7).reduce((sum, d) => sum + d.amount, 0);
        const monthTotal = testData.slice(-30).reduce((sum, d) => sum + d.amount, 0);

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
      const testData = generateTestDataForRange(
        startOfMonth(subMonths(new Date(), 1)),
        new Date()
      );
      const weekTotal = testData.slice(-7).reduce((sum, d) => sum + d.amount, 0);
      const monthTotal = testData.slice(-30).reduce((sum, d) => sum + d.amount, 0);

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

  // Filter chart data based on selected date range
  const chartData = useMemo(() => {
    // Always generate the full date range for the selected period
    const fullRangeData = generateTestDataForRange(dateRange.start, dateRange.end);

    // If we have real revenue history, merge it in
    if (homeData?.revenueHistory && homeData.revenueHistory.length > 0) {
      const revenueMap = new Map(homeData.revenueHistory.map(d => [d.date, d.amount]));

      // Update generated data with real values where available
      fullRangeData.forEach(d => {
        const realAmount = revenueMap.get(d.date);
        if (realAmount !== undefined) {
          d.amount = realAmount;
        }
      });
    }

    // Add display labels
    if (viewMode === 'week') {
      // Week: Show all 7 days with day abbreviation
      return fullRangeData.map(d => ({
        ...d,
        displayLabel: format(new Date(d.date + 'T12:00:00'), 'EEE'), // Add time to avoid timezone issues
      }));
    } else {
      // Month: Show every 5th day as number
      return fullRangeData.map((d, i) => {
        const dayNum = new Date(d.date + 'T12:00:00').getDate();
        const showLabel = dayNum === 1 || dayNum % 5 === 0 || i === fullRangeData.length - 1;
        return {
          ...d,
          displayLabel: showLabel ? String(dayNum) : '',
        };
      });
    }
  }, [homeData?.revenueHistory, dateRange, viewMode]);

  const totalRevenue = useMemo(() => {
    return chartData.reduce((sum, d) => sum + d.amount, 0);
  }, [chartData]);

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
      {/* Main Container - No scrolling needed */}
      <div className="w-full bg-background">
        <div className="max-w-[1400px] mx-auto px-8 py-6">

          {/* Main Grid: 70% / 28% split using 12-col grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

            {/* LEFT COLUMN - Revenue (8 cols = ~67%) */}
            <div className="lg:col-span-8 space-y-5">

              {/* Revenue Card - Main Focus */}
              <div className="bg-card rounded-2xl border border-border shadow-sm p-6">

                {/* Card Header with Navigation */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <h2 className="text-lg font-semibold text-foreground">Revenue</h2>

                      {/* Toggle Buttons */}
                      <div className="flex bg-muted rounded-lg p-1">
                        <button
                          onClick={() => {
                            setViewMode('week');
                            setCurrentDate(new Date());
                          }}
                          className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                            viewMode === 'week'
                              ? 'bg-background text-foreground shadow-sm'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          Week
                        </button>
                        <button
                          onClick={() => {
                            setViewMode('month');
                            setCurrentDate(new Date());
                          }}
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

                    {/* Big Revenue Number */}
                    <p className="text-4xl font-bold text-foreground">
                      {formatCurrency(totalRevenue)}
                    </p>
                  </div>

                  {/* Date Navigation */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePrev}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-muted/50 border border-border hover:bg-muted transition-colors"
                      aria-label="Previous period"
                    >
                      <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                    </button>

                    <span className="text-sm text-muted-foreground min-w-[140px] text-center">
                      {dateLabel}
                    </span>

                    <button
                      onClick={handleNext}
                      disabled={!canGoNext}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg border border-border transition-colors ${
                        canGoNext
                          ? 'bg-muted/50 hover:bg-muted'
                          : 'opacity-30 cursor-not-allowed'
                      }`}
                      aria-label="Next period"
                    >
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </button>

                    {/* Trend Indicator */}
                    <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ml-2 ${
                      weekChange >= 0
                        ? 'bg-emerald-500/10 text-emerald-600'
                        : 'bg-red-500/10 text-red-600'
                    }`}>
                      {weekChange >= 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {weekChange >= 0 ? '+' : ''}{weekChange}%
                    </div>
                  </div>
                </div>

                {/* Chart Container - Reduced to 320px */}
                <div className="h-[320px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={chartData}
                      margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
                      onClick={(data) => {
                        const payload = (data as { activePayload?: Array<{ payload: RevenueDataPoint }> })?.activePayload?.[0]?.payload;
                        if (payload) {
                          handleGraphClick(payload);
                        }
                      }}
                      style={{ cursor: 'pointer' }}
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
                        strokeOpacity={0.06}
                        vertical={false}
                      />
                      <XAxis
                        dataKey="displayLabel"
                        stroke="currentColor"
                        strokeOpacity={0.5}
                        tick={{ fill: 'currentColor', opacity: 0.6, fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                      />
                      <YAxis
                        domain={[0, 'auto']}
                        stroke="currentColor"
                        strokeOpacity={0.5}
                        tick={{ fill: 'currentColor', opacity: 0.6, fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `$${value}`}
                        width={55}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="amount"
                        stroke="#1A5F4F"
                        strokeWidth={2.5}
                        fill="url(#colorRevenue)"
                        dot={false}
                        activeDot={{
                          r: 6,
                          fill: '#1A5F4F',
                          strokeWidth: 2,
                          stroke: '#fff',
                          cursor: 'pointer',
                        }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Date Breakdown Dropdown */}
                {selectedDate && (
                  <div
                    ref={breakdownRef}
                    className="mt-4 bg-muted/30 rounded-xl border border-border overflow-hidden"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/50">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-foreground">
                          {format(new Date(selectedDate + 'T12:00:00'), 'EEEE, MMMM d, yyyy')}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedDate(null);
                          setDateBreakdown(null);
                        }}
                        className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-muted transition-colors"
                      >
                        <X className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      {loadingBreakdown ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-pulse text-muted-foreground">Loading jobs...</div>
                        </div>
                      ) : dateBreakdown?.jobs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                          <Briefcase className="h-8 w-8 mb-2 opacity-50" />
                          <p className="text-sm">No jobs scheduled for this day</p>
                        </div>
                      ) : (
                        <>
                          {/* Summary */}
                          {dateBreakdown && (
                            <div className="grid grid-cols-3 gap-4 mb-4">
                              <div className="text-center p-3 bg-background rounded-lg">
                                <p className="text-lg font-bold text-foreground">{dateBreakdown.summary.totalJobs}</p>
                                <p className="text-xs text-muted-foreground">Total Jobs</p>
                              </div>
                              <div className="text-center p-3 bg-background rounded-lg">
                                <p className="text-lg font-bold text-emerald-600">{dateBreakdown.summary.completedJobs}</p>
                                <p className="text-xs text-muted-foreground">Completed</p>
                              </div>
                              <div className="text-center p-3 bg-background rounded-lg">
                                <p className="text-lg font-bold text-foreground">{formatCurrency(dateBreakdown.summary.totalRevenue)}</p>
                                <p className="text-xs text-muted-foreground">Revenue</p>
                              </div>
                            </div>
                          )}

                          {/* Job Cards */}
                          <div className="space-y-2 max-h-[300px] overflow-y-auto">
                            {dateBreakdown?.jobs.map((job) => (
                              <button
                                key={job.id}
                                onClick={() => router.push(`/provider/jobs/${job.id}`)}
                                className="w-full p-4 bg-background hover:bg-muted/40 rounded-xl text-left transition-colors border border-border/50"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <p className="font-medium text-foreground truncate">{job.serviceType}</p>
                                      <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${
                                        job.status === 'completed'
                                          ? 'bg-emerald-500/10 text-emerald-600'
                                          : job.status === 'in_progress'
                                          ? 'bg-orange-500/10 text-orange-600'
                                          : job.status === 'cancelled'
                                          ? 'bg-red-500/10 text-red-600'
                                          : 'bg-blue-500/10 text-blue-600'
                                      }`}>
                                        {job.status.replace('_', ' ')}
                                      </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground truncate">{job.customerName}</p>
                                    {job.address && (
                                      <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
                                        <MapPin className="h-3 w-3 flex-shrink-0" />
                                        <span className="truncate">{job.address}</span>
                                      </div>
                                    )}
                                    <div className="flex items-center gap-3 mt-2">
                                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <Clock className="h-3 w-3" />
                                        <span>{format(new Date(job.startTime), 'h:mm a')} - {format(new Date(job.endTime), 'h:mm a')}</span>
                                      </div>
                                      {job.assignedUsers.length > 0 && (
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                          <User className="h-3 w-3" />
                                          <span>{job.assignedUsers.map(u => `${u.firstName} ${u.lastName.charAt(0)}.`).join(', ')}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-right flex-shrink-0">
                                    {job.amount !== null && (
                                      <p className="text-sm font-semibold text-emerald-600">{formatCurrency(job.amount)}</p>
                                    )}
                                    <ChevronRight className="h-4 w-4 text-muted-foreground mt-1 ml-auto" />
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-4 pt-4 mt-2 border-t border-border">
                  <div>
                    <p className="text-2xl font-bold text-foreground">{jobsCompleted}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Jobs completed</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{formatCurrency(avgPerJob)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Avg per job</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-emerald-600">{stats.todaysJobsCount}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Today&apos;s jobs</p>
                  </div>
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN - Jobs & Actions (4 cols = ~33%) */}
            <div className="lg:col-span-4 space-y-5">

              {/* Today's Jobs - Reduced height */}
              <div className="bg-card rounded-2xl border border-border shadow-sm p-5 max-h-[200px] flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold text-foreground">Today</h3>
                  <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                    {todaysJobs.length} jobs
                  </span>
                </div>

                {todaysJobs.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-muted-foreground">
                    <p className="text-sm">No jobs scheduled today</p>
                  </div>
                ) : (
                  <div className={`space-y-2 flex-1 ${todaysJobs.length > 3 ? 'overflow-y-auto pr-1' : ''}`}>
                    {todaysJobs.slice(0, 3).map((job) => (
                      <button
                        key={job.id}
                        onClick={() => router.push(`/provider/jobs/${job.id}`)}
                        className="w-full p-3 bg-muted/40 hover:bg-muted/60 rounded-xl text-left transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{job.serviceType}</p>
                            <p className="text-xs text-muted-foreground truncate">{job.customerName}</p>
                          </div>
                          <div className="text-right ml-2">
                            <p className="text-sm font-semibold text-emerald-600">{formatTime(job.startTime)}</p>
                            {job.status === 'in_progress' && (
                              <span className="inline-flex items-center text-[10px] text-orange-500 font-medium">
                                <span className="w-1 h-1 bg-orange-500 rounded-full mr-1 animate-pulse" />
                                Active
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Coming Up - Reduced height */}
              <div className="bg-card rounded-2xl border border-border shadow-sm p-5 max-h-[220px] flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold text-foreground">Coming Up</h3>
                  <button
                    onClick={() => router.push('/provider/calendar')}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-0.5"
                  >
                    View all
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                {upcomingJobs.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground py-4">
                    <Calendar className="h-8 w-8 mb-2 opacity-50" />
                    <p className="text-sm">No upcoming jobs</p>
                  </div>
                ) : (
                  <div className="space-y-1.5 overflow-y-auto flex-1 pr-1">
                    {upcomingJobs.slice(0, 4).map((job) => (
                      <button
                        key={job.id}
                        onClick={() => router.push(`/provider/jobs/${job.id}`)}
                        className="w-full flex items-center justify-between p-2.5 hover:bg-muted/40 rounded-xl transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-muted/60 flex items-center justify-center flex-shrink-0">
                            <Briefcase className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{job.serviceType}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {job.customerName && <span>{job.customerName} · </span>}
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

            </div>

            {/* FULL WIDTH ROW - Week at a Glance */}
            <div className="lg:col-span-12">
              <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold text-foreground">Week at a Glance</h3>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-muted/40 rounded-xl">
                    <p className="text-2xl font-bold text-foreground">{stats.todaysJobsCount}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Today</p>
                  </div>
                  <div className="text-center p-4 bg-muted/40 rounded-xl">
                    <p className="text-2xl font-bold text-foreground">{stats.completedThisWeek}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Completed</p>
                  </div>
                  <div className="text-center p-4 bg-emerald-500/10 rounded-xl">
                    <p className="text-2xl font-bold text-emerald-600">{formatCurrency(stats.weeklyRevenue)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Weekly Revenue</p>
                  </div>
                  <div className="text-center p-4 bg-emerald-500/10 rounded-xl">
                    <p className="text-2xl font-bold text-emerald-600">{formatCurrency(stats.monthlyRevenue)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Monthly Revenue</p>
                  </div>
                </div>
              </div>
            </div>

            {/* FULL WIDTH ROW - Needs Attention */}
            {(stats.pendingInvoicesCount > 0 || stats.newLeadsCount > 0) && (
              <div className="lg:col-span-12">
                <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
                  <h3 className="text-base font-semibold text-foreground mb-3">Needs Attention</h3>
                  <div className="flex flex-wrap gap-3">
                    {stats.pendingInvoicesCount > 0 && (
                      <button
                        onClick={() => router.push('/provider/invoices')}
                        className="flex items-center gap-3 px-4 py-3 bg-amber-500/10 hover:bg-amber-500/15 rounded-xl transition-colors"
                      >
                        <DollarSign className="h-5 w-5 text-amber-600" />
                        <div className="text-left">
                          <p className="text-sm font-medium text-foreground">
                            {stats.pendingInvoicesCount} unpaid invoices
                          </p>
                          <p className="text-xs text-amber-600 font-semibold">
                            {formatCurrency(stats.pendingInvoicesAmount)}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-amber-600 ml-2" />
                      </button>
                    )}
                    {stats.newLeadsCount > 0 && (
                      <button
                        onClick={() => router.push('/provider/leads')}
                        className="flex items-center gap-3 px-4 py-3 bg-purple-500/10 hover:bg-purple-500/15 rounded-xl transition-colors"
                      >
                        <TrendingUp className="h-5 w-5 text-purple-600" />
                        <div className="text-left">
                          <p className="text-sm font-medium text-foreground">
                            {stats.newLeadsCount} new leads
                          </p>
                          <p className="text-xs text-purple-600 font-semibold">
                            Review matches
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-purple-600 ml-2" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProviderLayout>
  );
}
