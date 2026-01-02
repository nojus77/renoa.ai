'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { format, isSameDay, parseISO, isToday, isTomorrow, isThisWeek, startOfDay, addDays, startOfWeek, endOfWeek } from 'date-fns';
import { formatInProviderTz } from '@/lib/utils/timezone';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  RefreshCw,
  GripVertical,
  Clock,
  MapPin,
  User,
  AlertTriangle,
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  DndContext,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  useDraggable,
  useDroppable,
  pointerWithin,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Types
interface GanttJob {
  id: string;
  serviceType: string;
  customerName: string;
  customerAddress: string;
  startTime: string;
  endTime: string;
  duration: number;
  status: string;
  estimatedValue: number | null;
  priority?: string;
  assignedUserIds?: string[];
}

interface GanttWorker {
  id: string;
  firstName: string;
  lastName: string;
  photo: string | null;
  color: string;
  role: string;
  jobs: GanttJob[];
  totalHours: number;
  utilization: number;
}

interface GanttDailyCalendarProps {
  providerId: string;
  initialDate?: Date;
  onJobClick?: (jobId: string) => void;
  onWorkerClick?: (workerId: string) => void;
  onAddJob?: (workerId?: string, hour?: number) => void;
}

// Constants
const HOUR_WIDTH = 100; // pixels per hour
const ROW_HEIGHT = 80; // pixels per worker row
const SIDEBAR_WIDTH = 250; // pixels for unassigned sidebar
const WORKER_COL_WIDTH = 160; // pixels for worker info column

