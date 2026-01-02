"use client"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProviderLayout from '@/components/provider/ProviderLayout';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Briefcase,
  Users,
  Award,
  Clock,
  Target,
  Calendar,
  Download,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Zap,
  Star,
  RefreshCw,
  Info,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { toast } from 'sonner';

export default function ProviderAnalytics() {
  const router = useRouter();
  const [providerId, setProviderId] = useState('');
  const [providerName, setProviderName] = useState('');
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(30); // days
  const [error, setError] = useState(false);

  useEffect(() => {
    const id = localStorage.getItem('providerId');
    const name = localStorage.getItem('providerName');

    if (!id || !name) {
      router.push('/provider/login');
      return;
    }

    setProviderId(id);
    setProviderName(name);
    fetchAnalytics(id, dateRange);
  }, [router, dateRange]);

  const fetchAnalytics = async (id: string, days: number) => {
    setLoading(true);
    setError(false);

    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const res = await fetch(
        `/api/provider/analytics?providerId=${id}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );

      if (!res.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const data = await res.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError(true);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number, showSign = true) => {
    const sign = value > 0 ? '+' : '';
    return `${showSign ? sign : ''}${value}%`;
  };

  const COLORS = {
    emerald: '#10b981',
    blue: '#3b82f6',
    purple: '#a855f7',
    orange: '#f97316',
    red: '#ef4444',
    yellow: '#eab308',
  };

  if (loading) {
    return (
      <ProviderLayout providerName={providerName}>
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
            <p className="text-zinc-400">Loading analytics...</p>
          </div>
        </div>
      </ProviderLayout>
    );
  }

  if (error) {
    return (
      <ProviderLayout providerName={providerName}>
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-zinc-100 mb-2">Unable to load analytics</h2>
            <p className="text-zinc-400 mb-4">Please try again</p>
            <Button
              onClick={() => fetchAnalytics(providerId, dateRange)}
              className="bg-emerald-600 hover:bg-emerald-500"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      </ProviderLayout>
    );
  }

  if (!analytics || !analytics.kpis) {
    return (
      <ProviderLayout providerName={providerName}>
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-xl font-bold text-zinc-100 mb-2">No analytics data yet</h2>
            <p className="text-zinc-400">Complete some jobs to see your performance metrics here</p>
          </div>
        </div>
      </ProviderLayout>
    );
  }

  const { kpis, revenueOverTime, serviceBreakdown, topCustomers, newVsReturning, renoaPerformance, ownClientPerformance, seasonalInsights, performanceMetrics } = analytics;

  return (
    <ProviderLayout providerName={providerName}>
      <div className="min-h-screen bg-zinc-950">
        {/* Header */}
        <div className="border-b border-zinc-800/50 bg-zinc-900/30 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-[1600px] mx-auto px-3 md:px-6 py-3 md:py-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <h1 className="text-xl md:text-3xl font-bold text-zinc-100">Analytics</h1>
                <p className="text-xs md:text-sm text-zinc-400 mt-1">Track your business performance</p>
              </div>

              {/* Date Range Selector - Mobile: Horizontal scroll */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 -mx-3 px-3 md:mx-0 md:px-0">
                <Button
                  variant={dateRange === 7 ? 'default' : 'outline'}
                  onClick={() => setDateRange(7)}
                  size="sm"
                  className={`flex-shrink-0 text-xs ${dateRange === 7 ? 'bg-emerald-600 hover:bg-emerald-500' : 'border-zinc-700 hover:bg-zinc-800'}`}
                >
                  7 Days
                </Button>
                <Button
                  variant={dateRange === 30 ? 'default' : 'outline'}
                  onClick={() => setDateRange(30)}
                  size="sm"
                  className={`flex-shrink-0 text-xs ${dateRange === 30 ? 'bg-emerald-600 hover:bg-emerald-500' : 'border-zinc-700 hover:bg-zinc-800'}`}
                >
                  30 Days
                </Button>
                <Button
                  variant={dateRange === 90 ? 'default' : 'outline'}
                  onClick={() => setDateRange(90)}
                  size="sm"
                  className={`flex-shrink-0 text-xs ${dateRange === 90 ? 'bg-emerald-600 hover:bg-emerald-500' : 'border-zinc-700 hover:bg-zinc-800'}`}
                >
                  3 Months
                </Button>
                <Button
                  variant={dateRange === 365 ? 'default' : 'outline'}
                  onClick={() => setDateRange(365)}
                  size="sm"
                  className={`flex-shrink-0 text-xs ${dateRange === 365 ? 'bg-emerald-600 hover:bg-emerald-500' : 'border-zinc-700 hover:bg-zinc-800'}`}
                >
                  Year
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-zinc-700 hover:bg-zinc-800 flex-shrink-0 hidden md:flex"
                  onClick={() => toast.info('Download feature coming soon')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-[1600px] mx-auto px-3 md:px-6 py-3 md:py-6 space-y-3 md:space-y-6">
          {/* KPI Cards - Mobile: 2x2 grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
            {/* Total Revenue */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 md:p-6 relative group">
              <div className="flex items-center justify-between mb-2 md:mb-4">
                <div className="p-1.5 md:p-2 bg-emerald-500/10 rounded-lg">
                  <DollarSign className="h-4 w-4 md:h-5 md:w-5 text-emerald-400" />
                </div>
                <div className="flex items-center gap-2">
                  {kpis.revenueChange !== 0 && (
                    <div className={`flex items-center gap-0.5 md:gap-1 text-xs font-medium ${kpis.revenueChange > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {kpis.revenueChange > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      <span className="hidden md:inline">{formatPercent(Math.abs(kpis.revenueChange))}</span>
                    </div>
                  )}
                  <div className="relative hidden md:block">
                    <Info className="h-3 w-3 text-zinc-600 cursor-help" />
                    <div className="absolute bottom-full right-0 mb-1 px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-[10px] text-zinc-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                      Total revenue from completed jobs in period
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-xl md:text-3xl font-bold text-zinc-100 mb-0.5 md:mb-1">
                {formatCurrency(kpis.totalRevenue)}
              </div>
              <p className="text-xs md:text-sm text-zinc-500">Revenue</p>
            </div>

            {/* Jobs Completed */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 md:p-6 relative group">
              <div className="flex items-center justify-between mb-2 md:mb-4">
                <div className="p-1.5 md:p-2 bg-blue-500/10 rounded-lg">
                  <Briefcase className="h-4 w-4 md:h-5 md:w-5 text-blue-400" />
                </div>
                <div className="flex items-center gap-2">
                  {kpis.jobsChange !== 0 && (
                    <div className={`flex items-center gap-0.5 md:gap-1 text-xs font-medium ${kpis.jobsChange > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {kpis.jobsChange > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      <span className="hidden md:inline">{formatPercent(Math.abs(kpis.jobsChange))}</span>
                    </div>
                  )}
                  <div className="relative hidden md:block">
                    <Info className="h-3 w-3 text-zinc-600 cursor-help" />
                    <div className="absolute bottom-full right-0 mb-1 px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-[10px] text-zinc-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                      Number of jobs marked complete
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-xl md:text-3xl font-bold text-zinc-100 mb-0.5 md:mb-1">
                {kpis.jobsCompleted}
              </div>
              <p className="text-xs md:text-sm text-zinc-500">Jobs</p>
            </div>

            {/* Average Job Value */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 md:p-6 relative group">
              <div className="flex items-center justify-between mb-2 md:mb-4">
                <div className="p-1.5 md:p-2 bg-purple-500/10 rounded-lg">
                  <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-purple-400" />
                </div>
                <div className="flex items-center gap-2">
                  {kpis.avgJobValueChange !== 0 && (
                    <div className={`flex items-center gap-0.5 md:gap-1 text-xs font-medium ${kpis.avgJobValueChange > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {kpis.avgJobValueChange > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      <span className="hidden md:inline">{formatPercent(Math.abs(kpis.avgJobValueChange))}</span>
                    </div>
                  )}
                  <div className="relative hidden md:block">
                    <Info className="h-3 w-3 text-zinc-600 cursor-help" />
                    <div className="absolute bottom-full right-0 mb-1 px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-[10px] text-zinc-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                      Average revenue per completed job
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-xl md:text-3xl font-bold text-zinc-100 mb-0.5 md:mb-1">
                {formatCurrency(kpis.avgJobValue)}
              </div>
              <p className="text-xs md:text-sm text-zinc-500">Avg Value</p>
            </div>

            {/* New Customers */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 md:p-6 relative group">
              <div className="flex items-center justify-between mb-2 md:mb-4">
                <div className="p-1.5 md:p-2 bg-orange-500/10 rounded-lg">
                  <Users className="h-4 w-4 md:h-5 md:w-5 text-orange-400" />
                </div>
                <div className="flex items-center gap-2">
                  {kpis.newCustomersChange !== 0 && (
                    <div className={`flex items-center gap-0.5 md:gap-1 text-xs font-medium ${kpis.newCustomersChange > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {kpis.newCustomersChange > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      <span className="hidden md:inline">{formatPercent(Math.abs(kpis.newCustomersChange))}</span>
                    </div>
                  )}
                  <div className="relative hidden md:block">
                    <Info className="h-3 w-3 text-zinc-600 cursor-help" />
                    <div className="absolute bottom-full right-0 mb-1 px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-[10px] text-zinc-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                      New customers acquired in period
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-xl md:text-3xl font-bold text-zinc-100 mb-0.5 md:mb-1">
                {kpis.newCustomers}
              </div>
              <p className="text-xs md:text-sm text-zinc-500">Customers</p>
            </div>
          </div>

          {/* Revenue Chart */}
          {revenueOverTime && revenueOverTime.length > 0 && (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 md:p-6">
              <h2 className="text-base md:text-xl font-bold text-zinc-100 mb-3 md:mb-6 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 md:h-5 md:w-5 text-emerald-400" />
                Revenue Over Time
              </h2>
              <ResponsiveContainer width="100%" height={250} className="md:h-[350px]">
                <LineChart data={revenueOverTime}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.emerald} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={COLORS.emerald} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis
                    dataKey="label"
                    stroke="#71717a"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis
                    stroke="#71717a"
                    style={{ fontSize: '12px' }}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#18181b',
                      border: '1px solid #27272a',
                      borderRadius: '8px',
                    }}
                    formatter={(value: any) => [`$${value}`, 'Revenue']}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke={COLORS.emerald}
                    strokeWidth={3}
                    fill="url(#colorRevenue)"
                    dot={{ fill: COLORS.emerald, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-6">
            {/* Service Type Breakdown */}
            {serviceBreakdown && serviceBreakdown.length > 0 && (
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 md:p-6">
                <h2 className="text-base md:text-xl font-bold text-zinc-100 mb-3 md:mb-6 flex items-center gap-2">
                  <PieChartIcon className="h-4 w-4 md:h-5 md:w-5 text-blue-400" />
                  Service Type Breakdown
                </h2>
                <ResponsiveContainer width="100%" height={200} className="md:h-[300px]">
                  <PieChart>
                    <Pie
                      data={serviceBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }: any) => `${name}: ${percentage}%`}
                      outerRadius={80}
                      className="md:outerRadius-[100]"
                      fill="#8884d8"
                      dataKey="revenue"
                    >
                      {serviceBreakdown.map((entry: any, index: number) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={Object.values(COLORS)[index % Object.values(COLORS).length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#18181b',
                        border: '1px solid #27272a',
                        borderRadius: '8px',
                      }}
                      formatter={(value: any) => `$${value}`}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-3 md:mt-4 space-y-1.5 md:space-y-2">
                  {serviceBreakdown.slice(0, 5).map((service: any, index: number) => (
                    <div key={index} className="flex items-center justify-between text-xs md:text-sm">
                      <div className="flex items-center gap-1.5 md:gap-2">
                        <div
                          className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: Object.values(COLORS)[index % Object.values(COLORS).length] }}
                        />
                        <span className="text-zinc-300 truncate">{service.name}</span>
                      </div>
                      <span className="text-zinc-500 flex-shrink-0 ml-2">{formatCurrency(service.revenue)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Renoa Lead Performance */}
            {renoaPerformance && (
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 md:p-6">
                <h2 className="text-base md:text-xl font-bold text-zinc-100 mb-3 md:mb-6 flex items-center gap-2">
                  <Zap className="h-4 w-4 md:h-5 md:w-5 text-purple-400" />
                  Renoa Lead Performance
                </h2>
                <div className="space-y-3 md:space-y-4">
                  <div className="grid grid-cols-2 gap-2 md:gap-4">
                    <div className="bg-zinc-800/50 rounded-lg p-2.5 md:p-4">
                      <p className="text-xs md:text-sm text-zinc-500 mb-0.5 md:mb-1">Leads Received</p>
                      <p className="text-lg md:text-2xl font-bold text-zinc-100">{renoaPerformance.leadsReceived}</p>
                    </div>
                    <div className="bg-zinc-800/50 rounded-lg p-2.5 md:p-4">
                      <p className="text-xs md:text-sm text-zinc-500 mb-0.5 md:mb-1">Completed</p>
                      <p className="text-lg md:text-2xl font-bold text-zinc-100">{renoaPerformance.leadsCompleted}</p>
                    </div>
                    <div className="bg-zinc-800/50 rounded-lg p-2.5 md:p-4">
                      <p className="text-xs md:text-sm text-zinc-500 mb-0.5 md:mb-1">Completion Rate</p>
                      <p className="text-lg md:text-2xl font-bold text-purple-400">{renoaPerformance.completionRate}%</p>
                    </div>
                    <div className="bg-zinc-800/50 rounded-lg p-2.5 md:p-4">
                      <p className="text-xs md:text-sm text-zinc-500 mb-0.5 md:mb-1">Revenue</p>
                      <p className="text-lg md:text-2xl font-bold text-emerald-400">{formatCurrency(renoaPerformance.revenue)}</p>
                    </div>
                  </div>

                  {/* Comparison */}
                  <div className="mt-4 md:mt-6 hidden md:block">
                    <h3 className="text-sm font-medium text-zinc-400 mb-3">Renoa vs Own Clients</h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart
                        data={[
                          {
                            name: 'Avg Job Value',
                            Renoa: renoaPerformance.avgRenoaJobValue,
                            Own: ownClientPerformance.avgOwnJobValue,
                          },
                          {
                            name: 'Total Revenue',
                            Renoa: renoaPerformance.revenue,
                            Own: ownClientPerformance.revenue,
                          },
                        ]}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                        <XAxis dataKey="name" stroke="#71717a" style={{ fontSize: '12px' }} />
                        <YAxis stroke="#71717a" style={{ fontSize: '12px' }} tickFormatter={(value) => `$${value}`} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#18181b',
                            border: '1px solid #27272a',
                            borderRadius: '8px',
                          }}
                          formatter={(value: any) => `$${value}`}
                        />
                        <Legend />
                        <Bar dataKey="Renoa" fill={COLORS.purple} />
                        <Bar dataKey="Own" fill={COLORS.blue} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Performance Metrics Grid */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 md:p-6">
            <h2 className="text-base md:text-xl font-bold text-zinc-100 mb-3 md:mb-6 flex items-center gap-2">
              <Activity className="h-4 w-4 md:h-5 md:w-5 text-emerald-400" />
              Performance Metrics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              <div className="text-center relative group">
                <div className="text-2xl md:text-4xl font-bold text-emerald-400 mb-1 md:mb-2">
                  {performanceMetrics.conversionRate}%
                </div>
                <div className="flex items-center justify-center gap-1.5 md:gap-2 mb-1">
                  <Target className="h-3.5 w-3.5 md:h-4 md:w-4 text-zinc-500" />
                  <p className="text-xs md:text-sm font-medium text-zinc-300">Job Completion Rate</p>
                  <div className="relative hidden md:block">
                    <Info className="h-3 w-3 text-zinc-600 cursor-help" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-[10px] text-zinc-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                      % of scheduled jobs completed successfully
                    </div>
                  </div>
                </div>
                <div className="inline-flex items-center px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs">
                  Excellent
                </div>
              </div>

              <div className="text-center relative group">
                <div className="text-2xl md:text-4xl font-bold text-blue-400 mb-1 md:mb-2">
                  {performanceMetrics.repeatCustomerRate}%
                </div>
                <div className="flex items-center justify-center gap-1.5 md:gap-2 mb-1">
                  <Users className="h-3.5 w-3.5 md:h-4 md:w-4 text-zinc-500" />
                  <p className="text-xs md:text-sm font-medium text-zinc-300">Repeat Customer Rate</p>
                  <div className="relative hidden md:block">
                    <Info className="h-3 w-3 text-zinc-600 cursor-help" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-[10px] text-zinc-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                      % of customers who booked again
                    </div>
                  </div>
                </div>
                <div className="inline-flex items-center px-2 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs">
                  Good
                </div>
              </div>

              <div className="text-center relative group">
                <div className="text-2xl md:text-4xl font-bold text-purple-400 mb-1 md:mb-2">
                  {performanceMetrics.avgJobDuration}h
                </div>
                <div className="flex items-center justify-center gap-1.5 md:gap-2 mb-1">
                  <Clock className="h-3.5 w-3.5 md:h-4 md:w-4 text-zinc-500" />
                  <p className="text-xs md:text-sm font-medium text-zinc-300">Avg Job Duration</p>
                  <div className="relative hidden md:block">
                    <Info className="h-3 w-3 text-zinc-600 cursor-help" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-[10px] text-zinc-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                      Average time to complete a job
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mt-4 md:mt-6 pt-4 md:pt-6 border-t border-zinc-800">
              <div className="text-center relative group">
                <div className="text-2xl md:text-3xl font-bold text-zinc-100 mb-1 md:mb-2">
                  {performanceMetrics.onTimeRate}%
                </div>
                <div className="flex items-center justify-center gap-1.5 md:gap-2">
                  <Calendar className="h-3.5 w-3.5 md:h-4 md:w-4 text-zinc-500" />
                  <p className="text-xs md:text-sm font-medium text-zinc-300">On-Time Completion</p>
                  <div className="relative hidden md:block">
                    <Info className="h-3 w-3 text-zinc-600 cursor-help" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-[10px] text-zinc-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                      % of jobs finished within scheduled time
                    </div>
                  </div>
                </div>
                <div className="inline-flex items-center px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs mt-2">
                  Great
                </div>
              </div>

              <div className="text-center relative group">
                <div className="text-2xl md:text-3xl font-bold text-zinc-100 mb-1 md:mb-2 flex items-center justify-center gap-1">
                  {performanceMetrics.customerSatisfaction}
                  <Star className="h-4 w-4 md:h-5 md:w-5 text-yellow-400 fill-yellow-400" />
                </div>
                <div className="flex items-center justify-center gap-1.5 md:gap-2">
                  <Award className="h-3.5 w-3.5 md:h-4 md:w-4 text-zinc-500" />
                  <p className="text-xs md:text-sm font-medium text-zinc-300">Customer Satisfaction</p>
                  <div className="relative hidden md:block">
                    <Info className="h-3 w-3 text-zinc-600 cursor-help" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-[10px] text-zinc-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                      Average rating from customer reviews
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-6">
            {/* Top Customers */}
            {topCustomers && topCustomers.length > 0 && (
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 md:p-6">
                <h2 className="text-base md:text-xl font-bold text-zinc-100 mb-3 md:mb-6 flex items-center gap-2">
                  <Award className="h-4 w-4 md:h-5 md:w-5 text-yellow-400" />
                  Top Customers
                </h2>
                <div className="space-y-2 md:space-y-3">
                  {topCustomers.slice(0, 5).map((customer: any, index: number) => (
                    <div key={customer.id} className="flex items-center justify-between p-2 md:p-3 bg-zinc-800/30 rounded-lg">
                      <div className="flex items-center gap-2 md:gap-3 min-w-0">
                        <div className="flex items-center justify-center w-7 h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-400 text-white font-bold text-xs md:text-sm flex-shrink-0">
                          #{index + 1}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm md:text-base font-medium text-zinc-100 truncate">{customer.name}</p>
                          <p className="text-xs text-zinc-500">{customer.jobs} jobs</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <p className="text-sm md:text-base font-semibold text-emerald-400">{formatCurrency(customer.revenue)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Seasonal Insights */}
            {seasonalInsights && seasonalInsights.busiestDays && (
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 md:p-6">
                <h2 className="text-base md:text-xl font-bold text-zinc-100 mb-3 md:mb-6 flex items-center gap-2">
                  <Calendar className="h-4 w-4 md:h-5 md:w-5 text-blue-400" />
                  Busiest Days
                </h2>
                <ResponsiveContainer width="100%" height={200} className="md:h-[250px]">
                  <BarChart data={seasonalInsights.busiestDays}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="day" stroke="#71717a" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#71717a" style={{ fontSize: '12px' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#18181b',
                        border: '1px solid #27272a',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="count" fill={COLORS.blue} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* New vs Returning Customers */}
          {newVsReturning && (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 md:p-6">
              <h2 className="text-base md:text-xl font-bold text-zinc-100 mb-3 md:mb-6 flex items-center gap-2">
                <Users className="h-4 w-4 md:h-5 md:w-5 text-emerald-400" />
                New vs Returning Customers
              </h2>
              <div className="grid grid-cols-2 gap-4 md:gap-6">
                <div className="text-center">
                  <div className="text-3xl md:text-5xl font-bold text-emerald-400 mb-1 md:mb-2">{newVsReturning.new}</div>
                  <p className="text-xs md:text-sm text-zinc-400">New Customers</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl md:text-5xl font-bold text-blue-400 mb-1 md:mb-2">{newVsReturning.returning}</div>
                  <p className="text-xs md:text-sm text-zinc-400">Returning Customers</p>
                </div>
              </div>
              <div className="mt-4 md:mt-6 hidden md:block">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'New', value: newVsReturning.new },
                        { name: 'Returning', value: newVsReturning.returning },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      <Cell fill={COLORS.emerald} />
                      <Cell fill={COLORS.blue} />
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#18181b',
                        border: '1px solid #27272a',
                        borderRadius: '8px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProviderLayout>
  );
}
