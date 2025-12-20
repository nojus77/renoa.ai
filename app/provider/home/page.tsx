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
import RecentJobsTable from '@/components/provider/RecentJobsTable';
import NeedsAttentionTable, { type AlertType } from '@/components/provider/NeedsAttentionTable';
import JobPreviewModal from '@/components/provider/JobPreviewModal';
import JobDetailsSidebar, { type SidebarMode } from '@/components/provider/JobDetailsSidebar';
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
  Activity,
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
  endTime?: string;
  serviceType: string;
  customerName?: string;
  address?: string;
  status?: string;
  estimatedValue?: number | null;
  actualValue?: number | null;
  workerName?: string | null;
  phone?: string;
  notes?: string;
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
  amount: number | null;
  jobCount?: number;
  avgValue?: number;
  utilization?: number;
  label?: string;
  day?: string;
  displayLabel?: string;
}

interface RecentJob {
  id: string;
  completedAt: string;
  customerName: string;
  serviceType: string;
  workerName: string | null;
  address: string;
  amount: number | null;
}

type ChartMetric = 'revenue' | 'jobs' | 'avgValue' | 'utilization';

const METRIC_CONFIG: Record<ChartMetric, {
  label: string;
  color: string;
  formatter: (value: number) => string;
  dataKey: string;
}> = {
  revenue: {
    label: 'Revenue',
    color: '#10b981',
    formatter: (v) => `$${v.toLocaleString()}`,
    dataKey: 'amount',
  },
  jobs: {
    label: 'Jobs Completed',
    color: '#3b82f6',
    formatter: (v) => String(v),
    dataKey: 'jobCount',
  },
  avgValue: {
    label: 'Avg Job Value',
    color: '#8b5cf6',
    formatter: (v) => `$${v.toLocaleString()}`,
    dataKey: 'avgValue',
  },
  utilization: {
    label: 'Utilization Rate',
    color: '#f97316',
    formatter: (v) => `${v}%`,
    dataKey: 'utilization',
  },
};

interface HomeData {
  todaysJobs: TodayJob[];
  upcomingJobs: UpcomingJob[];
  stats: Stats;
  alerts: Alerts;
  revenueHistory: RevenueDataPoint[];
  recentJobs?: RecentJob[];
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

// Custom tooltip for the chart - hide on zero values
function CustomTooltip({
  active,
  payload,
  metric,
  metricColor,
  onViewJobs
}: {
  active?: boolean;
  payload?: Array<{ value: number; payload: RevenueDataPoint }>;
  label?: string;
  metric: ChartMetric;
  metricColor: string;
  onViewJobs?: (data: RevenueDataPoint) => void;
}) {
  if (active && payload && payload.length && payload[0].value > 0) {
    const data = payload[0].payload;
    const config = METRIC_CONFIG[metric];
    return (
      <div className="bg-card border border-border rounded-lg shadow-lg p-3 min-w-[160px]">
        <p className="text-xs text-muted-foreground mb-2">{data.label} {data.day ? `(${data.day})` : ''}</p>
        <p className="text-xl font-bold text-foreground mb-2" style={{ color: metricColor }}>
          {config.formatter(payload[0].value)}
        </p>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onViewJobs?.(data);
          }}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-md cursor-pointer transition-colors hover:opacity-80 w-full"
          style={{ backgroundColor: `${metricColor}15` }}
        >
          <span className="text-sm font-medium" style={{ color: metricColor }}>View Jobs</span>
          <ChevronRight className="h-5 w-5" style={{ color: metricColor }} />
        </button>
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
  const [chartMetric, setChartMetric] = useState<ChartMetric>('revenue');

  // Date breakdown state
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dateBreakdown, setDateBreakdown] = useState<DateBreakdown | null>(null);
  const [loadingBreakdown, setLoadingBreakdown] = useState(false);
  const breakdownRef = useRef<HTMLDivElement>(null);