export default function GanttDailyCalendar({
  providerId,
  initialDate = new Date(),
  onJobClick,
  onWorkerClick,
  onAddJob,
}: GanttDailyCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);
  const [workers, setWorkers] = useState<GanttWorker[]>([]);
  const [unassignedJobs, setUnassignedJobs] = useState<GanttJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [activeDragJob, setActiveDragJob] = useState<GanttJob | null>(null);
  const [dragSourceType, setDragSourceType] = useState<'sidebar' | 'timeline' | null>(null);
  const [nextJobDate, setNextJobDate] = useState<string | null>(null);
  const [prevJobDate, setPrevJobDate] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Sync selectedDate when parent's initialDate changes (e.g., from navigation buttons)
  useEffect(() => {
    setSelectedDate(initialDate);
  }, [initialDate]);

  // Hours to display (6 AM to 8 PM = 15 hours)
  const hours = useMemo(() => Array.from({ length: 15 }, (_, i) => i + 6), []);
  const startHour = 6;
  const endHour = 21;

  // Configure drag sensors
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: { distance: 8 },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 200, tolerance: 5 },
  });
  const sensors = useSensors(mouseSensor, touchSensor);

  // Fetch daily data
  const fetchDailyData = useCallback(async () => {
    setLoading(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const res = await fetch(
        `/api/provider/calendar/gantt-daily?providerId=${providerId}&date=${dateStr}`
      );

      if (!res.ok) throw new Error('Failed to fetch daily calendar');

      const data = await res.json();
      setWorkers(data.workers || []);
      setUnassignedJobs(data.unassignedJobs || []);
      setNextJobDate(data.nextJobDate || null);
      setPrevJobDate(data.prevJobDate || null);
    } catch (error) {
      console.error('Error fetching Gantt calendar:', error);
      toast.error('Failed to load daily schedule');
    } finally {
      setLoading(false);
    }
  }, [selectedDate, providerId]);

  useEffect(() => {
    fetchDailyData();
  }, [fetchDailyData]);

  // Scroll to current time on initial load
  useEffect(() => {
    if (!loading && scrollContainerRef.current && isToday(selectedDate)) {
      const now = new Date();
      const currentHour = now.getHours();
      if (currentHour >= startHour && currentHour <= endHour) {
        const scrollPosition = (currentHour - startHour - 1) * HOUR_WIDTH;
        scrollContainerRef.current.scrollLeft = Math.max(0, scrollPosition);
      }
    }
  }, [loading, selectedDate]);

  // Navigation handlers
  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  const goToToday = () => setSelectedDate(new Date());

  // Calculate job bar position and width
  const getJobStyle = (job: GanttJob) => {
    const start = new Date(job.startTime);
    const end = new Date(job.endTime);

    const startHourDecimal = start.getHours() + start.getMinutes() / 60;
    const endHourDecimal = end.getHours() + end.getMinutes() / 60;

    const startOffset = Math.max(0, startHourDecimal - startHour);
    const duration = Math.min(endHourDecimal, endHour) - Math.max(startHourDecimal, startHour);

    return {
      left: `${startOffset * HOUR_WIDTH}px`,
      width: `${Math.max(duration * HOUR_WIDTH, 60)}px`, // Minimum 60px width
    };
  };

  // Get current time indicator position
  const getCurrentTimePosition = () => {
    if (!isToday(selectedDate)) return null;

    const now = new Date();
    const currentHour = now.getHours() + now.getMinutes() / 60;

    if (currentHour < startHour || currentHour > endHour) return null;

    return (currentHour - startHour) * HOUR_WIDTH;
  };

  const currentTimePosition = getCurrentTimePosition();

  // Drag handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const dragData = active.data.current;

    if (dragData?.job) {
      setActiveDragJob(dragData.job);
      setDragSourceType(dragData.source || 'timeline');
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragJob(null);
    setDragSourceType(null);

    if (!over || !active.data.current) return;

    const job = active.data.current.job as GanttJob;
    const sourceWorkerId = active.data.current.workerId;
    const source = active.data.current.source;
    const dropData = over.data.current;

    if (!dropData) return;

    const targetWorkerId = dropData.workerId;
    const targetHour = dropData.hour;

    // Skip if dropped on same position
    if (sourceWorkerId === targetWorkerId && !targetHour) return;

    const userId = localStorage.getItem('userId');

    // Calculate new times if hour was specified
    let newStartTime: Date | undefined;
    let newEndTime: Date | undefined;

    if (targetHour !== undefined) {
      newStartTime = new Date(selectedDate);
      newStartTime.setHours(targetHour, 0, 0, 0);

      const durationMs = job.duration * 60 * 60 * 1000;
      newEndTime = new Date(newStartTime.getTime() + durationMs);
    }

    // Create updated job object
    const updatedJob = {
      ...job,
      assignedUserIds: targetWorkerId ? [targetWorkerId] : job.assignedUserIds,
      startTime: newStartTime ? newStartTime.toISOString() : job.startTime,
      endTime: newEndTime ? newEndTime.toISOString() : job.endTime,
    };

    // OPTIMISTIC UPDATE - Update UI immediately
    if (source === 'sidebar') {
      // Remove from unassigned
      setUnassignedJobs((prev) => prev.filter((j) => j.id !== job.id));
    } else if (sourceWorkerId) {
      // Remove from source worker
      setWorkers((prev) =>
        prev.map((worker) => {
          if (worker.id === sourceWorkerId) {
            return {
              ...worker,
              jobs: worker.jobs.filter((j) => j.id !== job.id),
            };
          }
          return worker;
        })
      );
    }

    // Add to target worker
    if (targetWorkerId) {
      setWorkers((prev) =>
        prev.map((worker) => {
          if (worker.id === targetWorkerId) {
            return {
              ...worker,
              jobs: [...worker.jobs, updatedJob],
            };
          }
          return worker;
        })
      );
    }

    // Now make API calls
    try {
      // Update job time if changed
      if (newStartTime && newEndTime) {
        await fetch(`/api/provider/jobs/${job.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            providerId,
            userId,
            startTime: newStartTime.toISOString(),
            endTime: newEndTime.toISOString(),
          }),
        });
      }

      // Assign to worker if different
      if (targetWorkerId && targetWorkerId !== sourceWorkerId) {
        await fetch(`/api/provider/jobs/${job.id}/assign-users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            providerId,
            userId,
            userIds: [targetWorkerId],
            mode: 'replace',
          }),
        });
      }

      toast.success('Job updated');
      // Fetch fresh data in background to sync any server changes
      fetchDailyData();
    } catch (error) {
      console.error('Error updating job:', error);
      toast.error('Failed to update job');

      // REVERT optimistic update on failure
      if (source === 'sidebar') {
        // Put job back in unassigned
        setUnassignedJobs((prev) => [...prev, job]);
      } else if (sourceWorkerId) {
        // Put job back in source worker
        setWorkers((prev) =>
          prev.map((worker) => {
            if (worker.id === sourceWorkerId) {
              return {
                ...worker,
                jobs: [...worker.jobs, job],
              };
            }
            return worker;
          })
        );
      }

      // Remove from target worker
      if (targetWorkerId) {
        setWorkers((prev) =>
          prev.map((worker) => {
            if (worker.id === targetWorkerId) {
              return {
                ...worker,
                jobs: worker.jobs.filter((j) => j.id !== job.id),
              };
            }
            return worker;
          })
        );
      }
    }
  };

  // Loading state
  if (loading && workers.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
          <span className="text-zinc-400 text-sm">Loading schedule...</span>
        </div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="w-full space-y-3">
        {/* Header */}
        <div className="border-b border-zinc-800 bg-zinc-900/50 px-4 py-2">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            {/* Date Navigation */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={goToPreviousDay}
                className="border-zinc-700 hover:bg-zinc-800"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="min-w-[200px] justify-start text-left font-medium border-zinc-700 hover:bg-zinc-800"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-zinc-900 border-zinc-800" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      if (date) {
                        setSelectedDate(date);
                        setShowDatePicker(false);
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Button
                variant="outline"
                size="icon"
                onClick={goToNextDay}
                className="border-zinc-700 hover:bg-zinc-800"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>

              {!isToday(selectedDate) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goToToday}
                  className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                >
                  Today
                </Button>
              )}

              <Button
                variant="ghost"
                size="icon"
                onClick={fetchDailyData}
                disabled={loading}
                className="text-zinc-400 hover:text-zinc-200"
              >
                <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
              </Button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {onAddJob && (
                <Button
                  onClick={() => onAddJob()}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-500"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Job
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content - Gantt timeline with horizontal scroll */}
        <div className="flex w-full border border-zinc-800 overflow-hidden">
          {/* Left Sidebar - Unassigned Jobs */}
          <div
            className="flex-shrink-0 border-r border-zinc-800 bg-zinc-900/30 flex flex-col"
            style={{ width: SIDEBAR_WIDTH }}
          >
            <div className="p-3 border-b border-zinc-800 bg-zinc-900/90">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-zinc-200">Unassigned</h3>
                <Badge variant="outline" className="text-orange-400 border-orange-400/30">
                  {unassignedJobs.length}
                </Badge>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-3">
              {unassignedJobs.length === 0 ? (
                <div className="text-center py-8 text-zinc-500 text-sm">
                  No unassigned jobs
                </div>
              ) : (
                <>
                  {/* Group jobs by date relative to selected calendar date */}
                  {(() => {
                    const selectedDay = startOfDay(selectedDate);
                    const tomorrowDay = addDays(selectedDay, 1);
                    const weekStart = startOfWeek(selectedDay, { weekStartsOn: 1 });
                    const weekEnd = endOfWeek(selectedDay, { weekStartsOn: 1 });

                    const todayJobs = unassignedJobs.filter((j) => isSameDay(new Date(j.startTime), selectedDay));
                    const tomorrowJobs = unassignedJobs.filter((j) => isSameDay(new Date(j.startTime), tomorrowDay));
                    const thisWeekJobs = unassignedJobs.filter((j) => {
                      const jobDay = startOfDay(new Date(j.startTime));
                      return jobDay >= weekStart && jobDay <= weekEnd && !isSameDay(jobDay, selectedDay) && !isSameDay(jobDay, tomorrowDay);
                    });
                    const laterJobs = unassignedJobs.filter((j) => {
                      const jobDay = startOfDay(new Date(j.startTime));
                      return jobDay > weekEnd;
                    });
                    const overdueJobs = unassignedJobs.filter((j) => {
                      const jobDay = startOfDay(new Date(j.startTime));
                      return jobDay < weekStart;
                    });

                    return (
                      <>
                        {overdueJobs.length > 0 && (
                          <JobDateGroup label="Overdue" jobs={overdueJobs} urgency="urgent" onJobClick={onJobClick} />
                        )}
                        {todayJobs.length > 0 && (
                          <JobDateGroup label="Today" jobs={todayJobs} urgency="urgent" onJobClick={onJobClick} />
                        )}
                        {tomorrowJobs.length > 0 && (
                          <JobDateGroup label="Tomorrow" jobs={tomorrowJobs} urgency="soon" onJobClick={onJobClick} />
                        )}
                        {thisWeekJobs.length > 0 && (
                          <JobDateGroup label="This Week" jobs={thisWeekJobs} urgency="normal" onJobClick={onJobClick} />
                        )}
                        {laterJobs.length > 0 && (
                          <JobDateGroup label="Later" jobs={laterJobs} urgency="normal" onJobClick={onJobClick} />
                        )}
                      </>
                    );
                  })()}
                </>
              )}
            </div>
          </div>

          {/* Main Gantt Area - horizontal scroll only */}
          <div className="flex-1 overflow-x-auto">
            {/* Timeline content */}
            <div ref={scrollContainerRef}>
              <div
                style={{
                  minWidth: `${WORKER_COL_WIDTH + hours.length * HOUR_WIDTH}px`,
                }}
              >
                {/* Time Header */}
                <div className="flex border-b border-zinc-800 sticky top-0 bg-zinc-900 z-20">
                  {/* Empty corner for worker column - STICKY */}
                  <div
                    className="flex-shrink-0 p-3 border-r border-zinc-800 bg-zinc-900 sticky left-0 z-30"
                    style={{ width: WORKER_COL_WIDTH }}
                  >
                    <span className="text-xs font-medium text-zinc-500 uppercase">Team</span>
                  </div>

                  {/* Hour columns */}
                  <div className="flex relative">
                    {hours.map((hour) => (
                      <div
                        key={hour}
                        className="flex-shrink-0 p-2 text-center border-r border-zinc-800/50"
                        style={{ width: HOUR_WIDTH }}
                      >
                        <span className="text-xs text-zinc-400">
                          {hour.toString().padStart(2, '0')}:00
                        </span>
                      </div>
                    ))}

                    {/* Current time indicator in header */}
                    {currentTimePosition !== null && (
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-30"
                        style={{ left: currentTimePosition }}
                      >
                        <div className="absolute -top-1 -left-1.5 w-3 h-3 rounded-full bg-red-500" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Worker Rows */}
                {workers.map((worker) => (
                  <WorkerRow
                    key={worker.id}
                    worker={worker}
                    hours={hours}
                    startHour={startHour}
                    currentTimePosition={currentTimePosition}
                    getJobStyle={getJobStyle}
                    onJobClick={onJobClick}
                    onWorkerClick={onWorkerClick}
                  />
                ))}

                {/* Empty state - no workers */}
                {workers.length === 0 && (
                  <div className="flex items-center justify-center h-64 text-zinc-500">
                    No team members found. Add workers to see their schedule.
                  </div>
                )}

                {/* Empty state - workers exist but no jobs for selected date */}
                {workers.length > 0 && workers.every(w => w.jobs.length === 0) && (
                  <div className="flex flex-col items-center justify-center py-12 text-center px-4 border-t border-zinc-800 bg-zinc-900/30">
                    <CalendarIcon className="h-12 w-12 text-zinc-600 mb-4" />
                    <p className="text-zinc-400 text-lg font-medium mb-2">
                      No jobs scheduled for {format(selectedDate, 'MMMM d, yyyy')}
                    </p>
                    <p className="text-zinc-500 text-sm mb-4">
                      {unassignedJobs.length > 0
                        ? `You have ${unassignedJobs.length} unassigned job${unassignedJobs.length === 1 ? '' : 's'} that need to be scheduled.`
                        : 'Check other dates or add a new job.'
                      }
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {nextJobDate && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedDate(new Date(nextJobDate))}
                          className="border-emerald-600 text-emerald-400 hover:bg-emerald-600/20"
                        >
                          Next job: {format(new Date(nextJobDate), 'MMM d')}
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      )}
                      {prevJobDate && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedDate(new Date(prevJobDate))}
                          className="border-zinc-600 text-zinc-400 hover:bg-zinc-600/20"
                        >
                          <ChevronLeft className="h-4 w-4 mr-1" />
                          Previous job: {format(new Date(prevJobDate), 'MMM d')}
                        </Button>
                      )}
                      {onAddJob && (
                        <Button
                          size="sm"
                          onClick={() => onAddJob()}
                          className="bg-emerald-600 hover:bg-emerald-500"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Job
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeDragJob && (
            <div className="p-3 bg-zinc-800 border border-zinc-600 rounded-lg shadow-xl max-w-[200px]">
              <div className="text-sm font-medium text-zinc-200">{activeDragJob.serviceType}</div>
              <div className="text-xs text-zinc-400 mt-1">{activeDragJob.customerName}</div>
              {activeDragJob.startTime && (
                <div className="text-xs text-zinc-500 mt-1">
                  {format(new Date(activeDragJob.startTime), 'HH:mm')} -{' '}
                  {format(new Date(activeDragJob.endTime), 'HH:mm')}
                </div>
              )}
            </div>
          )}
        </DragOverlay>
      </div>
    </DndContext>
  );
}

