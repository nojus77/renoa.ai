'use client';

import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import {
  AlertTriangle,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  TrendingDown,
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
}

function StatCard({
  label,
  value,
  subtitle,
  variant = 'neutral',
  icon: Icon,
}: {
  label: string;
  value: string | number;
  subtitle?: string;
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
      </div>
      <div className="text-2xl font-bold">{value}</div>
      {subtitle && <div className="text-xs opacity-60 mt-0.5">{subtitle}</div>}
    </div>
  );
}

export default function WeekHeader({ stats, problems = [] }: WeekHeaderProps) {
  const capacityColor =
    stats.avgCapacity > 90
      ? 'text-red-400'
      : stats.avgCapacity > 70
        ? 'text-yellow-400'
        : 'text-emerald-400';

  const weekRange = `${format(stats.weekStart, 'MMM d')} - ${format(stats.weekEnd, 'MMM d, yyyy')}`;

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-zinc-100">Week of {weekRange}</h2>
            <p className="text-zinc-400 mt-1">
              {stats.totalJobs} jobs scheduled across {stats.activeWorkers} workers
            </p>
          </div>

          {/* Average capacity badge */}
          <div className="text-center">
            <div className={cn('text-4xl font-bold', capacityColor)}>
              {stats.avgCapacity}%
            </div>
            <div className="text-sm text-zinc-500">Avg Capacity</div>
          </div>
        </div>

        {/* Quick stats bar - 5 cards */}
        <div className="grid grid-cols-5 gap-4">
          <StatCard
            label="Total Hours"
            value={`${stats.totalHours}h`}
            subtitle={`of ${stats.totalCapacity}h capacity`}
            icon={Clock}
          />
          <StatCard
            label="Unassigned"
            value={stats.unassignedJobs}
            subtitle="jobs need workers"
            variant={stats.unassignedJobs > 0 ? 'warning' : 'success'}
            icon={stats.unassignedJobs > 0 ? AlertTriangle : CheckCircle}
          />
          <StatCard
            label="Conflicts"
            value={stats.conflicts}
            subtitle="scheduling conflicts"
            variant={stats.conflicts > 0 ? 'danger' : 'success'}
            icon={stats.conflicts > 0 ? XCircle : CheckCircle}
          />
          <StatCard
            label="Overbooked"
            value={stats.overbookedDays}
            subtitle="worker-days >90%"
            variant={stats.overbookedDays > 0 ? 'danger' : 'neutral'}
            icon={Users}
          />
          <StatCard
            label="Underutilized"
            value={stats.underutilizedDays}
            subtitle="worker-days <40%"
            variant={stats.underutilizedDays > 0 ? 'warning' : 'neutral'}
            icon={TrendingDown}
          />
        </div>
      </CardContent>
    </Card>
  );
}