  // Job preview modal state
  const [previewJob, setPreviewJob] = useState<{
    id: string;
    customerName: string;
    serviceType: string;
    address: string;
    startTime: string;
    endTime?: string;
    status?: string;
    estimatedValue?: number | null;
    actualValue?: number | null;
    workerName?: string | null;
    phone?: string;
    notes?: string;
  } | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const openJobPreview = (job: UpcomingJob | TodayJob) => {
    const previewData = {
      id: job.id,
      customerName: 'customerName' in job ? (job.customerName || 'Unknown') : (job as TodayJob).customerName,
      serviceType: job.serviceType,
      address: 'address' in job ? (job.address || '') : (job as TodayJob).address,
      startTime: job.startTime,
      endTime: 'endTime' in job ? job.endTime : undefined,
      status: 'status' in job ? job.status : undefined,
      estimatedValue: 'estimatedValue' in job ? job.estimatedValue : null,
      actualValue: 'actualValue' in job ? job.actualValue : null,
      workerName: 'workerName' in job ? job.workerName : ('workers' in job && job.workers?.length > 0 ? `${job.workers[0].firstName} ${job.workers[0].lastName}` : null),
      phone: 'phone' in job ? job.phone : ('customerPhone' in job ? (job as TodayJob).customerPhone : undefined),
      notes: 'notes' in job ? job.notes : undefined,
    };
    setPreviewJob(previewData);
    setIsPreviewOpen(true);
  };

  const closeJobPreview = () => {
    setIsPreviewOpen(false);
    setTimeout(() => setPreviewJob(null), 300); // Clear after animation
  };

  // Unified sidebar state for both chart and alerts
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>('date');
  const [selectedSidebarDate, setSelectedSidebarDate] = useState<string | null>(null);
  const [selectedAlertType, setSelectedAlertType] = useState<AlertType | null>(null);
  const [selectedAlertCount, setSelectedAlertCount] = useState(0);

  const openSidebarForDate = (date: string) => {
    setSidebarMode('date');
    setSelectedSidebarDate(date);
    setSelectedAlertType(null);
    setSidebarOpen(true);
  };

  const handleAlertClick = (alertType: AlertType, alertDetails: { count: number; href: string }) => {
    setSidebarMode('alert');
    setSelectedAlertType(alertType);
    setSelectedAlertCount(alertDetails.count);
    setSelectedSidebarDate(null);
    setSidebarOpen(true);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
    setTimeout(() => {
      setSelectedSidebarDate(null);
      setSelectedAlertType(null);
      setSelectedAlertCount(0);
    }, 300);
  };

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

    // Open the sidebar for this date
    openSidebarForDate(data.date);

