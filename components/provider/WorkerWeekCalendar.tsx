'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface ScheduleDay {
  date: string;
  dayName: string;
  dayNum: number;
  isOff: boolean;
  workingHours: { start: string; end: string } | null;
  jobs: Array<{
    id: string;
    time: string;
    service: string;
    customer: string;
    status: string;
  }>;
}

interface WorkerWeekCalendarProps {
  days: ScheduleDay[];
  weekStart: string;
  weekEnd: string;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onJobClick?: (jobId: string) => void;
  loading?: boolean;
}

export default function WorkerWeekCalendar({
  days,
  weekStart,
  weekEnd,
  onPrevWeek,
  onNextWeek,
  onJobClick,
  loading = false,
}: WorkerWeekCalendarProps) {
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const suffix = h >= 12 ? 'p' : 'a';
    const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${displayHour}${suffix}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400';
      case 'in_progress':
        return 'bg-blue-500/20 border-blue-500/30 text-blue-400';
      case 'scheduled':
        return 'bg-zinc-700/50 border-zinc-600 text-zinc-300';
      default:
        return 'bg-zinc-700/50 border-zinc-600 text-zinc-400';
    }
  };

  const isToday = (dateStr: string) => {
    return format(new Date(), 'yyyy-MM-dd') === dateStr;
  };

  return (
    <div className="space-y-3">
      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onPrevWeek}
          className="p-1.5 hover:bg-zinc-800 rounded-lg transition-colors"
          disabled={loading}
        >
          <ChevronLeft className="w-5 h-5 text-zinc-400" />
        </button>
        <span className="text-sm font-medium text-zinc-300">
          {format(parseISO(weekStart), 'MMM d')} - {format(parseISO(weekEnd), 'MMM d, yyyy')}
        </span>
        <button
          onClick={onNextWeek}
          className="p-1.5 hover:bg-zinc-800 rounded-lg transition-colors"
          disabled={loading}
        >
          <ChevronRight className="w-5 h-5 text-zinc-400" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className={`grid grid-cols-7 gap-1 ${loading ? 'opacity-50' : ''}`}>
        {/* Day Headers */}
        {days.map((day) => (
          <div
            key={day.date}
            className={`text-center p-1 ${
              isToday(day.date) ? 'bg-emerald-500/10 rounded-t-lg' : ''
            }`}
          >
            <div className="text-xs text-zinc-500">{day.dayName}</div>
            <div
              className={`text-sm font-medium ${
                isToday(day.date) ? 'text-emerald-400' : 'text-zinc-300'
              }`}
            >
              {day.dayNum}
            </div>
          </div>
        ))}

        {/* Day Content */}
        {days.map((day) => (
          <div
            key={`${day.date}-content`}
            className={`min-h-[100px] p-1 border rounded-lg ${
              day.isOff
                ? 'bg-red-500/5 border-red-500/20'
                : 'bg-zinc-800/50 border-zinc-700/50'
            } ${isToday(day.date) ? 'ring-1 ring-emerald-500/30' : ''}`}
          >
            {/* Working Hours or Off */}
            <div
              className={`text-[10px] font-medium mb-1 px-1 py-0.5 rounded ${
                day.isOff
                  ? 'bg-red-500/20 text-red-400'
                  : day.workingHours
                  ? 'bg-zinc-700/50 text-zinc-400'
                  : 'text-zinc-600'
              }`}
            >
              {day.isOff
                ? 'OFF'
                : day.workingHours
                ? `${formatTime(day.workingHours.start)}-${formatTime(day.workingHours.end)}`
                : '-'}
            </div>

            {/* Jobs */}
            <div className="space-y-1">
              {day.jobs.slice(0, 3).map((job) => (
                <button
                  key={job.id}
                  onClick={() => onJobClick?.(job.id)}
                  className={`w-full text-left p-1 rounded border text-[10px] transition-colors hover:brightness-110 ${getStatusColor(
                    job.status
                  )}`}
                >
                  <div className="font-medium truncate">{job.service}</div>
                  <div className="text-[9px] opacity-70">{job.time}</div>
                </button>
              ))}
              {day.jobs.length > 3 && (
                <div className="text-[10px] text-zinc-500 text-center">
                  +{day.jobs.length - 3} more
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-[10px] text-zinc-500">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded bg-emerald-500/50" />
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded bg-blue-500/50" />
          <span>In Progress</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded bg-zinc-500/50" />
          <span>Scheduled</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded bg-red-500/50" />
          <span>Off</span>
        </div>
      </div>
    </div>
  );
}
