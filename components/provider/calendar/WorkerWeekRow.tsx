'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import DayCell from './DayCell';
import type { WeeklyWorker, WorkerDay } from './WeeklyTeamCalendar';

interface WorkerWeekRowProps {
  worker: WeeklyWorker;
  weekDays: Array<{
    date: string;
    dayName: string;
    dayNumber: string;
    month: string;
    isWeekend: boolean;
  }>;
  onJobClick?: (jobId: string) => void;
  onDayClick?: (workerId: string, date: string) => void;
}

// Capacity status colors
const getCapacityStatus = (percentage: number) => {
  if (percentage <= 60) return { color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: '🟢' };
  if (percentage <= 90) return { color: 'text-yellow-400', bg: 'bg-yellow-500/10', icon: '🟡' };
  return { color: 'text-red-400', bg: 'bg-red-500/10', icon: '🔴' };
};

export default function WorkerWeekRow({
  worker,
  weekDays,
  onJobClick,
  onDayClick,
}: WorkerWeekRowProps) {
  const [expanded, setExpanded] = useState(false);

  const capacityStatus = getCapacityStatus(worker.weeklyStats.utilization);

  // Match days with worker's day data
  const getDayData = (date: string): WorkerDay | undefined => {
    return worker.days.find(d => d.date === date);
  };

  return (
    <div className="group">
      {/* Main Row */}
      <div className="flex hover:bg-zinc-800/30 transition-colors">
        {/* Worker Info */}
        <div
          className="flex-shrink-0 w-52 px-4 py-3 border-r border-zinc-800 cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-start gap-3">
            {/* Avatar */}
            {worker.photo ? (
              <img
                src={worker.photo}
                alt={worker.name}
                className="h-10 w-10 rounded-full object-cover border-2 flex-shrink-0"
                style={{ borderColor: worker.color }}
              />
            ) : (
              <div
                className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-medium text-white flex-shrink-0"
                style={{ backgroundColor: worker.color }}
              >
                {worker.firstName[0]}{worker.lastName[0]}
              </div>
            )}

            {/* Details */}
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm text-zinc-100 truncate">
                {worker.firstName} {worker.lastName}
              </div>
              <div className="text-xs text-zinc-500 capitalize">
                {worker.role.replace('_', ' ')}
              </div>
              <div className={cn('text-xs mt-1 flex items-center gap-1', capacityStatus.color)}>
                <span>{capacityStatus.icon}</span>
                <span>{worker.weeklyStats.utilization}%</span>
                <span className="text-zinc-500">
                  ({worker.weeklyStats.totalHours}h / {worker.weeklyStats.totalCapacity}h)
                </span>
              </div>
              <div className="text-xs text-zinc-500 mt-0.5">
                {worker.weeklyStats.jobCount} jobs this week
              </div>
            </div>

            {/* Expand Toggle */}
            <button
              className="p-1 text-zinc-500 hover:text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
            >
              {expanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Day Cells */}
        {weekDays.map(day => {
          const dayData = getDayData(day.date);
          return (
            <DayCell
              key={day.date}
              workerId={worker.id}
              workerColor={worker.color}
              date={day.date}
              dayData={dayData}
              isWeekend={day.isWeekend}
              expanded={expanded}
              onJobClick={onJobClick}
              onDayClick={() => onDayClick?.(worker.id, day.date)}
            />
          );
        })}
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="bg-zinc-900/50 border-t border-zinc-800/50">
          <div className="flex">
            {/* Spacer for worker column */}
            <div className="flex-shrink-0 w-52 px-4 py-2 border-r border-zinc-800">
              <span className="text-xs text-zinc-500">All Jobs</span>
            </div>
            {/* Expanded day details */}
            {weekDays.map(day => {
              const dayData = getDayData(day.date);
              if (!dayData || dayData.jobs.length === 0) {
                return (
                  <div
                    key={day.date}
                    className={cn(
                      'flex-1 min-w-32 px-2 py-2 border-r border-zinc-800 last:border-r-0 text-center text-xs text-zinc-600',
                      day.isWeekend && 'bg-zinc-800/20'
                    )}
                  >
                    No jobs
                  </div>
                );
              }

              return (
                <div
                  key={day.date}
                  className={cn(
                    'flex-1 min-w-32 px-2 py-2 border-r border-zinc-800 last:border-r-0',
                    day.isWeekend && 'bg-zinc-800/20'
                  )}
                >
                  <div className="space-y-1">
                    {dayData.jobs.map(job => (
                      <div
                        key={job.id}
                        className="text-xs p-1.5 rounded bg-zinc-800/50 hover:bg-zinc-700/50 cursor-pointer transition-colors"
                        onClick={() => onJobClick?.(job.id)}
                      >
                        <div className="font-medium text-zinc-200 truncate">
                          {job.serviceType}
                        </div>
                        <div className="text-zinc-400 truncate">
                          {job.customerName}
                        </div>
                        <div className="text-zinc-500">
                          {job.startTime} - {job.endTime}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
