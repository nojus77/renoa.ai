'use client';

import { useMemo, useEffect, useState } from 'react';
import { format } from 'date-fns';
import { User, AlertTriangle, CheckCircle, Clock, MapPin, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatInProviderTz } from '@/lib/utils/timezone';
import DroppableTimeslot from './DroppableTimeslot';
import DraggableJob from './DraggableJob';
import type { CalendarWorker, CalendarJob } from './DailyTeamCalendar';

interface WorkerColumnProps {
  worker: CalendarWorker;
  timeSlots: string[];
  slotHeight: number;
  startHour: number;
  endHour: number;
  onJobClick?: (jobId: string) => void;
  showCurrentTime?: boolean;
  isDragging?: boolean;
}

// Capacity status colors
const getCapacityStatus = (percentage: number) => {
  if (percentage <= 60) return { color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: '🟢' };
  if (percentage <= 90) return { color: 'text-yellow-400', bg: 'bg-yellow-500/10', icon: '🟡' };
  return { color: 'text-red-400', bg: 'bg-red-500/10', icon: '🔴' };
};

// Job status styles
const getJobStatusStyle = (status: string) => {
  switch (status) {
    case 'dispatched':
      return 'border-dashed border-2';
    case 'in_progress':
      return 'border-2 border-emerald-500 ring-2 ring-emerald-500/30';
    case 'completed':
      return 'opacity-60';
    default:
      return 'border';
  }
};