// Worker Row Component
interface WorkerRowProps {
  worker: GanttWorker;
  hours: number[];
  startHour: number;
  currentTimePosition: number | null;
  getJobStyle: (job: GanttJob) => { left: string; width: string };
  onJobClick?: (jobId: string) => void;
  onWorkerClick?: (workerId: string) => void;
}

function WorkerRow({
  worker,
  hours,
  startHour,
  currentTimePosition,
  getJobStyle,
  onJobClick,
  onWorkerClick,
}: WorkerRowProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `worker-row-${worker.id}`,
    data: { workerId: worker.id },
  });

  const utilizationColor =
    worker.utilization >= 90
      ? 'text-red-400'
      : worker.utilization >= 70
        ? 'text-yellow-400'
        : 'text-emerald-400';

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex border-b border-zinc-800 transition-colors',
        isOver && 'bg-emerald-900/20'
      )}
    >
      {/* Worker info - STICKY */}
      <div
        className="flex-shrink-0 p-3 border-r border-zinc-800 bg-zinc-900 sticky left-0 z-10"
        style={{ width: WORKER_COL_WIDTH }}
      >
        <button
          onClick={() => onWorkerClick?.(worker.id)}
          className="flex items-center gap-2 w-full text-left hover:opacity-80 transition-opacity"
        >
          <Avatar className="w-8 h-8 border-2" style={{ borderColor: worker.color }}>
            {worker.photo ? (
              <AvatarImage src={worker.photo} alt={`${worker.firstName} ${worker.lastName}`} />
            ) : null}
            <AvatarFallback
              className="text-xs font-medium"
              style={{ backgroundColor: worker.color, color: 'white' }}
            >
              {worker.firstName[0]}
              {worker.lastName[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-zinc-200 truncate hover:text-emerald-400 transition-colors">
              {worker.firstName} {worker.lastName[0]}.
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500 capitalize">
                {worker.role.replace('_', ' ')}
              </span>
              <Badge variant="outline" className={cn('text-xs px-1 py-0 h-4', utilizationColor)}>
                {worker.utilization}%
              </Badge>
            </div>
          </div>
        </button>
      </div>

      {/* Timeline area */}
      <div className="flex-1 relative" style={{ height: ROW_HEIGHT }}>
        {/* Hour grid lines and drop zones */}
        <div className="absolute inset-0 flex">
          {hours.map((hour) => (
            <HourDropZone
              key={hour}
              workerId={worker.id}
              hour={hour}
              width={HOUR_WIDTH}
            />
          ))}
        </div>

        {/* Job bars */}
        {worker.jobs.map((job) => (
          <DraggableJobBar
            key={job.id}
            job={job}
            workerId={worker.id}
            workerColor={worker.color}
            style={getJobStyle(job)}
            onClick={() => onJobClick?.(job.id)}
          />
        ))}

        {/* Current time line */}
        {currentTimePosition !== null && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-red-500/50 z-10 pointer-events-none"
            style={{ left: currentTimePosition }}
          />
        )}
      </div>
    </div>
  );
}

