'use client';

import { useDroppable } from '@dnd-kit/core';
import { AlertTriangle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import JobPill from './JobPill';
import type { WorkerDay } from './WeeklyTeamCalendar';

interface DayCellProps {
  workerId: string;
  workerColor: string;
  date: string;
  dayData?: WorkerDay;
  isWeekend: boolean;
  expanded: boolean;
  onJobClick?: (jobId: string) => void;
  onDayClick?: () => void;
}

// Capacity status colors
const getCapacityStyles = (percentage: number) => {
  if (percentage <= 60) return { icon: '🟢', textColor: 'text-emerald-400' };
  if (percentage <= 90) return { icon: '🟡', textColor: 'text-yellow-400' };
  return { icon: '🔴', textColor: 'text-red-400' };
};

export default function DayCell({
  workerId,
  workerColor,
  date,
  dayData,
  isWeekend,
  expanded,
  onJobClick,
  onDayClick,
}: DayCellProps) {
  const { isOver, setNodeRef, active } = useDroppable({
    id: `week-cell-${workerId}-${date}`,
    data: {
      type: 'week-day-cell',
      workerId,
      date,
    },
  });

  const showDropIndicator = isOver && active?.data?.current?.type === 'weekly-job';

  // No data or day off
  if (!dayData || !dayData.isWorkingDay) {
    return (
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 min-w-32 px-2 py-2 border-r border-zinc-800 last:border-r-0 transition-all',
          isWeekend ? 'bg-zinc-800/40' : 'bg-zinc-800/20',
          showDropIndicator && 'ring-2 ring-inset ring-emerald-500 bg-emerald-500/10'
        )}
        onClick={onDayClick}
      >
        <div className="h-full flex items-center justify-center">
          <span className="text-xs text-zinc-600 uppercase">
            {isWeekend ? 'Weekend' : 'Off'}
          </span>
        </div>
      </div>
    );
  }

  const capacityStyles = getCapacityStyles(dayData.utilization);
  const hasConflicts = dayData.conflicts.length > 0;
  const visibleJobs = expanded ? dayData.jobs : dayData.jobs.slice(0, 2);
  const hiddenCount = dayData.jobs.length - visibleJobs.length;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex-1 min-w-32 px-2 py-2 border-r border-zinc-800 last:border-r-0 transition-all cursor-pointer hover:bg-zinc-800/40',
        isWeekend && 'bg-zinc-800/20',
        hasConflicts && 'bg-red-500/5',
        showDropIndicator && 'ring-2 ring-inset ring-emerald-500 bg-emerald-500/10'
      )}
      onClick={onDayClick}
    >
      {/* Capacity Badge */}
      <div className="flex items-center justify-between mb-1.5">
        <div className={cn('flex items-center gap-1 text-xs', capacityStyles.textColor)}>
          <span>{capacityStyles.icon}</span>
          <span className="font-medium">{dayData.utilization}%</span>
        </div>
        {hasConflicts && (
          <AlertTriangle className="h-3 w-3 text-red-400" />
        )}
      </div>

      {/* Hours + Job Count */}
      <div className="flex items-center gap-2 text-xs text-zinc-500 mb-2">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>{dayData.hours}h</span>
        </div>
        <span>•</span>
        <span>{dayData.jobs.length} job{dayData.jobs.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Job Pills */}
      {dayData.jobs.length > 0 ? (
        <div className="space-y-1">
          {visibleJobs.map(job => (
            <JobPill
              key={job.id}
              job={job}
              workerId={workerId}
              date={date}
              color={workerColor}
              onClick={() => onJobClick?.(job.id)}
            />
          ))}
          {hiddenCount > 0 && !expanded && (
            <div className="text-xs text-zinc-500 text-center py-1 hover:text-zinc-400">
              +{hiddenCount} more
            </div>
          )}
        </div>
      ) : (
        <div className="text-xs text-zinc-600 text-center py-2">
          No jobs
        </div>
      )}

      {/* Drop indicator */}
      {showDropIndicator && (
        <div className="mt-2 py-1 text-center text-emerald-400 text-xs font-medium animate-pulse">
          Drop here
        </div>
      )}
    </div>
  );
}
