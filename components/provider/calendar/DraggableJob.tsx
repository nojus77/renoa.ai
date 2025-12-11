'use client';

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import type { CalendarJob, UnassignedJob } from './DailyTeamCalendar';

interface DraggableJobProps {
  job: CalendarJob | UnassignedJob;
  children: React.ReactNode;
  disabled?: boolean;
}

export default function DraggableJob({ job, children, disabled = false }: DraggableJobProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `job-${job.id}`,
    data: {
      type: 'job',
      job,
    },
    disabled,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        'touch-none',
        isDragging && 'opacity-50 z-50',
        !disabled && 'cursor-grab active:cursor-grabbing'
      )}
    >
      {children}
    </div>
  );
}
