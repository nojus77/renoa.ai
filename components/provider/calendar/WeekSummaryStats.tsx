'use client';

import { useState } from 'react';
import {
  Calendar,
  Clock,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WeekStats, WeeklyWorker } from './WeeklyTeamCalendar';

interface WeekSummaryStatsProps {
  stats: WeekStats;
  workers: WeeklyWorker[];
}

export default function WeekSummaryStats({ stats, workers }: WeekSummaryStatsProps) {
  const [expanded, setExpanded] = useState(false);

  // Calculate worker breakdowns
  const overbookedWorkerNames = workers
    .filter(w => stats.overbookedWorkers.includes(w.id))
    .map(w => w.firstName);

  const topPerformers = [...workers]
    .sort((a, b) => b.weeklyStats.jobCount - a.weeklyStats.jobCount)
    .slice(0, 3);

  const lowUtilization = workers.filter(w => w.weeklyStats.utilization < 40);

  return (
    <div className="flex-shrink-0 border-t border-zinc-800 bg-zinc-900/80 backdrop-blur-sm">
      {/* Summary Bar */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-zinc-800/50 transition-colors"
      >
        <div className="flex items-center gap-6 text-sm">
          {/* Total Jobs */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-zinc-500" />
            <span className="font-medium text-zinc-200">{stats.totalJobs}</span>
            <span className="text-zinc-500">jobs</span>
            <span className="text-zinc-600">
              ({stats.assignedJobs} assigned, {stats.unassignedJobs} pending)
            </span>
          </div>

          {/* Hours */}
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-zinc-500" />
            <span className="font-medium text-zinc-200">{stats.totalHours}h</span>
            <span className="text-zinc-500">/ {stats.totalCapacity}h capacity</span>
          </div>

          {/* Average Utilization */}
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-zinc-500" />
            <span
              className={cn(
                'font-medium',
                stats.avgUtilization >= 70 ? 'text-emerald-400' :
                  stats.avgUtilization >= 40 ? 'text-yellow-400' : 'text-zinc-400'
              )}
            >
              {stats.avgUtilization}%
            </span>
            <span className="text-zinc-500">avg utilization</span>
          </div>

          {/* Alerts */}
          {(stats.conflictCount > 0 || stats.overbookedWorkers.length > 0) && (
            <div className="flex items-center gap-3">
              {stats.conflictCount > 0 && (
                <div className="flex items-center gap-1.5 text-red-400">
                  <AlertTriangle className="h-4 w-4" />
                  <span>{stats.conflictCount} conflicts</span>
                </div>
              )}
              {stats.overbookedWorkers.length > 0 && (
                <div className="flex items-center gap-1.5 text-yellow-400">
                  <AlertTriangle className="h-4 w-4" />
                  <span>{stats.overbookedWorkers.length} overbooked</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-zinc-400">
          <BarChart3 className="h-4 w-4" />
          <span className="text-xs">Details</span>
          {expanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronUp className="h-4 w-4" />
          )}
        </div>
      </button>

      {/* Expanded Details */}
      {expanded && (
        <div className="px-4 pb-4 grid grid-cols-4 gap-4">
          {/* Jobs Breakdown */}
          <div className="bg-zinc-800/50 rounded-lg p-3">
            <h4 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">
              Jobs Breakdown
            </h4>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-400">Total</span>
                <span className="font-medium text-zinc-200">{stats.totalJobs}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle className="h-3 w-3" />
                  Assigned
                </span>
                <span className="font-medium text-emerald-400">{stats.assignedJobs}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-yellow-400">
                  <AlertTriangle className="h-3 w-3" />
                  Unassigned
                </span>
                <span className="font-medium text-yellow-400">{stats.unassignedJobs}</span>
              </div>
            </div>
          </div>

          {/* Capacity */}
          <div className="bg-zinc-800/50 rounded-lg p-3">
            <h4 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">
              Capacity
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-400">Scheduled</span>
                <span className="font-medium text-zinc-200">{stats.totalHours}h</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-400">Available</span>
                <span className="font-medium text-zinc-200">{stats.totalCapacity}h</span>
              </div>
              {/* Progress bar */}
              <div className="h-2 bg-zinc-700 rounded-full overflow-hidden mt-1">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    stats.avgUtilization >= 80 ? 'bg-red-500' :
                      stats.avgUtilization >= 60 ? 'bg-yellow-500' : 'bg-emerald-500'
                  )}
                  style={{ width: `${Math.min(100, stats.avgUtilization)}%` }}
                />
              </div>
              <div className="text-xs text-zinc-500 text-center">
                {stats.avgUtilization}% utilized
              </div>
            </div>
          </div>

          {/* Top Workers */}
          <div className="bg-zinc-800/50 rounded-lg p-3">
            <h4 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">
              Top Workers
            </h4>
            <div className="space-y-1.5">
              {topPerformers.map((worker, idx) => (
                <div key={worker.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-500">{idx + 1}.</span>
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: worker.color }}
                    />
                    <span className="text-zinc-300">{worker.firstName}</span>
                  </div>
                  <span className="text-zinc-400">
                    {worker.weeklyStats.jobCount} jobs
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Issues */}
          <div className="bg-zinc-800/50 rounded-lg p-3">
            <h4 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">
              Issues
            </h4>
            <div className="space-y-1.5">
              {stats.conflictCount > 0 && (
                <div className="flex items-center gap-2 text-sm text-red-400">
                  <AlertTriangle className="h-3 w-3" />
                  <span>{stats.conflictCount} scheduling conflicts</span>
                </div>
              )}
              {overbookedWorkerNames.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-yellow-400">
                  <AlertTriangle className="h-3 w-3" />
                  <span>{overbookedWorkerNames.join(', ')} overbooked</span>
                </div>
              )}
              {lowUtilization.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                  <Users className="h-3 w-3" />
                  <span>{lowUtilization.length} workers under 40%</span>
                </div>
              )}
              {stats.conflictCount === 0 &&
               overbookedWorkerNames.length === 0 &&
               lowUtilization.length === 0 && (
                <div className="flex items-center gap-2 text-sm text-emerald-400">
                  <CheckCircle className="h-3 w-3" />
                  <span>No issues detected</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
