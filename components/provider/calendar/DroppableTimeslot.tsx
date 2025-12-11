'use client';

import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';

interface DroppableTimeslotProps {
  id: string;
  workerId: string;
  hour: number;
  children: React.ReactNode;
  className?: string;
}

export default function DroppableTimeslot({
  id,
  workerId,
  hour,
  children,
  className,
}: DroppableTimeslotProps) {
  const { isOver, setNodeRef, active } = useDroppable({
    id,
    data: {
      type: 'worker-timeslot',
      workerId,
      hour,
    },
  });

  // Only show drop indicator when actually dragging a job
  const showDropIndicator = isOver && active?.data?.current?.type === 'job';

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'relative transition-all duration-150',
        showDropIndicator && 'bg-emerald-500/20 ring-2 ring-emerald-500 ring-inset',
        className
      )}
    >
      {children}

      {/* Drop indicator overlay */}
      {showDropIndicator && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="bg-emerald-500 text-white text-xs px-2 py-1 rounded shadow-lg">
            Drop here
          </div>
        </div>
      )}
    </div>
  );
}
