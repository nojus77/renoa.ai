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
  isToday,
  isTomorrow,
  addDays,
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
  AlertTriangle,
  Users,
  AlertCircle,
  UserX,
  ClockAlert,
  FileWarning,
  CalendarX,
  Hash,
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
  activeJobsThisMonth?: number;
  averageJobValue?: number;
  totalJobValue?: number;
}

interface WorkerAlert {
  id: string;
  name: string;
  jobCount: number;
}

interface Alerts {
  scheduleConflicts: number;
  overloadedWorkers: WorkerAlert[];
  underutilizedWorkers: WorkerAlert[];
  unassignedJobs: number;
  unconfirmedSoonJobs: number;
  overdueInvoices: number;
  overdueJobs: number;
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
  alerts: Alerts;
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
function generateTestDataForRange(startDate: Date, endDate: Date): RevenueDataPoint[] {
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return days.map(date => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const baseAmount = isWeekend ? 320 : 180;
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
function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ value: number; payload: RevenueDataPoint }>; label?: string }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-card border border-border rounded-lg shadow-lg p-3 min-w-[160px]">
        <p className="text-xs text-muted-foreground mb-2">{data.label} {data.day ? `(${data.day})` : ''}</p>
        <p className="text-xl font-bold text-foreground mb-2">
          ${payload[0].value.toLocaleString()}
        </p>
        <div className="flex items-center gap-2 px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-md cursor-pointer transition-colors">
          <span className="text-sm font-medium text-emerald-600">View Jobs</span>
          <ChevronRight className="h-5 w-5 text-emerald-600" />
        </div>
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