export default function WorkerColumn({
  worker,
  timeSlots,
  slotHeight,
  startHour,
  endHour,
  onJobClick,
  showCurrentTime = false,
  isDragging = false,
}: WorkerColumnProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute
  useEffect(() => {
    if (!showCurrentTime) return;
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, [showCurrentTime]);

  const capacityStatus = getCapacityStatus(worker.capacity.percentage);

  // Calculate job positions
  const jobPositions = useMemo(() => {
    return worker.jobs.map(job => {
      const jobStartHour = job.startTime.getHours() + job.startTime.getMinutes() / 60;
      const jobEndHour = job.endTime.getHours() + job.endTime.getMinutes() / 60;

      // Clamp to calendar bounds
      const clampedStart = Math.max(jobStartHour, startHour);
      const clampedEnd = Math.min(jobEndHour, endHour);

      const top = (clampedStart - startHour) * slotHeight;
      const height = (clampedEnd - clampedStart) * slotHeight;

      return {
        job,
        top: Math.max(0, top),
        height: Math.max(slotHeight / 2, height), // Minimum height
        hour: Math.floor(jobStartHour),
      };
    });
  }, [worker.jobs, startHour, endHour, slotHeight]);

  // Group jobs by hour for droppable slots
  const jobsByHour = useMemo(() => {
    const map = new Map<number, CalendarJob[]>();
    worker.jobs.forEach(job => {
      const hour = job.startTime.getHours();
      if (!map.has(hour)) map.set(hour, []);
      map.get(hour)!.push(job);
    });
    return map;
  }, [worker.jobs]);

  // Check if job has conflict
  const hasConflict = (jobId: string) => {
    return worker.conflicts.some(c => c.jobA === jobId || c.jobB === jobId);
  };

  // Current time position
  const getCurrentTimePosition = () => {
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    const totalMinutes = (hours - startHour) * 60 + minutes;
    return (totalMinutes / 60) * slotHeight;
  };

  const currentTimePosition = getCurrentTimePosition();
  const isWithinCalendar = currentTimePosition >= 0 && currentTimePosition <= timeSlots.length * slotHeight;

  // Worker color for tinting
  const workerColor = worker.color || '#6b7280';

  return (
    <div
      className={cn(
        'flex-shrink-0 w-48 border-r border-zinc-800 transition-all duration-150',
        isDragging && 'ring-2 ring-emerald-500/50'
      )}
      style={{
        backgroundColor: `${workerColor}05`, // Very subtle tint
      }}
    >
      {/* Worker Header */}
      <div className="sticky top-0 z-10 h-16 px-2 py-2 border-b border-zinc-800 bg-zinc-900/95 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          {/* Avatar */}
          {worker.photo ? (
            <img
              src={worker.photo}
              alt={worker.name}
              className="h-8 w-8 rounded-full object-cover border-2"
              style={{ borderColor: workerColor }}
            />
          ) : (
            <div
              className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium text-white"
              style={{ backgroundColor: workerColor }}
            >
              {worker.firstName[0]}{worker.lastName[0]}
            </div>
          )}

          {/* Name & Stats */}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-zinc-100 truncate">
              {worker.firstName} {worker.lastName[0]}.
            </div>
            <div className={cn('text-xs flex items-center gap-1', capacityStatus.color)}>
              <span>{capacityStatus.icon}</span>
              <span>{worker.capacity.percentage}%</span>
              <span className="text-zinc-500">
                ({worker.capacity.scheduled}/{worker.capacity.total}h)
              </span>
            </div>
          </div>
        </div>

        {/* Job count */}
        <div className="text-xs text-zinc-500 mt-1 pl-10">
          {worker.jobs.length} job{worker.jobs.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Time Grid with Droppable Slots */}
      <div className="relative">
        {timeSlots.map((_, index) => {
          const hour = startHour + index;
          const slotId = `slot-${worker.id}-${hour}`;

          return (
            <DroppableTimeslot
              key={slotId}
              id={slotId}
              workerId={worker.id}
              hour={hour}
              className={cn(
                'border-b border-zinc-800/50',
                index % 2 === 0 ? 'bg-zinc-900/30' : 'bg-transparent'
              )}
            >
              <div style={{ height: `${slotHeight}px` }} />
            </DroppableTimeslot>
          );
        })}

        {/* Current time line */}
        {showCurrentTime && isWithinCalendar && (
          <div
            className="absolute left-0 right-0 h-0.5 bg-red-500 z-20 pointer-events-none"
            style={{ top: `${currentTimePosition}px` }}
          />
        )}

        {/* Job Blocks (Draggable) */}
        {jobPositions.map(({ job, top, height }) => (
          <DraggableJob key={job.id} job={job} disabled={job.status === 'completed'}>
            <JobBlock
              job={job}
              top={top}
              height={height}
              color={workerColor}
              hasConflict={hasConflict(job.id)}
              onClick={() => onJobClick?.(job.id)}
              isDraggable={job.status !== 'completed'}
            />
          </DraggableJob>
        ))}
      </div>
    </div>
  );
}

// Job Block Component
interface JobBlockProps {
  job: CalendarJob;
  top: number;
  height: number;
  color: string;
  hasConflict: boolean;
  onClick?: () => void;
  isDraggable?: boolean;
}

function JobBlock({ job, top, height, color, hasConflict, onClick, isDraggable = true }: JobBlockProps) {
  const statusStyle = getJobStatusStyle(job.status);
  const isCompleted = job.status === 'completed';
  const isInProgress = job.status === 'in_progress';

  return (
    <div
      className={cn(
        'absolute left-1 right-1 rounded-md transition-all duration-150',
        'hover:scale-[1.02] hover:shadow-lg hover:z-10',
        statusStyle,
        hasConflict && 'ring-2 ring-red-500',
        isDraggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
      )}
      style={{
        top: `${top}px`,
        height: `${height}px`,
        backgroundColor: `${color}20`,
        borderColor: hasConflict ? '#ef4444' : color,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
    >
      <div className="p-1.5 h-full overflow-hidden relative">
        {/* Drag handle indicator */}
        {isDraggable && (
          <div className="absolute top-1 right-1 opacity-30 group-hover:opacity-60">
            <GripVertical className="h-3 w-3 text-zinc-400" />
          </div>
        )}

        {/* Conflict warning */}
        {hasConflict && (
          <div className="absolute -top-1 -right-1 bg-red-500 rounded-full p-0.5 z-10">
            <AlertTriangle className="h-3 w-3 text-white" />
          </div>
        )}

        {/* Completed checkmark */}
        {isCompleted && (
          <div className="absolute -top-1 -right-1 bg-emerald-500 rounded-full p-0.5 z-10">
            <CheckCircle className="h-3 w-3 text-white" />
          </div>
        )}

        {/* Service Type */}
        <div
          className={cn(
            'text-xs font-medium truncate pr-4',
            isCompleted ? 'text-zinc-400' : 'text-zinc-100'
          )}
        >
          {job.serviceType}
        </div>

        {/* Customer Name */}
        {height > 40 && (
          <div className="text-xs text-zinc-400 truncate mt-0.5">
            {job.customerName}
          </div>
        )}

        {/* Time */}
        {height > 55 && (
          <div className="flex items-center gap-1 text-xs text-zinc-500 mt-0.5">
            <Clock className="h-3 w-3" />
            <span>
              {formatInProviderTz(job.startTime, 'h:mm a', 'America/Chicago')} - {formatInProviderTz(job.endTime, 'h:mm a', 'America/Chicago')}
            </span>
          </div>
        )}

        {/* Address */}
        {height > 75 && (
          <div className="flex items-center gap-1 text-xs text-zinc-500 mt-0.5 truncate">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{job.address}</span>
          </div>
        )}

        {/* In Progress indicator */}
        {isInProgress && (
          <div className="absolute bottom-1 left-1 right-1">
            <div className="h-1 bg-emerald-500/30 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full animate-pulse w-1/2" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
