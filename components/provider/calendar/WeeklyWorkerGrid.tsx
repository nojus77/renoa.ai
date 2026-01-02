'use client';

import { useState, useMemo } from 'react';
import { format, isSameDay, isToday } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, AlertCircle, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Job {
  id: string;
  serviceType: string;
  customerName: string;
  startTime: Date;
  endTime: Date;
  status: string;
}

interface DayData {
  date: Date;
  hours: number;
  utilization: number;
  jobCount: number;
  jobs: Job[];
  conflicts: Array<{ jobA: string; jobB: string }>;
  isOffDay: boolean;
}

interface WorkerWeekData {
  id: string;
  firstName: string;
  lastName: string;
  photo: string | null;
  color: string;
  role: string;
  weeklyStats: {
    totalHours: number;
    totalJobs: number;
    utilization: number;
    avgDailyHours: number;
  };
  days: DayData[];
}

interface WeeklyWorkerGridProps {
  workers: WorkerWeekData[];
  weekDays: Date[];
  onJobClick?: (jobId: string) => void;
  onDayClick?: (workerId: string, date: Date) => void;
  onAddJob?: (workerId: string, date: Date) => void;
}

export default function WeeklyWorkerGrid({
  workers,
  weekDays,
  onJobClick,
  onDayClick,
  onAddJob,
}: WeeklyWorkerGridProps) {
  // Calculate daily stats for summary bar
  const dailyStats = useMemo(() => {
    return weekDays.map(day => {
      let totalJobs = 0;
      let totalHours = 0;

      workers.forEach(worker => {
        const dayData = worker.days.find(d => isSameDay(new Date(d.date), day));
        if (dayData) {
          totalJobs += dayData.jobCount;
          totalHours += dayData.hours;
        }
      });

      return {
        date: day,
        jobCount: totalJobs,
        totalHours: Math.round(totalHours * 10) / 10,
      };
    });
  }, [workers, weekDays]);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
      {/* Flex container for frozen column + scrollable area */}
      <div className="flex">
        {/* FROZEN WORKER COLUMN */}
        <div className="w-48 flex-shrink-0 sticky left-0 z-20 bg-zinc-900 border-r border-zinc-800">
          {/* Header */}
          <div className="h-16 border-b border-zinc-700 px-3 flex items-center bg-zinc-800/50">
            <span className="text-sm font-medium text-zinc-400 uppercase">Worker</span>
          </div>

          {/* Worker rows */}
          {workers.map((worker, index) => (
            <div
              key={worker.id}
              className={cn(
                "h-24 px-3 flex items-center gap-3 border-b border-zinc-800",
                index % 2 === 0 ? "bg-zinc-900" : "bg-zinc-900/50" // Zebra stripe
              )}
            >
              <Avatar className="h-8 w-8 border-2 shrink-0" style={{ borderColor: worker.color }}>
                {worker.photo ? (
                  <AvatarImage src={worker.photo} alt={`${worker.firstName} ${worker.lastName}`} />
                ) : null}
                <AvatarFallback
                  className="text-xs font-medium"
                  style={{ backgroundColor: worker.color, color: 'white' }}
                >
                  {worker.firstName[0]}{worker.lastName[0]}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-zinc-100 truncate">
                  {worker.firstName} {worker.lastName[0]}.
                </div>
                {/* Only show utilization if > 0 */}
                {worker.weeklyStats.totalHours > 0 && (
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-16 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          worker.weeklyStats.utilization > 80 ? "bg-red-500" :
                          worker.weeklyStats.utilization > 50 ? "bg-yellow-500" : "bg-emerald-500"
                        )}
                        style={{ width: `${Math.min(worker.weeklyStats.utilization, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-zinc-500">
                      {worker.weeklyStats.totalHours.toFixed(0)}h
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}

        </div>

        {/* SCROLLABLE DAYS GRID */}
        <div className="flex-1 overflow-x-auto">
          <div className="min-w-[700px]">
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-zinc-700 h-16 bg-zinc-800/50">
              {weekDays.map((day, index) => (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "flex flex-col items-center justify-center border-r border-zinc-700",
                    isToday(day) && "bg-emerald-500/10 relative",
                    index === 6 && "border-r-0" // Remove border on last column
                  )}
                >
                  {/* Today indicator line */}
                  {isToday(day) && (
                    <div className="absolute inset-y-0 left-0 w-0.5 bg-emerald-500" />
                  )}
                  <span className="text-xs uppercase text-zinc-500">
                    {format(day, 'EEE')}
                  </span>
                  <span className={cn(
                    "text-lg font-semibold",
                    isToday(day) ? "text-emerald-400" : "text-zinc-200"
                  )}>
                    {format(day, 'd')}
                  </span>
                </div>
              ))}
            </div>

            {/* Worker day cells */}
            {workers.map((worker, workerIndex) => (
              <WeeklyWorkerRow
                key={worker.id}
                worker={worker}
                days={weekDays}
                onJobClick={onJobClick}
                onDayClick={onDayClick}
                onAddJob={onAddJob}
                isZebraEven={workerIndex % 2 === 0}
              />
            ))}

            {/* Empty state */}
            {workers.length === 0 && (
              <div className="p-12 text-center text-zinc-500 col-span-7">
                No team members found. Add workers to see their weekly schedule.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DAILY TOTALS ROW - Outside flex container to span full width */}
      <div className="flex bg-zinc-800 border-t border-zinc-700">
        {/* Frozen label column */}
        <div className="w-48 flex-shrink-0 h-12 flex items-center justify-center border-r border-zinc-700">
          <span className="text-sm font-medium text-zinc-400">Daily Totals</span>
        </div>
        {/* Scrollable stats columns */}
        <div className="flex-1 overflow-x-auto">
          <div className="min-w-[700px] h-12">
            <div className="grid grid-cols-7 h-full">
              {dailyStats.map((stats, index) => (
                <div
                  key={stats.date.toISOString()}
                  className={cn(
                    "border-r border-zinc-700 flex flex-col items-center justify-center text-center",
                    isToday(stats.date) && "bg-emerald-500/10",
                    index === 6 && "border-r-0"
                  )}
                >
                  <div className="text-sm font-medium text-white">{stats.jobCount} jobs</div>
                  <div className="text-xs text-zinc-400">{stats.totalHours}h</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface WeeklyWorkerRowProps {
  worker: WorkerWeekData;
  days: Date[];
  onJobClick?: (jobId: string) => void;
  onDayClick?: (workerId: string, date: Date) => void;
  onAddJob?: (workerId: string, date: Date) => void;
  isZebraEven?: boolean;
}

function WeeklyWorkerRow({
  worker,
  days,
  onJobClick,
  onDayClick,
  onAddJob,
  isZebraEven,
}: WeeklyWorkerRowProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-b border-zinc-800">
      {/* Main row - 7 day cells */}
      <div
        className={cn(
          "grid grid-cols-7 h-24 transition-colors hover:bg-zinc-800/30",
          isZebraEven ? "bg-zinc-900" : "bg-zinc-900/50" // Zebra stripe
        )}
      >
        {/* Day cells */}
        {days.map((day, dayIndex) => {
          const dayData = worker.days.find((d) => isSameDay(new Date(d.date), day));
          const isWeekend = day.getDay() === 0 || day.getDay() === 6;
          const isOffDay = dayData?.isOffDay || (isWeekend && (!dayData || dayData.jobCount === 0));
          const hasJobs = dayData?.jobCount && dayData.jobCount > 0;

          // Click handler logic: cells with jobs go to day view, empty cells open add job modal
          const handleCellClick = () => {
            if (hasJobs) {
              onDayClick?.(worker.id, day);
            } else if (!isOffDay) {
              onAddJob?.(worker.id, day);
            }
          };

          return (
            <div
              key={day.toISOString()}
              className={cn(
                "p-2 cursor-pointer transition-all group relative border-r border-zinc-800",
                isToday(day) && "bg-emerald-500/5",
                dayIndex === 6 && "border-r-0" // Remove border on last column
              )}
              onClick={handleCellClick}
            >
              {/* Today indicator line */}
              {isToday(day) && (
                <div className="absolute inset-y-0 left-0 w-0.5 bg-emerald-500" />
              )}

              {isOffDay ? (
                <div className="h-full flex items-center justify-center">
                  <span className="text-xs text-zinc-600">Off</span>
                </div>
              ) : hasJobs && dayData ? (
                /* Has jobs - show utilization */
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <div className="flex-1 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full transition-all',
                          dayData.utilization > 100 ? 'bg-red-500' :
                          dayData.utilization > 80 ? 'bg-red-400' :
                          dayData.utilization > 60 ? 'bg-yellow-400' : 'bg-emerald-500'
                        )}
                        style={{ width: `${Math.min(dayData.utilization, 100)}%` }}
                      />
                    </div>
                    <span className={cn(
                      'text-xs font-medium',
                      dayData.utilization > 80 ? 'text-red-400' :
                      dayData.utilization > 60 ? 'text-yellow-400' : 'text-emerald-400'
                    )}>
                      {dayData.utilization}%
                    </span>
                  </div>
                  <div className="text-xs text-zinc-400">
                    {dayData.jobCount} job{dayData.jobCount !== 1 ? 's' : ''} • {dayData.hours.toFixed(1)}h
                  </div>
                  {dayData.conflicts && dayData.conflicts.length > 0 && (
                    <div className="flex items-center gap-1 text-xs text-red-400">
                      <AlertCircle className="w-3 h-3" />
                      <span>{dayData.conflicts.length}</span>
                    </div>
                  )}
                </div>
              ) : (
                /* Empty day - NO utilization bar, just hover hint */
                <div className="h-full flex items-center justify-center">
                  <div className="text-xs text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    <Plus className="w-3 h-3" />
                    <span>Add job</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}