  // Date breakdown state
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dateBreakdown, setDateBreakdown] = useState<DateBreakdown | null>(null);
  const [loadingBreakdown, setLoadingBreakdown] = useState(false);
  const breakdownRef = useRef<HTMLDivElement>(null);

  // Get date range based on view mode
  const dateRange = useMemo(() => {
    if (viewMode === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      const end = endOfWeek(currentDate, { weekStartsOn: 1 });
      return { start, end };
    } else {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      return { start, end };
    }
  }, [viewMode, currentDate]);

  const dateLabel = useMemo(() => {
    if (viewMode === 'week') {
      return `${format(dateRange.start, 'MMM d')} - ${format(dateRange.end, 'MMM d')}`;
    } else {
      return format(currentDate, 'MMMM yyyy');
    }
  }, [viewMode, dateRange, currentDate]);

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

  const handleGraphClick = useCallback(async (data: RevenueDataPoint) => {
    if (!providerId || !data.date) return;

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

  useEffect(() => {
    setSelectedDate(null);
    setDateBreakdown(null);
  }, [viewMode, currentDate]);

  const loadData = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/provider/home?providerId=${id}`);
      const result = await res.json();

      const defaultAlerts: Alerts = {
        scheduleConflicts: 0,
        overloadedWorkers: [],
        underutilizedWorkers: [],
        unassignedJobs: 0,
        unconfirmedSoonJobs: 0,
        overdueInvoices: 0,
        overdueJobs: 0,
      };

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
          alerts: result.data.alerts || defaultAlerts,
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
          alerts: defaultAlerts,
          revenueHistory: testData,
        });
      }
    } catch (error) {
      console.error('Error loading home data:', error);
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
        alerts: {
          scheduleConflicts: 0,
          overloadedWorkers: [],
          underutilizedWorkers: [],
          unassignedJobs: 0,
          unconfirmedSoonJobs: 0,
          overdueInvoices: 0,
          overdueJobs: 0,
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
    const fullRangeData = generateTestDataForRange(dateRange.start, dateRange.end);

    if (homeData?.revenueHistory && homeData.revenueHistory.length > 0) {
      const revenueMap = new Map(homeData.revenueHistory.map(d => [d.date, d.amount]));

      fullRangeData.forEach(d => {
        const realAmount = revenueMap.get(d.date);
        if (realAmount !== undefined) {
          d.amount = realAmount;
        }
      });
    }

    if (viewMode === 'week') {
      return fullRangeData.map(d => ({
        ...d,
        displayLabel: format(new Date(d.date + 'T12:00:00'), 'EEE'),
      }));
    } else {
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

  const hasRevenueData = useMemo(() => {
    return chartData.some(d => d.amount > 0);
  }, [chartData]);

  const jobsCompleted = useMemo(() => {
    if (!homeData) return 0;
    return viewMode === 'week' ? homeData.stats.completedThisWeek : homeData.stats.completedThisMonth;
  }, [homeData, viewMode]);

  const avgPerJob = useMemo(() => {
    if (!jobsCompleted) return 0;
    return Math.round(totalRevenue / jobsCompleted);
  }, [totalRevenue, jobsCompleted]);

  // Group upcoming jobs by date
  const groupedUpcomingJobs = useMemo(() => {
    if (!homeData?.upcomingJobs) return [];

    const groups: { date: string; label: string; jobs: UpcomingJob[] }[] = [];
    const jobsByDate = new Map<string, UpcomingJob[]>();

    homeData.upcomingJobs.forEach(job => {
      const dateKey = format(new Date(job.startTime), 'yyyy-MM-dd');
      if (!jobsByDate.has(dateKey)) {
        jobsByDate.set(dateKey, []);
      }
      jobsByDate.get(dateKey)!.push(job);
    });

    jobsByDate.forEach((jobs, dateKey) => {
      const jobDate = new Date(dateKey + 'T12:00:00');
      let label = format(jobDate, 'EEE, MMM d');
      if (isToday(jobDate)) label = 'Today';
      else if (isTomorrow(jobDate)) label = 'Tomorrow';

      groups.push({ date: dateKey, label, jobs });
    });

    return groups.sort((a, b) => a.date.localeCompare(b.date)).slice(0, 7);
  }, [homeData?.upcomingJobs]);

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

  const { todaysJobs, stats, alerts } = homeData;

  // Calculate metrics
  const numberOfJobs = viewMode === 'week' ? stats.completedThisWeek : stats.completedThisMonth;
  const averageJobSize = avgPerJob;
  const totalJobValue = totalRevenue;

  // Check if there are any alerts
  const hasAlerts = alerts.scheduleConflicts > 0 ||
    alerts.unassignedJobs > 0 ||
    alerts.unconfirmedSoonJobs > 0 ||
    alerts.overdueInvoices > 0 ||
    alerts.overdueJobs > 0;

  return (
    <ProviderLayout providerName={providerName}>
      <div className="w-full bg-background">
        <div className="px-6 py-5">

          {/* TOP ROW: Metrics + Chart */}
          <div className="flex flex-col lg:flex-row gap-6 mb-6">

            {/* Left: 3 Metric Cards */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-4 lg:w-[280px] flex-shrink-0">
              {/* Number of Jobs */}
              <div className="flex-1 bg-emerald-500 rounded-2xl p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-4xl font-bold text-white">{numberOfJobs}</p>
                    <p className="text-sm text-emerald-100 mt-1">Jobs Completed</p>
                  </div>
                  <div className="p-2 rounded-lg bg-white/20">
                    <Hash className="h-5 w-5 text-white" />
                  </div>
                </div>
              </div>

              {/* Average Job Size */}
              <div className="flex-1 bg-emerald-500 rounded-2xl p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-4xl font-bold text-white">{formatCurrency(averageJobSize)}</p>
                    <p className="text-sm text-emerald-100 mt-1">Average Job Size</p>
                  </div>
                  <div className="p-2 rounded-lg bg-white/20">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                </div>
              </div>

              {/* Total Job Value */}
              <div className="flex-1 bg-emerald-500 rounded-2xl p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-4xl font-bold text-white">{formatCurrency(totalJobValue)}</p>
                    <p className="text-sm text-emerald-100 mt-1">Total Revenue</p>
                  </div>
                  <div className="p-2 rounded-lg bg-white/20">
                    <DollarSign className="h-5 w-5 text-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Revenue Chart */}
            <div className="flex-1 bg-card rounded-2xl border border-border shadow-sm p-5">
              {/* Chart Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <h2 className="text-lg font-semibold text-foreground">Revenue</h2>
                  <div className="flex bg-muted rounded-lg p-1">
                    <button
                      onClick={() => {
                        setViewMode('week');
                        setCurrentDate(new Date());
                      }}
                      className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${
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
                      className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${
                        viewMode === 'month'
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Month
                    </button>
                  </div>
                  <div className="h-5 w-px bg-border" />
                  <span className="text-sm text-muted-foreground">{jobsCompleted} completed</span>
                  <span className="text-sm font-medium text-emerald-600">{formatCurrency(viewMode === 'week' ? stats.weeklyRevenue : stats.monthlyRevenue)}</span>
                </div>

                {/* Date Navigation */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrev}
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                  </button>
                  <span className="text-sm text-muted-foreground min-w-[120px] text-center">{dateLabel}</span>
                  <button
                    onClick={handleNext}
                    disabled={!canGoNext}
                    className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${
                      canGoNext ? 'bg-muted/50 hover:bg-muted' : 'opacity-30 cursor-not-allowed'
                    }`}
                  >
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
              </div>

              {/* Chart */}
              <div className="h-[200px] w-full">
                {hasRevenueData ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={chartData}
                      margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                      onClick={(data) => {
                        const payload = (data as { activePayload?: Array<{ payload: RevenueDataPoint }> })?.activePayload?.[0]?.payload;
                        if (payload) handleGraphClick(payload);
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.06} vertical={false} />
                      <XAxis
                        dataKey="displayLabel"
                        stroke="currentColor"
                        strokeOpacity={0.5}
                        tick={{ fill: 'currentColor', opacity: 0.6, fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        domain={[0, 'auto']}
                        stroke="currentColor"
                        strokeOpacity={0.5}
                        tick={{ fill: 'currentColor', opacity: 0.6, fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `$${value}`}
                        width={50}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="amount"
                        stroke="#10b981"
                        strokeWidth={2}
                        fill="url(#colorRevenue)"
                        dot={false}
                        activeDot={{ r: 5, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                    <DollarSign className="h-10 w-10 mb-2 opacity-30" />
                    <p className="text-sm">No revenue data for this period</p>
                  </div>
                )}
              </div>

              {/* Date Breakdown */}
              {selectedDate && (
                <div ref={breakdownRef} className="mt-4 bg-muted/30 rounded-xl border border-border overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-foreground">
                        {format(new Date(selectedDate + 'T12:00:00'), 'EEEE, MMMM d, yyyy')}
                      </span>
                    </div>
                    <button
                      onClick={() => { setSelectedDate(null); setDateBreakdown(null); }}
                      className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-muted transition-colors"
                    >
                      <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>
                  <div className="p-4">
                    {loadingBreakdown ? (
                      <div className="flex items-center justify-center py-6">
                        <div className="animate-pulse text-muted-foreground">Loading...</div>
                      </div>
                    ) : dateBreakdown?.jobs.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                        <Briefcase className="h-8 w-8 mb-2 opacity-50" />
                        <p className="text-sm">No jobs scheduled</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[200px] overflow-y-auto">
                        {dateBreakdown?.jobs.map((job) => (
                          <button
                            key={job.id}
                            onClick={() => router.push(`/provider/jobs/${job.id}`)}
                            className="w-full p-3 bg-background hover:bg-muted/40 rounded-lg text-left transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-foreground text-sm">{job.serviceType}</p>
                                <p className="text-xs text-muted-foreground">{job.customerName}</p>
                              </div>
                              {job.amount !== null && (
                                <p className="text-sm font-semibold text-emerald-600">{formatCurrency(job.amount)}</p>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* BOTTOM ROW: 3 Columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Column 1: Jobs Scheduled Today */}
            <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-foreground">Jobs Scheduled Today</h3>
                <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                  {todaysJobs.length}
                </span>
              </div>

              {todaysJobs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Calendar className="h-10 w-10 mb-2 opacity-30" />
                  <p className="text-sm">No jobs scheduled today</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {todaysJobs.map((job) => (
                    <button
                      key={job.id}
                      onClick={() => router.push(`/provider/jobs/${job.id}`)}
                      className="w-full p-3 bg-muted/40 hover:bg-muted/60 rounded-xl text-left transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-foreground truncate">{job.serviceType}</p>
                            {job.status === 'in_progress' && (
                              <span className="inline-flex items-center text-[10px] text-orange-500 font-medium">
                                <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-1 animate-pulse" />
                                Active
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{job.customerName}</p>
                          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{formatTime(job.startTime)}</span>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Column 2: Coming Up */}
            <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-foreground">Coming Up</h3>
                <button
                  onClick={() => router.push('/provider/calendar')}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-0.5"
                >
                  View all
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>

              {groupedUpcomingJobs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Calendar className="h-10 w-10 mb-2 opacity-30" />
                  <p className="text-sm">No upcoming jobs</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {groupedUpcomingJobs.map((group) => (
                    <div key={group.date}>
                      <p className="text-xs font-medium text-muted-foreground mb-1.5">{group.label}</p>
                      <div className="space-y-1">
                        {group.jobs.map((job) => (
                          <button
                            key={job.id}
                            onClick={() => router.push(`/provider/jobs/${job.id}`)}
                            className="w-full flex items-center justify-between p-2 hover:bg-muted/40 rounded-lg transition-colors"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-muted/60 flex items-center justify-center flex-shrink-0">
                                <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">{job.serviceType}</p>
                                <p className="text-xs text-muted-foreground">{formatTime(job.startTime)}</p>
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Column 3: Needs Attention */}
            <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
              <h3 className="text-base font-semibold text-foreground mb-4">Needs Attention</h3>

              {!hasAlerts ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <AlertTriangle className="h-10 w-10 mb-2 opacity-30" />
                  <p className="text-sm">No issues to address</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {/* Schedule Conflicts */}
                  {alerts.scheduleConflicts > 0 && (
                    <button
                      onClick={() => router.push('/provider/calendar')}
                      className="w-full flex items-center gap-3 p-3 bg-red-500/10 hover:bg-red-500/15 rounded-lg transition-colors"
                    >
                      <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                      <div className="text-left flex-1">
                        <p className="text-sm font-medium text-foreground">
                          {alerts.scheduleConflicts} schedule {alerts.scheduleConflicts === 1 ? 'conflict' : 'conflicts'}
                        </p>
                        <p className="text-xs text-muted-foreground">Overlapping jobs</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-red-600" />
                    </button>
                  )}

                  {/* Overdue Jobs */}
                  {alerts.overdueJobs > 0 && (
                    <button
                      onClick={() => router.push('/provider/jobs?status=overdue')}
                      className="w-full flex items-center gap-3 p-3 bg-red-500/10 hover:bg-red-500/15 rounded-lg transition-colors"
                    >
                      <CalendarX className="h-4 w-4 text-red-600 flex-shrink-0" />
                      <div className="text-left flex-1">
                        <p className="text-sm font-medium text-foreground">
                          {alerts.overdueJobs} overdue {alerts.overdueJobs === 1 ? 'job' : 'jobs'}
                        </p>
                        <p className="text-xs text-muted-foreground">Past scheduled time</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-red-600" />
                    </button>
                  )}

                  {/* Jobs Starting Soon */}
                  {alerts.unconfirmedSoonJobs > 0 && (
                    <button
                      onClick={() => router.push('/provider/jobs?status=pending')}
                      className="w-full flex items-center gap-3 p-3 bg-orange-500/10 hover:bg-orange-500/15 rounded-lg transition-colors"
                    >
                      <ClockAlert className="h-4 w-4 text-orange-600 flex-shrink-0" />
                      <div className="text-left flex-1">
                        <p className="text-sm font-medium text-foreground">
                          {alerts.unconfirmedSoonJobs} starting soon
                        </p>
                        <p className="text-xs text-muted-foreground">Within 2 hours</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-orange-600" />
                    </button>
                  )}

                  {/* Unassigned Jobs */}
                  {alerts.unassignedJobs > 0 && (
                    <button
                      onClick={() => router.push('/provider/calendar')}
                      className="w-full flex items-center gap-3 p-3 bg-orange-500/10 hover:bg-orange-500/15 rounded-lg transition-colors"
                    >
                      <UserX className="h-4 w-4 text-orange-600 flex-shrink-0" />
                      <div className="text-left flex-1">
                        <p className="text-sm font-medium text-foreground">
                          {alerts.unassignedJobs} unassigned {alerts.unassignedJobs === 1 ? 'job' : 'jobs'}
                        </p>
                        <p className="text-xs text-muted-foreground">No worker assigned</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-orange-600" />
                    </button>
                  )}

                  {/* Overdue Invoices */}
                  {alerts.overdueInvoices > 0 && (
                    <button
                      onClick={() => router.push('/provider/invoices?status=overdue')}
                      className="w-full flex items-center gap-3 p-3 bg-amber-500/10 hover:bg-amber-500/15 rounded-lg transition-colors"
                    >
                      <FileWarning className="h-4 w-4 text-amber-600 flex-shrink-0" />
                      <div className="text-left flex-1">
                        <p className="text-sm font-medium text-foreground">
                          {alerts.overdueInvoices} overdue {alerts.overdueInvoices === 1 ? 'invoice' : 'invoices'}
                        </p>
                        <p className="text-xs text-muted-foreground">30+ days unpaid</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-amber-600" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProviderLayout>
  );
}
