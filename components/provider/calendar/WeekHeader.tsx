'use client';

import { format, isThisWeek } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import {
  AlertTriangle,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  TrendingDown,
  Info,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface WeekStats {
  weekStart: Date;
  weekEnd: Date;
  totalJobs: number;
  totalHours: number;
  totalCapacity: number;
  avgCapacity: number;
  activeWorkers: number;
  unassignedJobs: number;
  conflicts: number;
  overbookedDays: number;
  underutilizedDays: number;
}

interface Problem {
  type: string;
  message: string;
  severity: 'warning' | 'error';
}

interface WeekHeaderProps {
  stats: WeekStats;
  problems?: Problem[];
  onPreviousWeek?: () => void;
  onNextWeek?: () => void;
  onCurrentWeek?: () => void;
  onDateClick?: () => void;
}

function StatCard({
  label,
  value,
  tooltip,
  variant = 'neutral',
  icon: Icon,
}: {
  label: string;
  value: string | number;
  tooltip?: string;
  variant?: 'success' | 'warning' | 'danger' | 'neutral';
  icon?: React.ElementType;
}) {
  const variantStyles = {
    success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    warning: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
    danger: 'bg-red-500/10 border-red-500/30 text-red-400',
    neutral: 'bg-zinc-800 border-zinc-700 text-zinc-300',
  };

  return (
    <div className={cn('rounded-lg border p-3', variantStyles[variant])}>
      <div className="flex items-center gap-2 mb-1">
        {Icon && <Icon className="h-4 w-4 opacity-70" />}
        <span className="text-xs font-medium opacity-70">{label}</span>
        {tooltip && (
          <div className="relative group">
            <Info className="h-3 w-3 opacity-50 cursor-help" />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs bg-zinc-800 border border-zinc-700 rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              {tooltip}
            </div>
          </div>
        )}
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

export default function WeekHeader({
  stats,
  onPreviousWeek,
  onNextWeek,
  onCurrentWeek,
  onDateClick,
}: WeekHeaderProps) {
  const isCurrentWeek = isThisWeek(stats.weekStart, { weekStartsOn: 1 });

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardContent className="p-4">
        {/* Title Row with Date Navigation - Same as Daily View */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <button
                onClick={onPreviousWeek}
                className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h2
                onClick={onDateClick}
                className="text-xl font-bold text-zinc-100 cursor-pointer hover:text-zinc-300 transition-colors"
              >
                {format(stats.weekStart, 'MMM d')} - {format(stats.weekEnd, 'MMM d, yyyy')}
              </h2>
              <button
                onClick={onNextWeek}
                className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              {!isCurrentWeek && (
                <button
                  onClick={onCurrentWeek}
                  className="ml-2 px-2 py-1 text-xs font-medium text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded transition-colors"
                >
                  This Week
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Quick stats bar - 5 cards */}
        <div className="grid grid-cols-5 gap-3">
          <StatCard
            label="Total Hours"
            value={`${stats.totalHours}h`}
            tooltip={`${stats.totalHours}h scheduled of ${stats.totalCapacity}h total capacity`}
            icon={Clock}
          />
          <StatCard
            label="Unassigned"
            value={stats.unassignedJobs}
            tooltip="Jobs that haven't been assigned to a worker yet"
            variant={stats.unassignedJobs > 0 ? 'warning' : 'success'}
            icon={stats.unassignedJobs > 0 ? AlertTriangle : CheckCircle}
          />
          <StatCard
            label="Conflicts"
            value={stats.conflicts}
            tooltip="Overlapping jobs scheduled for the same worker"
            variant={stats.conflicts > 0 ? 'danger' : 'success'}
            icon={stats.conflicts > 0 ? XCircle : CheckCircle}
          />
          <StatCard
            label="Overbooked"
            value={stats.overbookedDays}
            tooltip="Worker-days with more than 90% capacity filled"
            variant={stats.overbookedDays > 0 ? 'danger' : 'neutral'}
            icon={Users}
          />
          <StatCard
            label="Underutilized"
            value={stats.underutilizedDays}
            tooltip="Worker-days with less than 40% capacity filled"
            variant={stats.underutilizedDays > 0 ? 'warning' : 'neutral'}
            icon={TrendingDown}
          />
        </div>
      </CardContent>
    </Card>
  );
}
