'use client';

import { format } from 'date-fns';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Job {
  id: string;
  serviceType: string;
  customerName: string;
  startTime: Date;
  endTime: Date;
  status: string;
}

interface DayData {
  date: Date;
  hours: number;
  utilization: number;
  jobCount: number;
  jobs: Job[];
  conflicts: Array<{ jobA: string; jobB: string }>;
  isOffDay: boolean;
}

interface Worker {
  id: string;
  firstName: string;
  color: string;
}

interface WeeklyDayCellProps {
  worker: Worker;
  day: Date;
  data?: DayData;
  expanded: boolean;
  onJobClick?: (jobId: string) => void;
  onDayClick?: () => void;
}

export default function WeeklyDayCell({
  worker,
  day,
  data,
  expanded,
  onJobClick,
  onDayClick,
}: WeeklyDayCellProps) {
  // Day off or no data
  if (!data || data.isOffDay) {
    return (
      <div
        className="p-3 text-center border-l border-zinc-800 bg-zinc-800/30 cursor-pointer hover:bg-zinc-800/50 transition-colors"
        onClick={onDayClick}
      >
        <div className="text-sm text-zinc-600">Day Off</div>
      </div>
    );
  }

  // Capacity colors
  const capacityBg =
    data.utilization >= 90
      ? 'bg-red-500/10'
      : data.utilization >= 70
        ? 'bg-yellow-500/10'
        : data.utilization > 0
          ? 'bg-emerald-500/10'
          : 'bg-zinc-800/30';

  const capacityDot =
    data.utilization >= 90
      ? 'bg-red-500'
      : data.utilization >= 70
        ? 'bg-yellow-500'
        : 'bg-emerald-500';

  const capacityText =
    data.utilization >= 90
      ? 'text-red-400'
      : data.utilization >= 70
        ? 'text-yellow-400'
        : 'text-emerald-400';

  return (
    <div
      className={cn(
        'p-3 border-l border-zinc-800 cursor-pointer transition-colors hover:brightness-110',
        capacityBg
      )}
      onClick={onDayClick}
    >
      {/* Capacity badge */}
      <div className="flex items-center justify-center gap-1.5 mb-2">
        <div className={cn('w-2 h-2 rounded-full', capacityDot)} />
        <span className={cn('text-sm font-semibold', capacityText)}>
          {data.utilization}%
        </span>
      </div>

      {/* Hours and job count */}
      <div className="text-center space-y-0.5">
        <div className="text-xs text-zinc-400">{data.hours.toFixed(1)}h</div>
        <div className="text-xs font-medium text-zinc-300">
          {data.jobCount} job{data.jobCount !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Job pills (when not expanded) */}
      {!expanded && data.jobs && data.jobs.length > 0 && (
        <div className="mt-2 space-y-1">
          {data.jobs.slice(0, 2).map((job) => (
            <div
              key={job.id}
              onClick={(e) => {
                e.stopPropagation();
                onJobClick?.(job.id);
              }}
              className="p-1.5 rounded text-xs bg-zinc-800/80 hover:bg-zinc-700 transition-colors truncate"
              style={{ borderLeft: `2px solid ${worker.color}` }}
            >
              <div className="font-medium text-zinc-200 truncate">
                {job.serviceType}
              </div>
            </div>
          ))}
          {data.jobs.length > 2 && (
            <div className="text-xs text-center text-zinc-500">
              +{data.jobs.length - 2} more
            </div>
          )}
        </div>
      )}

      {/* Conflict warning */}
      {data.conflicts && data.conflicts.length > 0 && (
        <div className="mt-2 flex items-center justify-center gap-1 text-red-400">
          <AlertCircle className="w-3.5 h-3.5" />
          <span className="text-xs">{data.conflicts.length} conflict</span>
        </div>
      )}
    </div>
  );
}
