'use client';

import { format, parseISO, isToday, isTomorrow, isThisWeek } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Clock,
  MapPin,
  AlertTriangle,
  Calendar,
  GripVertical,
  Sparkles,
  CheckCircle,
} from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';

export interface UnassignedJob {
  id: string;
  serviceType: string;
  customerName: string;
  customerAddress: string;
  startTime: string;
  endTime: string;
  duration: number;
  estimatedValue: number | null;
}

interface UnassignedJobsPanelProps {
  jobs: UnassignedJob[];
  onJobClick?: (jobId: string) => void;
  onAutoAssign?: () => void;
  isAutoAssigning?: boolean;
  isLoading?: boolean;
}

export default function UnassignedJobsPanel({
  jobs,
  onJobClick,
  onAutoAssign,
  isAutoAssigning = false,
  isLoading = false,
}: UnassignedJobsPanelProps) {
  // Sort jobs by urgency (today first, then tomorrow, then this week, then later)
  const sortedJobs = [...jobs].sort((a, b) => {
    const dateA = new Date(a.startTime);
    const dateB = new Date(b.startTime);
    return dateA.getTime() - dateB.getTime();
  });

  // Group by urgency
  const todayJobs = sortedJobs.filter((j) => isToday(new Date(j.startTime)));
  const tomorrowJobs = sortedJobs.filter((j) => isTomorrow(new Date(j.startTime)));
  const thisWeekJobs = sortedJobs.filter(
    (j) =>
      isThisWeek(new Date(j.startTime)) &&
      !isToday(new Date(j.startTime)) &&
      !isTomorrow(new Date(j.startTime))
  );
  const laterJobs = sortedJobs.filter((j) => !isThisWeek(new Date(j.startTime)));

  const totalValue = jobs.reduce((sum, j) => sum + (j.estimatedValue || 0), 0);

  return (
    <div className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-orange-400" />
          <span className="font-semibold text-zinc-100">Unassigned</span>
          <Badge variant="outline" className="text-orange-400 border-orange-400/30 ml-auto">
            {jobs.length}
          </Badge>
        </div>
        {totalValue > 0 && (
          <div className="mt-1">
            <Badge variant="outline" className="text-emerald-400 border-emerald-400/30">
              ${totalValue.toLocaleString()} total
            </Badge>
          </div>
        )}
      </div>

      {/* Helper text */}
      <div className="px-4 py-2 border-b border-zinc-800/50 bg-zinc-900/30">
        <p className="text-xs text-zinc-500">Drag jobs to worker rows to assign</p>
      </div>

      {/* Job list - scrollable */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {isLoading ? (
          // Loading skeleton
          <>
            <div className="space-y-2">
              <div className="h-4 w-16 bg-zinc-700 rounded animate-pulse" />
              <div className="h-20 bg-zinc-800 rounded animate-pulse" />
              <div className="h-20 bg-zinc-800 rounded animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-20 bg-zinc-700 rounded animate-pulse" />
              <div className="h-20 bg-zinc-800 rounded animate-pulse" />
            </div>
          </>
        ) : jobs.length === 0 ? (
          // Empty state
          <div className="text-center py-12">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 text-emerald-500" />
            <p className="font-medium text-zinc-200">All jobs assigned!</p>
            <p className="text-sm text-zinc-500 mt-1">This week is fully scheduled</p>
          </div>
        ) : (
          <>
            {/* Today - Urgent */}
            {todayJobs.length > 0 && (
              <JobGroup label="Today" jobs={todayJobs} urgency="urgent" onJobClick={onJobClick} />
            )}

            {/* Tomorrow */}
            {tomorrowJobs.length > 0 && (
              <JobGroup
                label="Tomorrow"
                jobs={tomorrowJobs}
                urgency="soon"
                onJobClick={onJobClick}
              />
            )}

            {/* This Week */}
            {thisWeekJobs.length > 0 && (
              <JobGroup
                label="This Week"
                jobs={thisWeekJobs}
                urgency="normal"
                onJobClick={onJobClick}
              />
            )}

            {/* Later */}
            {laterJobs.length > 0 && (
              <JobGroup label="Later" jobs={laterJobs} urgency="normal" onJobClick={onJobClick} />
            )}
          </>
        )}
      </div>

      {/* Auto-assign button at bottom - always show but disable when no jobs */}
      {onAutoAssign && (
        <div className="p-3 border-t border-zinc-800">
          <Button
            onClick={onAutoAssign}
            disabled={isAutoAssigning || jobs.length === 0 || isLoading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {isAutoAssigning ? 'Assigning...' : 'Auto-Assign All'}
          </Button>
        </div>
      )}
    </div>
  );
}

// Job Group component
interface JobGroupProps {
  label: string;
  jobs: UnassignedJob[];
  urgency: 'urgent' | 'soon' | 'normal';
  onJobClick?: (jobId: string) => void;
}

function JobGroup({ label, jobs, urgency, onJobClick }: JobGroupProps) {
  const urgencyStyles = {
    urgent: 'text-red-400 border-red-500/30 bg-red-500/10',
    soon: 'text-orange-400 border-orange-500/30 bg-orange-500/10',
    normal: 'text-zinc-400 border-zinc-700 bg-zinc-800/30',
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span
          className={cn(
            'text-xs font-medium px-2 py-0.5 rounded border',
            urgencyStyles[urgency]
          )}
        >
          {label}
        </span>
        <span className="text-xs text-zinc-500">{jobs.length}</span>
      </div>
      <div className="space-y-2">
        {jobs.map((job) => (
          <DraggableJobCard key={job.id} job={job} urgency={urgency} onClick={onJobClick} />
        ))}
      </div>
    </div>
  );
}

// Draggable Job Card - compact for sidebar
interface DraggableJobCardProps {
  job: UnassignedJob;
  urgency: 'urgent' | 'soon' | 'normal';
  onClick?: (jobId: string) => void;
}

function DraggableJobCard({ job, urgency, onClick }: DraggableJobCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `unassigned-weekly-${job.id}`,
    data: {
      type: 'weekly-job',
      job: {
        ...job,
        startTime: format(parseISO(job.startTime), 'HH:mm'),
        endTime: format(parseISO(job.endTime), 'HH:mm'),
      },
      workerId: null,
      date: format(parseISO(job.startTime), 'yyyy-MM-dd'),
      source: 'unassigned-panel',
    },
  });

  const borderColor =
    urgency === 'urgent'
      ? 'border-l-red-500'
      : urgency === 'soon'
        ? 'border-l-orange-500'
        : 'border-l-zinc-600';

  const startDate = parseISO(job.startTime);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'p-2.5 bg-zinc-800/50 rounded-lg border-l-4 cursor-grab transition-all group',
        borderColor,
        isDragging ? 'opacity-50 cursor-grabbing' : 'hover:bg-zinc-800'
      )}
      onClick={() => onClick?.(job.id)}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <GripVertical className="h-3 w-3 text-zinc-500 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="font-medium text-sm text-zinc-200 truncate">{job.serviceType}</span>
          </div>
          <p className="text-xs text-zinc-400 truncate mt-0.5">{job.customerName}</p>
        </div>
        {job.estimatedValue && (
          <span className="text-xs font-medium text-emerald-400">${job.estimatedValue}</span>
        )}
      </div>

      <div className="mt-1.5 flex items-center gap-3 text-xs text-zinc-500">
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          <span>{format(startDate, 'EEE d')}</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>{format(startDate, 'h:mm a')}</span>
        </div>
      </div>
    </div>
  );
}
