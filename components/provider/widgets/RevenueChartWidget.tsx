"use client";

import { ReactNode } from 'react';
import { format } from 'date-fns';
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
  ChevronRight,
  ChevronLeft,
  Briefcase,
  X,
  Activity,
} from 'lucide-react';

interface RevenueDataPoint {
  date: string;
  amount: number | null;
  jobCount?: number;
  avgValue?: number;
  utilization?: number;
  label?: string;
  day?: string;
  displayLabel?: string;
  showTick?: boolean;
}

type ChartMetric = 'revenue' | 'jobs' | 'avgValue' | 'utilization';

const METRIC_CONFIG: Record<ChartMetric, {
  label: string;
  color: string;
  buttonActive: string;
  formatter: (value: number) => string;
  dataKey: string;
}> = {
  revenue: {
    label: 'Revenue',
    color: '#10b981',
    buttonActive: 'border-emerald-500 text-emerald-400 bg-emerald-500/10',
    formatter: (v) => `$${v.toLocaleString()}`,
    dataKey: 'amount',
  },
  jobs: {
    label: 'Jobs Completed',
    color: '#3b82f6',
    buttonActive: 'border-blue-500 text-blue-400 bg-blue-500/10',
    formatter: (v) => String(v),
    dataKey: 'jobCount',
  },
  avgValue: {
    label: 'Avg Job Value',
    color: '#8b5cf6',
    buttonActive: 'border-purple-500 text-purple-400 bg-purple-500/10',
    formatter: (v) => `$${v.toLocaleString()}`,
    dataKey: 'avgValue',
  },
  utilization: {
    label: 'Utilization Rate',
    color: '#f97316',
    buttonActive: 'border-orange-500 text-orange-400 bg-orange-500/10',
    formatter: (v) => `${v}%`,
    dataKey: 'utilization',
  },
};

// Custom tooltip component
function CustomTooltip({
  active,
  payload,
  metric,
  metricColor,
}: {
  active?: boolean;
  payload?: Array<{ value: number; payload: RevenueDataPoint }>;
  label?: string;
  metric: ChartMetric;
  metricColor: string;
}) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const value = payload[0].value;
    const config = METRIC_CONFIG[metric];
    const hasValue = value > 0;

    return (
      <div className="bg-card border border-border rounded-xl shadow-lg px-4 py-3 min-w-[140px]">
        <p className="text-sm font-medium text-foreground mb-1">
          {data.label || data.displayLabel}
          {data.day ? ` (${data.day})` : ''}
        </p>
        <p className="text-2xl font-bold" style={{ color: hasValue ? metricColor : '#6b7280' }}>
          {hasValue ? config.formatter(value) : 'No data'}
        </p>
      </div>
    );
  }
  return null;
}

interface RevenueChartWidgetProps {
  chartData: RevenueDataPoint[];
  chartMetric: ChartMetric;
  setChartMetric: (metric: ChartMetric) => void;
  currentMetricTotal: number;
  viewMode: 'week' | 'month';
  setViewMode: (mode: 'week' | 'month') => void;
  dateLabel: string;
  canGoNext: boolean;
  handlePrev: () => void;
  handleNext: () => void;
  handleGraphClick: (data: RevenueDataPoint) => void;
  setCurrentDate: (date: Date) => void;
  // Date breakdown
  selectedDate: string | null;
  dateBreakdown: {
    jobs: { id: string; serviceType: string; customerName: string; amount: number | null }[];
  } | null;
  loadingBreakdown: boolean;
  setSelectedDate: (date: string | null) => void;
  setDateBreakdown: (breakdown: any) => void;
  formatCurrency: (amount: number) => string;
  breakdownRef: React.RefObject<HTMLDivElement>;
  onBreakdownJobClick?: (job: any) => void;
}

export default function RevenueChartWidget({
  chartData,
  chartMetric,
  setChartMetric,
  currentMetricTotal,
  viewMode,
  setViewMode,
  dateLabel,
  canGoNext,
  handlePrev,
  handleNext,
  handleGraphClick,
  setCurrentDate,
  selectedDate,
  dateBreakdown,
  loadingBreakdown,
  setSelectedDate,
  setDateBreakdown,
  formatCurrency,
  breakdownRef,
  onBreakdownJobClick,
}: RevenueChartWidgetProps) {
  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm p-5 overflow-hidden h-full flex flex-col">
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
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all border ${
                  chartMetric === metric
                    ? METRIC_CONFIG[metric].buttonActive
                    : 'border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground bg-transparent'
                }`}
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
      <div className="flex-1 min-h-[200px]">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
              onClick={(data) => {
                const payload = (data as { activePayload?: Array<{ payload: RevenueDataPoint }> })?.activePayload?.[0]?.payload;
                if (payload) handleGraphClick(payload);
              }}
              style={{ cursor: 'pointer' }}
            >
              <defs>
                <linearGradient id="colorMetricWidget" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={METRIC_CONFIG[chartMetric].color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={METRIC_CONFIG[chartMetric].color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.06} vertical={false} />
              <XAxis
                dataKey="displayLabel"
                stroke="#6b7280"
                strokeOpacity={0.3}
                tickLine={false}
                axisLine={false}
                interval={0}
                tick={(props: { x: number; y: number; payload: { value: string; index: number } }) => {
                  if (viewMode === 'month') {
                    const dataPoint = chartData[props.payload.index];
                    if (dataPoint && !dataPoint.showTick) {
                      return <g />;
                    }
                  }
                  return (
                    <text
                      x={props.x}
                      y={props.y + 12}
                      textAnchor="middle"
                      fill="#6b7280"
                      fontSize={11}
                    >
                      {props.payload.value}
                    </text>
                  );
                }}
              />
              <YAxis
                domain={[0, 'auto']}
                stroke="#6b7280"
                strokeOpacity={0.3}
                tick={{ fill: '#6b7280', fontSize: 11 }}
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
                  />
                }
              />
              <Area
                type="monotoneX"
                dataKey={METRIC_CONFIG[chartMetric].dataKey}
                stroke={METRIC_CONFIG[chartMetric].color}
                strokeWidth={2.5}
                fill="url(#colorMetricWidget)"
                fillOpacity={0.2}
                isAnimationActive={false}
                dot={(props: { cx?: number; cy?: number; payload?: RevenueDataPoint; index?: number }) => {
                  const dataKey = METRIC_CONFIG[chartMetric].dataKey as keyof RevenueDataPoint;
                  const val = props.payload?.[dataKey];
                  if (val === null || val === undefined || val === 0) {
                    return <g key={props.index} />;
                  }
                  return (
                    <circle
                      key={props.index}
                      cx={props.cx}
                      cy={props.cy}
                      r={4}
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
                    onClick={() => onBreakdownJobClick?.(job)}
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
  );
}
