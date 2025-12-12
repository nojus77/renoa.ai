'use client';

import { format } from 'date-fns';
import { Clock, MapPin, User } from 'lucide-react';
import { formatInProviderTz } from '@/lib/utils/timezone';
import type { CalendarJob, UnassignedJob } from './DailyTeamCalendar';

interface JobDragPreviewProps {
  job: CalendarJob | UnassignedJob;
}

export default function JobDragPreview({ job }: JobDragPreviewProps) {
  const startTime = new Date(job.startTime);
  const endTime = new Date(job.endTime);
  const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);

  return (
    <div className="bg-zinc-900 rounded-lg shadow-2xl p-3 border-2 border-emerald-500 w-52 opacity-95 pointer-events-none">
      {/* Service Type */}
      <div className="font-semibold text-sm text-zinc-100 truncate">
        {job.serviceType}
      </div>

      {/* Customer */}
      <div className="flex items-center gap-1.5 mt-1.5">
        <User className="h-3 w-3 text-zinc-400" />
        <span className="text-xs text-zinc-300 truncate">{job.customerName}</span>
      </div>

      {/* Time */}
      <div className="flex items-center gap-1.5 mt-1">
        <Clock className="h-3 w-3 text-zinc-400" />
        <span className="text-xs text-zinc-400">
          {formatInProviderTz(job.startTime, 'h:mm a', 'America/Chicago')} • {duration.toFixed(1)}h
        </span>
      </div>

      {/* Address */}
      {'address' in job && job.address && (
        <div className="flex items-center gap-1.5 mt-1">
          <MapPin className="h-3 w-3 text-zinc-400" />
          <span className="text-xs text-zinc-500 truncate">{job.address}</span>
        </div>
      )}

      {/* Drag indicator */}
      <div className="mt-2 pt-2 border-t border-zinc-700 text-center">
        <span className="text-xs text-emerald-400 font-medium">
          Drop to assign
        </span>
      </div>
    </div>
  );
}