// Hour Drop Zone Component
interface HourDropZoneProps {
  workerId: string;
  hour: number;
  width: number;
}

function HourDropZone({ workerId, hour, width }: HourDropZoneProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `hour-${workerId}-${hour}`,
    data: { workerId, hour },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex-shrink-0 border-r border-zinc-800/30 transition-colors',
        isOver && 'bg-emerald-500/20'
      )}
      style={{ width }}
    />
  );
}

// Draggable Job Bar Component
interface DraggableJobBarProps {
  job: GanttJob;
  workerId: string;
  workerColor: string;
  style: { left: string; width: string };
  onClick?: () => void;
}

function DraggableJobBar({ job, workerId, workerColor, style, onClick }: DraggableJobBarProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `job-${job.id}`,
    data: { job, workerId, source: 'timeline' },
  });

  const statusColors: Record<string, string> = {
    scheduled: 'border-l-blue-500',
    in_progress: 'border-l-yellow-500',
    completed: 'border-l-green-500',
    cancelled: 'border-l-zinc-500',
  };

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'absolute top-2 rounded-md px-2 py-1 cursor-grab transition-all border-l-4',
        statusColors[job.status] || 'border-l-blue-500',
        isDragging ? 'opacity-50 cursor-grabbing' : 'hover:brightness-110 hover:shadow-lg'
      )}
      style={{
        ...style,
        height: ROW_HEIGHT - 16,
        backgroundColor: workerColor,
      }}
      onClick={onClick}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start gap-1">
        <GripVertical className="w-3 h-3 text-white/50 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-white truncate">{job.serviceType}</div>
          <div className="text-xs text-white/70 truncate">
            {format(new Date(job.startTime), 'HH:mm')} - {format(new Date(job.endTime), 'HH:mm')}
          </div>
          <div className="text-xs text-white/60 truncate">{job.customerName}</div>
        </div>
      </div>
    </div>
  );
}

