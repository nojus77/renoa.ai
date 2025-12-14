'use client';

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Clock, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WeeklyJob } from './WeeklyTeamCalendar';

interface JobPillProps {
  job: WeeklyJob;
  workerId: string;
  date: string;
  color: string;
  onClick?: () => void;
}

// Service type icons
const getServiceIcon = (serviceType: string) => {
  const type = serviceType.toLowerCase();
  if (type.includes('mow') || type.includes('lawn')) return '🏡';
  if (type.includes('tree') || type.includes('trim')) return '🌳';
  if (type.includes('mulch') || type.includes('bed')) return '🌱';
  if (type.includes('irrigation') || type.includes('water')) return '💧';
  if (type.includes('landscape') || type.includes('install')) return '🏗️';
  if (type.includes('clean') || type.includes('leaf')) return '🍂';
  if (type.includes('snow') || type.includes('plow')) return '❄️';
  if (type.includes('fertiliz')) return '🧪';
  return '📋';
};

export default function JobPill({ job, workerId, date, color, onClick }: JobPillProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `weekly-job-${job.id}`,
    data: {
      type: 'weekly-job',
      job,
      workerId,
      date,
    },
  });

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
      }
    : undefined;

  const icon = getServiceIcon(job.serviceType);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        'rounded-md px-2 py-1.5 cursor-grab active:cursor-grabbing transition-all',
        'hover:scale-[1.02] hover:shadow-md',
        isDragging && 'opacity-50 scale-105 shadow-lg z-50'
      )}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      onPointerDown={(e) => {
        // Prevent triggering parent onClick
        e.stopPropagation();
      }}
      title={`${job.serviceType} - ${job.customerName}\n${job.startTime} - ${job.endTime}`}
    >
      <div
        className="rounded-md px-2 py-1.5 border relative overflow-hidden"
        style={{
          backgroundColor: `${color}15`,
          borderColor: `${color}40`,
        }}
      >
        {/* Crew color indicator bar */}
        {job.crewColor && (
          <div
            className="absolute left-0 top-0 bottom-0 w-1"
            style={{ backgroundColor: job.crewColor }}
            title={`Crew: ${job.crewName}`}
          />
        )}

        {/* Service Type with Icon */}
        <div className={cn(
          "flex items-center gap-1 text-xs font-medium text-zinc-200 truncate",
          job.crewColor && "pl-1.5"
        )}>
          <span>{icon}</span>
          <span className="truncate">{job.serviceType}</span>
        </div>

        {/* Customer + Duration */}
        <div className={cn(
          "flex items-center justify-between gap-1 text-xs text-zinc-400 mt-0.5",
          job.crewColor && "pl-1.5"
        )}>
          <span className="truncate">{job.customerName}</span>
          <span className="flex-shrink-0">({job.duration}h)</span>
        </div>

        {/* Time and Crew info */}
        <div className={cn(
          "flex items-center justify-between gap-1 text-xs text-zinc-500 mt-0.5",
          job.crewColor && "pl-1.5"
        )}>
          <div className="flex items-center gap-1">
            <Clock className="h-2.5 w-2.5" />
            <span>{job.startTime}</span>
          </div>
          {job.crewName && (
            <div className="flex items-center gap-0.5" title={`Crew: ${job.crewName}`}>
              <Users className="h-2.5 w-2.5" style={{ color: job.crewColor || undefined }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