    // Also update the inline breakdown for reference
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
  }, [providerId, selectedDate, openSidebarForDate]);

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

      // Debug: Log API response
      console.log('🔍 API Response Debug:', {
        success: result.success,
        hasRevenueHistory: !!result.data?.revenueHistory,
        revenueHistoryLength: result.data?.revenueHistory?.length,
        revenueHistorySample: result.data?.revenueHistory?.slice(-7),
        stats: result.data?.stats,
      });

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
        const hasRealData = result.data.revenueHistory?.some((d: RevenueDataPoint) => (d.amount ?? 0) > 0);

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
          recentJobs: result.data.recentJobs || [],
        });
      } else {
        const testData = generateTestDataForRange(
          startOfMonth(subMonths(new Date(), 1)),
          new Date()
        );
        const weekTotal = testData.slice(-7).reduce((sum, d) => sum + (d.amount ?? 0), 0);
        const monthTotal = testData.slice(-30).reduce((sum, d) => sum + (d.amount ?? 0), 0);

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
      const weekTotal = testData.slice(-7).reduce((sum, d) => sum + (d.amount ?? 0), 0);
      const monthTotal = testData.slice(-30).reduce((sum, d) => sum + (d.amount ?? 0), 0);

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

    // Start with all zeros
    fullRangeData.forEach(d => {
      d.amount = 0;
      d.jobCount = 0;
      d.avgValue = 0;
      d.utilization = 0;
    });

    if (homeData?.revenueHistory && homeData.revenueHistory.length > 0) {
      const dataMap = new Map(homeData.revenueHistory.map(d => [d.date, d]));

      // Debug: Log data mapping
      console.log('📊 Chart Data Debug:', {
        dateRangeStart: format(dateRange.start, 'yyyy-MM-dd'),
        dateRangeEnd: format(dateRange.end, 'yyyy-MM-dd'),
        revenueHistoryDates: homeData.revenueHistory.map(d => ({ date: d.date, amount: d.amount, jobCount: d.jobCount })),
        fullRangeDates: fullRangeData.map(d => d.date),
        dataMapKeys: Array.from(dataMap.keys()),
      });

      fullRangeData.forEach(d => {
        const realData = dataMap.get(d.date);
        if (realData) {
          d.amount = realData.amount;
          d.jobCount = realData.jobCount ?? 0;
          d.avgValue = realData.avgValue ?? 0;
          d.utilization = realData.utilization ?? 0;
          console.log('✅ Matched date:', d.date, 'amount:', d.amount, 'jobCount:', d.jobCount);
        }
      });

      // Debug: Log after merging
      const nonZeroData = fullRangeData.filter(d => d.amount && d.amount > 0);
      console.log('📈 Non-zero data after merge:', nonZeroData.length, 'entries:', nonZeroData.map(d => ({ date: d.date, amount: d.amount, jobCount: d.jobCount })));

      // Check if we have ANY non-null data
      if (nonZeroData.length === 0) {
        console.warn('⚠️ WARNING: No non-zero data found! Chart line will not render.');
        console.log('📊 Full revenue history from API:', homeData.revenueHistory);
      }
    } else {
      console.warn('⚠️ No revenueHistory data available from API');
    }

    // Convert zero values to null for the current metric so chart doesn't render them
    const processedData = fullRangeData.map(d => ({
      ...d,
      amount: d.amount === 0 ? null : d.amount,
      jobCount: d.jobCount === 0 ? null : d.jobCount,
      avgValue: d.avgValue === 0 ? null : d.avgValue,
      utilization: d.utilization === 0 ? null : d.utilization,
    }));

    console.log('🎨 Final processed chart data:', processedData.filter(d => d.amount !== null || d.jobCount !== null).map(d => ({
      date: d.date,
      displayLabel: d.displayLabel,
      amount: d.amount,
      jobCount: d.jobCount
    })));

    if (viewMode === 'week') {
      return processedData.map(d => ({
        ...d,
        displayLabel: format(new Date(d.date + 'T12:00:00'), 'EEE'),
      }));
    } else {
      return processedData.map((d, i) => {
        const dayNum = new Date(d.date + 'T12:00:00').getDate();
        const showLabel = dayNum === 1 || dayNum % 5 === 0 || i === processedData.length - 1;
        return {
          ...d,
          displayLabel: showLabel ? String(dayNum) : '',
        };
      });
    }
  }, [homeData?.revenueHistory, dateRange, viewMode]);

  const totalRevenue = useMemo(() => {
    return chartData.reduce((sum, d) => sum + (d.amount || 0), 0);
  }, [chartData]);

  const hasChartData = useMemo(() => {
    const dataKey = METRIC_CONFIG[chartMetric].dataKey as keyof RevenueDataPoint;
    return chartData.some(d => {
      const val = d[dataKey];
      return val !== null && val !== undefined && Number(val) > 0;
    });
  }, [chartData, chartMetric]);

  const currentMetricTotal = useMemo(() => {
    const config = METRIC_CONFIG[chartMetric];
    if (chartMetric === 'revenue') {
      return chartData.reduce((sum, d) => sum + (d.amount || 0), 0);
    } else if (chartMetric === 'jobs') {
      return chartData.reduce((sum, d) => sum + (d.jobCount || 0), 0);
    } else if (chartMetric === 'avgValue') {
      const total = chartData.reduce((sum, d) => sum + (d.avgValue || 0), 0);
      const count = chartData.filter(d => d.avgValue && d.avgValue > 0).length;
      return count > 0 ? Math.round(total / count) : 0;
    } else {
      const total = chartData.reduce((sum, d) => sum + (d.utilization || 0), 0);
      const count = chartData.filter(d => d.utilization !== null).length;
      return count > 0 ? Math.round(total / count) : 0;
    }
  }, [chartData, chartMetric]);

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
      {/* Job Preview Modal */}
      <JobPreviewModal
        job={previewJob}
        isOpen={isPreviewOpen}
        onClose={closeJobPreview}
      />

      {/* Unified Jobs Sidebar - slides from right */}
      <JobDetailsSidebar
        isOpen={sidebarOpen}
        onClose={closeSidebar}
        mode={sidebarMode}
        selectedDate={selectedSidebarDate}
        alertType={selectedAlertType}
        alertCount={selectedAlertCount}
      />

      <div className="w-full bg-background">
        {/* ABOVE FOLD SECTION - Metrics + Chart + Alerts */}
        <div className="min-h-[calc(100vh-64px)] px-6 py-5 flex flex-col">

          {/* TOP ROW: Metrics + Chart */}
          <div className="flex flex-col lg:flex-row gap-6">

            {/* Left: 3 Metric Cards - Minimal Gray Design */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-4 lg:w-[280px] flex-shrink-0">
              {/* Number of Jobs */}
              <div className="flex-1 bg-[#18181b] rounded-2xl p-5 border border-[#27272a]">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-4xl font-bold text-white">{numberOfJobs}</p>
                    <p className="text-sm text-[#71717a] mt-1">Jobs Completed</p>
                  </div>
                  <Hash className="h-5 w-5 text-[#71717a]" />
                </div>
              </div>

              {/* Average Job Size */}
              <div className="flex-1 bg-[#18181b] rounded-2xl p-5 border border-[#27272a]">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-4xl font-bold text-white">{formatCurrency(averageJobSize)}</p>
                    <p className="text-sm text-[#71717a] mt-1">Average Job Size</p>
                  </div>
                  <TrendingUp className="h-5 w-5 text-[#71717a]" />
                </div>
              </div>

              {/* Total Job Value */}
              <div className="flex-1 bg-[#18181b] rounded-2xl p-5 border border-[#27272a]">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-4xl font-bold text-white">{formatCurrency(totalJobValue)}</p>
                    <p className="text-sm text-[#71717a] mt-1">Total Revenue</p>
                  </div>
                  <DollarSign className="h-5 w-5 text-[#71717a]" />
                </div>
              </div>
            </div>

            {/* Right: Revenue Chart */}
            <div className="flex-1 bg-card rounded-2xl border border-border shadow-sm p-5 overflow-hidden">
              {/* Chart Header */}
              <div className="flex flex-col gap-3 mb-3">
                {/* Top row: Title + Total + Date Navigation */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold text-foreground">{METRIC_CONFIG[chartMetric].label}</h2>
                    <span
                      className="text-lg font-bold"
                      style={{ color: METRIC_CONFIG[chartMetric].color }}
                    >
                      {METRIC_CONFIG[chartMetric].formatter(currentMetricTotal)}
                    </span>
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

                {/* Bottom row: Metric toggles + Time period */}
                <div className="flex items-center justify-between">
                  {/* Metric Toggles */}
                  <div className="flex gap-2">
                    {(Object.keys(METRIC_CONFIG) as ChartMetric[]).map((metric) => (
                      <button
                        key={metric}
                        onClick={() => setChartMetric(metric)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                          chartMetric === metric
                            ? 'text-white shadow-sm'
                            : 'bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted'
                        }`}
                        style={chartMetric === metric ? { backgroundColor: METRIC_CONFIG[metric].color } : {}}
                      >
                        {METRIC_CONFIG[metric].label}
                      </button>
                    ))}
                  </div>

                  {/* Time Period Toggle */}
                  <div className="flex bg-muted rounded-lg p-1">
                    <button
                      onClick={() => {
                        setViewMode('week');
                        setCurrentDate(new Date());
                      }}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
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
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                        viewMode === 'month'
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Month
                    </button>
                  </div>
                </div>
              </div>

              {/* Chart */}
              <div className="h-[280px] w-full">
                {hasChartData ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={chartData}
                      margin={{ top: 20, right: 20, left: 10, bottom: 20 }}
                      onClick={(data) => {
                        const payload = (data as { activePayload?: Array<{ payload: RevenueDataPoint }> })?.activePayload?.[0]?.payload;
                        if (payload) handleGraphClick(payload);
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <defs>
                        <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={METRIC_CONFIG[chartMetric].color} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={METRIC_CONFIG[chartMetric].color} stopOpacity={0} />
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
                        tickFormatter={(value) => {
                          if (chartMetric === 'revenue' || chartMetric === 'avgValue') return `$${value}`;
                          if (chartMetric === 'utilization') return `${value}%`;
                          return String(value);
                        }}
                        width={45}
                      />
                      <Tooltip
                        content={
                          <CustomTooltip
                            metric={chartMetric}
                            metricColor={METRIC_CONFIG[chartMetric].color}
                            onViewJobs={handleGraphClick}
                          />
                        }
                      />
                      <Area
                        type="monotone"
                        dataKey={METRIC_CONFIG[chartMetric].dataKey}
                        stroke={METRIC_CONFIG[chartMetric].color}
                        strokeWidth={3}
                        fill="url(#colorMetric)"
                        fillOpacity={0.3}
                        isAnimationActive={false}
                        dot={(props: { cx?: number; cy?: number; payload?: RevenueDataPoint; index?: number }) => {
                          const dataKey = METRIC_CONFIG[chartMetric].dataKey as keyof RevenueDataPoint;
                          const val = props.payload?.[dataKey];
                          // Only show dots for data points that have values
                          if (val === null || val === undefined || val === 0) {
                            return <g key={props.index} />;
                          }
                          return (
                            <circle
                              key={props.index}
                              cx={props.cx}
                              cy={props.cy}
                              r={5}
                              fill={METRIC_CONFIG[chartMetric].color}
                              stroke="#fff"
                              strokeWidth={2}
                            />
                          );
                        }}
                        connectNulls={true}
                        activeDot={(props: { cx?: number; cy?: number; payload?: RevenueDataPoint }) => {
                          const dataKey = METRIC_CONFIG[chartMetric].dataKey as keyof RevenueDataPoint;
                          const val = props.payload?.[dataKey];
                          if (val === null || val === undefined || val === 0) {
                            return <g />;
                          }
                          return (
                            <circle
                              cx={props.cx}
                              cy={props.cy}
                              r={7}
                              fill={METRIC_CONFIG[chartMetric].color}
                              stroke="#fff"
                              strokeWidth={2}
                            />
                          );
                        }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                    <Activity className="h-10 w-10 mb-2 opacity-30" />
                    <p className="text-sm">No data for this period</p>
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

          {/* Needs Attention Table - Full Width in Above Fold */}
          <div className="mt-6 flex-1">
            <NeedsAttentionTable alerts={alerts} onAlertClick={handleAlertClick} />
          </div>
        </div>

        {/* BELOW FOLD SECTION - History & Schedules */}
        <div className="px-6 py-8 border-t border-border bg-muted/5">

          {/* Recent Jobs Table - Full Width */}
          {homeData.recentJobs && homeData.recentJobs.length > 0 && (
            <div className="mb-10">
              <RecentJobsTable jobs={homeData.recentJobs} />
            </div>
          )}

          {/* Coming Up + Jobs Scheduled Today - 2 Columns with equal height */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">

            {/* Column 1: Coming Up - Enhanced Cards */}
            <div className="bg-card rounded-2xl border border-border shadow-sm p-6 flex flex-col min-h-[400px]">
              <div className="flex items-center justify-between mb-5">
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
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                  <Calendar className="h-10 w-10 mb-2 opacity-30" />
                  <p className="text-sm">No upcoming jobs</p>
                </div>
              ) : (
                <div className="flex-1 space-y-4 overflow-y-auto">
                  {groupedUpcomingJobs.map((group) => (
                    <div key={group.date}>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">{group.label}</p>
                      <div className="space-y-3">
                        {group.jobs.map((job) => (
                          <button
                            key={job.id}
                            onClick={() => openJobPreview(job)}
                            className="w-full bg-muted/30 hover:bg-muted/50 border border-border hover:border-primary/30 rounded-xl p-4 text-left transition-all group"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0 space-y-2">
                                {/* Customer Name - Bold at top */}
                                <p className="text-sm font-bold text-foreground truncate">
                                  {job.customerName || 'Unknown Customer'}
                                </p>

                                {/* Service Type with icon */}
                                <div className="flex items-center gap-2 text-primary">
                                  <Briefcase className="h-3.5 w-3.5 flex-shrink-0" />
                                  <span className="text-xs font-medium truncate">{job.serviceType}</span>
                                </div>

                                {/* Address - gray with location icon */}
                                {job.address && (
                                  <div className="flex items-start gap-2 text-muted-foreground">
                                    <MapPin className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                                    <span className="text-xs truncate">{job.address}</span>
                                  </div>
                                )}

                                {/* Date AND Time - Both visible */}
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                                  <span className="text-xs">
                                    {format(new Date(job.startTime), 'MMM d')} at {formatTime(job.startTime)}
                                    {job.endTime && ` - ${formatTime(job.endTime)}`}
                                  </span>
                                </div>

                                {/* Worker and Amount row */}
                                <div className="flex items-center justify-between pt-1">
                                  {/* Worker assigned */}
                                  {job.workerName && (
                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                      <User className="h-3 w-3 flex-shrink-0" />
                                      <span className="text-xs">{job.workerName}</span>
                                    </div>
                                  )}

                                  {/* Estimated amount */}
                                  {(job.estimatedValue || job.actualValue) && (
                                    <span className="text-xs font-semibold text-emerald-500">
                                      {formatCurrency(job.actualValue || job.estimatedValue || 0)}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Arrow on right */}
                              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary flex-shrink-0 transition-colors" />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Column 2: Jobs Scheduled Today - Enhanced Cards */}
            <div className="bg-card rounded-2xl border border-border shadow-sm p-6 flex flex-col min-h-[400px]">
              <button
                onClick={() => {
                  setSidebarMode('alert');
                  setSelectedAlertType('today-jobs');
                  setSelectedAlertCount(todaysJobs.length);
                  setSelectedSidebarDate(null);
                  setSidebarOpen(true);
                }}
                className="flex items-center justify-between mb-5 w-full text-left hover:opacity-80 transition-opacity group"
              >
                <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">Jobs Scheduled Today</h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                    {todaysJobs.length}
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </button>

              {todaysJobs.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                  <Calendar className="h-10 w-10 mb-2 opacity-30" />
                  <p className="text-sm">No jobs scheduled today</p>
                </div>
              ) : (
                <div className="flex-1 space-y-3 overflow-y-auto">
                  {todaysJobs.map((job) => (
                    <button
                      key={job.id}
                      onClick={() => openJobPreview(job)}
                      className="w-full bg-muted/30 hover:bg-muted/50 border border-border hover:border-primary/30 rounded-xl p-4 text-left transition-all group"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0 space-y-2">
                          {/* Customer Name - Bold at top */}
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-foreground truncate">{job.customerName}</p>
                            {job.status === 'in_progress' && (
                              <span className="inline-flex items-center text-[10px] text-orange-500 font-medium bg-orange-500/10 px-1.5 py-0.5 rounded-full">
                                <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-1 animate-pulse" />
                                Active
                              </span>
                            )}
                          </div>

                          {/* Service Type with icon */}
                          <div className="flex items-center gap-2 text-primary">
                            <Briefcase className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className="text-xs font-medium truncate">{job.serviceType}</span>
                          </div>

                          {/* Address - gray with location icon */}
                          {job.address && (
                            <div className="flex items-start gap-2 text-muted-foreground">
                              <MapPin className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                              <span className="text-xs truncate">{job.address}</span>
                            </div>
                          )}

                          {/* Time - show time range */}
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className="text-xs">
                              {formatTime(job.startTime)}
                              {job.endTime && ` - ${formatTime(job.endTime)}`}
                            </span>
                          </div>

                          {/* Worker and Amount row */}
                          <div className="flex items-center justify-between pt-1">
                            {/* Worker assigned */}
                            {job.workers && job.workers.length > 0 && (
                              <div className="flex items-center gap-1.5 text-muted-foreground">
                                <User className="h-3 w-3 flex-shrink-0" />
                                <span className="text-xs">
                                  {job.workers.map(w => `${w.firstName} ${w.lastName}`).join(', ')}
                                </span>
                              </div>
                            )}

                            {/* Amount */}
                            {job.totalAmount && (
                              <span className="text-xs font-semibold text-emerald-500">
                                {formatCurrency(job.totalAmount)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Arrow on right */}
                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary flex-shrink-0 transition-colors" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProviderLayout>
  );
}