// Job Date Group Component
interface JobDateGroupProps {
  label: string;
  jobs: GanttJob[];
  urgency: 'urgent' | 'soon' | 'normal';
  onJobClick?: (jobId: string) => void;
}

function JobDateGroup({ label, jobs, urgency, onJobClick }: JobDateGroupProps) {
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
          <DraggableUnassignedJob
            key={job.id}
            job={job}
            urgency={urgency}
            onClick={() => onJobClick?.(job.id)}
          />
        ))}
      </div>
    </div>
  );
}

// Draggable Unassigned Job Card Component
interface DraggableUnassignedJobProps {
  job: GanttJob;
  urgency?: 'urgent' | 'soon' | 'normal';
  onClick?: () => void;
}

function DraggableUnassignedJob({ job, urgency = 'normal', onClick }: DraggableUnassignedJobProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `unassigned-${job.id}`,
    data: { job, workerId: null, source: 'sidebar' },
  });

  const borderColor =
    urgency === 'urgent'
      ? 'border-l-red-500'
      : urgency === 'soon'
        ? 'border-l-orange-500'
        : 'border-l-zinc-600';

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'p-2.5 bg-zinc-800/50 rounded-lg border-l-4 cursor-grab transition-all group',
        borderColor,
        isDragging ? 'opacity-50 cursor-grabbing' : 'hover:bg-zinc-800'
      )}
      onClick={onClick}
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
          <CalendarIcon className="h-3 w-3" />
          <span>{format(new Date(job.startTime), 'EEE d')}</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>{formatInProviderTz(job.startTime, 'h:mm a', 'America/Chicago')}</span>
        </div>
      </div>
    </div>
  );
}
