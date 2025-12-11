'use client';

import { Clock, User, MapPin } from 'lucide-react';
import type { WeeklyJob } from './WeeklyTeamCalendar';

interface JobPillDragPreviewProps {
  job: WeeklyJob;
}

export default function JobPillDragPreview({ job }: JobPillDragPreviewProps) {
  return (
    <div className="bg-zinc-900 rounded-lg shadow-2xl p-3 border-2 border-emerald-500 w-48 opacity-95 pointer-events-none">
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
          {job.startTime} - {job.endTime} ({job.duration}h)
        </span>
      </div>

      {/* Address */}
      {job.customerAddress && (
        <div className="flex items-center gap-1.5 mt-1">
          <MapPin className="h-3 w-3 text-zinc-400" />
          <span className="text-xs text-zinc-500 truncate">{job.customerAddress}</span>
        </div>
      )}

      {/* Drag indicator */}
      <div className="mt-2 pt-2 border-t border-zinc-700 text-center">
        <span className="text-xs text-emerald-400 font-medium">
          Drop to move
        </span>
      </div>
    </div>
  );
}
