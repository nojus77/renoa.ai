'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { format, addDays, subDays, isToday, startOfDay, setHours, setMinutes } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Users,
  Clock,
  AlertTriangle,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  DndContext,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  pointerWithin,
  rectIntersection,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import WorkerColumn from './WorkerColumn';
import TimeColumn from './TimeColumn';
import UnassignedJobsSidebar from './UnassignedJobsSidebar';
import JobDragPreview from './JobDragPreview';
import CalendarSkeleton from './CalendarSkeleton';
import { KeyboardShortcutsDialog, useKeyboardShortcuts } from './KeyboardShortcuts';
import { NoWorkersState, NetworkErrorState } from './CalendarEmptyStates';
import { Keyboard } from 'lucide-react';

export interface CalendarJob {
  id: string;
  serviceType: string;
  customerName: string;
  customerAddress: string;
  startTime: Date;
  endTime: Date;
  status: string;
  address: string;
}

export interface CalendarWorker {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  photo: string | null;
  color: string;
  role: string;
  workingHours: { start: string; end: string };
  jobs: CalendarJob[];
  capacity: { scheduled: number; total: number; percentage: number };
  conflicts: Array<{ jobA: string; jobB: string; overlapMinutes: number }>;
}

export interface UnassignedJob {
  id: string;
  serviceType: string;
  customerName: string;
  customerAddress: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  priority: 'urgent' | 'today' | 'future';
  estimatedValue: number | null;
  suggestedWorkers: string[];
}

export interface CalendarStats {
  totalJobs: number;
  assignedJobs: number;
  unassignedJobs: number;
  totalHours: number;
  totalCapacity: number;
  capacityUsed: number;
  workersScheduled: number;
  totalWorkers: number;
}

interface DailyTeamCalendarProps {
  providerId: string;
  onJobClick?: (jobId: string) => void;
  onAssignJob?: (jobId: string, userId: string) => void;
}

// Time slot configuration
const TIME_SLOT_HEIGHT = 60; // pixels per hour
const CALENDAR_START_HOUR = 6; // 6 AM
const CALENDAR_END_HOUR = 20; // 8 PM

export default function DailyTeamCalendar({
  providerId,
  onJobClick,
  onAssignJob,
}: DailyTeamCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [workers, setWorkers] = useState<CalendarWorker[]>([]);
  const [unassignedJobs, setUnassignedJobs] = useState<UnassignedJob[]>([]);
  const [stats, setStats] = useState<CalendarStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeDragJob, setActiveDragJob] = useState<CalendarJob | UnassignedJob | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const hasScrolledToNow = useRef(false);

  // Configure drag sensors
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 10, // Require 10px movement before starting drag
    },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 250,
      tolerance: 5,
    },
  });
  const sensors = useSensors(mouseSensor, touchSensor);

  // Calculate time slots
  const timeSlots = useMemo(() => {
    const slots: string[] = [];
    for (let hour = CALENDAR_START_HOUR; hour <= CALENDAR_END_HOUR; hour++) {
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      slots.push(`${displayHour}:00 ${ampm}`);
    }
    return slots;
  }, []);

  // Fetch calendar data
  const fetchCalendarData = async () => {
    setLoading(true);
    setError(null);

    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const res = await fetch(
        `/api/provider/calendar/daily?providerId=${providerId}&date=${dateStr}&includeUnassigned=true`
      );

      if (!res.ok) {
        throw new Error('Failed to fetch calendar data');
      }

      const data = await res.json();

      // Parse dates from strings
      const parsedWorkers: CalendarWorker[] = data.workers.map((w: CalendarWorker) => ({
        ...w,
        jobs: w.jobs.map(j => ({
          ...j,
          startTime: new Date(j.startTime),
          endTime: new Date(j.endTime),
        })),
      }));

      const parsedUnassigned: UnassignedJob[] = data.unassignedJobs.map((j: UnassignedJob) => ({
        ...j,
        startTime: new Date(j.startTime),
        endTime: new Date(j.endTime),
      }));

      setWorkers(parsedWorkers);
      setUnassignedJobs(parsedUnassigned);
      setStats(data.stats);
    } catch (err) {
      console.error('Error fetching calendar:', err);
      setError('Unable to load calendar. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarData();
  }, [selectedDate, providerId]);

  // Keyboard shortcuts (placed after fetchCalendarData is defined)
  useKeyboardShortcuts({
    onJumpToToday: () => setSelectedDate(new Date()),
    onPreviousDay: () => setSelectedDate((d) => subDays(d, 1)),
    onNextDay: () => setSelectedDate((d) => addDays(d, 1)),
    onRefresh: fetchCalendarData,
    onShowShortcuts: () => setShowShortcuts(true),
    enabled: !isDragging,
  });

  // Scroll to current time on initial load (smooth scroll)
  useEffect(() => {
    if (!loading && scrollContainerRef.current && !hasScrolledToNow.current && isToday(selectedDate)) {
      const now = new Date();
      const currentHour = now.getHours();
      const scrollPosition = (currentHour - CALENDAR_START_HOUR) * TIME_SLOT_HEIGHT;

      // Use smooth scrolling for better UX
      setTimeout(() => {
        scrollContainerRef.current?.scrollTo({
          top: Math.max(0, scrollPosition - 100),
          behavior: 'smooth',
        });
      }, 100);

      hasScrolledToNow.current = true;
    }
  }, [loading, selectedDate]);

  // Date navigation
  const goToPreviousDay = () => setSelectedDate(prev => subDays(prev, 1));
  const goToNextDay = () => setSelectedDate(prev => addDays(prev, 1));
  const goToToday = () => {
    setSelectedDate(new Date());
    hasScrolledToNow.current = false;
  };

  // Handle job assignment
  const handleAssignJob = async (jobId: string, userId: string) => {
    try {
      const currentUserId = localStorage.getItem('userId');
      const res = await fetch(`/api/provider/jobs/${jobId}/assign-users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId,
          userId: currentUserId,
          userIds: [userId],
          mode: 'add',
        }),
      });

      if (res.ok) {
        // Refresh calendar data
        fetchCalendarData();
        if (onAssignJob) onAssignJob(jobId, userId);
      }
    } catch (error) {
      console.error('Error assigning job:', error);
    }
  };

  // Handle drag start
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const dragData = active.data.current;

    if (dragData?.type === 'job' && dragData.job) {
      setActiveDragJob(dragData.job);
      setIsDragging(true);
    }
  }, []);

  // Handle drag end
  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragJob(null);
    setIsDragging(false);

    if (!over || !active.data.current) return;

    const dragData = active.data.current;
    const dropData = over.data.current;

    if (dragData.type !== 'job' || !dragData.job) return;

    const job = dragData.job as CalendarJob | UnassignedJob;
    const jobId = job.id;

    // Determine the action based on drop target
    if (dropData?.type === 'worker-timeslot') {
      // Dropped on a worker's timeslot
      const targetWorkerId = dropData.workerId as string;
      const targetHour = dropData.hour as number;

      // Check if job is already assigned to this worker
      const sourceWorker = workers.find(w => w.jobs.some(j => j.id === jobId));
      const isAlreadyAssigned = sourceWorker?.id === targetWorkerId;

      // Calculate new start time based on drop position
      const newStartTime = setMinutes(setHours(selectedDate, targetHour), 0);
      const duration = (new Date(job.endTime).getTime() - new Date(job.startTime).getTime());
      const newEndTime = new Date(newStartTime.getTime() + duration);

      // Optimistic update
      if (!isAlreadyAssigned || sourceWorker) {
        // Update local state optimistically
        setWorkers(prev => {
          const updated = prev.map(worker => {
            // Remove job from source worker
            if (worker.id === sourceWorker?.id) {
              return {
                ...worker,
                jobs: worker.jobs.filter(j => j.id !== jobId),
              };
            }
            // Add job to target worker
            if (worker.id === targetWorkerId) {
              const updatedJob: CalendarJob = {
                id: job.id,
                serviceType: job.serviceType,
                customerName: job.customerName,
                customerAddress: job.customerAddress,
                address: job.customerAddress,
                startTime: newStartTime,
                endTime: newEndTime,
                status: 'status' in job ? job.status : 'scheduled',
              };
              return {
                ...worker,
                jobs: [...worker.jobs, updatedJob],
              };
            }
            return worker;
          });
          return updated;
        });

        // Remove from unassigned if it was there
        setUnassignedJobs(prev => prev.filter(j => j.id !== jobId));
      }

      // Make API call
      try {
        // Update job time and assignment
        const currentUserId = localStorage.getItem('userId');

        // First update the time if changed
        const originalStartHour = new Date(job.startTime).getHours();
        if (originalStartHour !== targetHour) {
          await fetch(`/api/provider/jobs/${jobId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              providerId,
              userId: currentUserId,
              startTime: newStartTime.toISOString(),
              endTime: newEndTime.toISOString(),
            }),
          });
        }

        // Then assign to worker
        if (!isAlreadyAssigned) {
          await fetch(`/api/provider/jobs/${jobId}/assign-users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              providerId,
              userId: currentUserId,
              userIds: [targetWorkerId],
              mode: 'replace',
            }),
          });
        }
      } catch (error) {
        console.error('Error updating job:', error);
        // Revert optimistic update on error
        fetchCalendarData();
      }
    } else if (dropData?.type === 'unassigned') {
      // Dropped on unassigned zone - unassign from current worker
      const sourceWorker = workers.find(w => w.jobs.some(j => j.id === jobId));

      if (sourceWorker) {
        // Optimistic update
        setWorkers(prev => prev.map(worker => {
          if (worker.id === sourceWorker.id) {
            return {
              ...worker,
              jobs: worker.jobs.filter(j => j.id !== jobId),
            };
          }
          return worker;
        }));

        // Add back to unassigned
        const unassignedJob: UnassignedJob = {
          id: job.id,
          serviceType: job.serviceType,
          customerName: job.customerName,
          customerAddress: job.customerAddress,
          startTime: new Date(job.startTime),
          endTime: new Date(job.endTime),
          duration: (new Date(job.endTime).getTime() - new Date(job.startTime).getTime()) / (1000 * 60 * 60),
          priority: 'today',
          estimatedValue: null,
          suggestedWorkers: [],
        };
        setUnassignedJobs(prev => [...prev, unassignedJob]);

        // Make API call
        try {
          const currentUserId = localStorage.getItem('userId');
          await fetch(`/api/provider/jobs/${jobId}/unassign`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              providerId,
              userId: currentUserId,
              type: 'users',
            }),
          });
        } catch (error) {
          console.error('Error unassigning job:', error);
          fetchCalendarData();
        }
      }
    }
  }, [workers, selectedDate, providerId, fetchCalendarData]);

  return (
    <div className="h-full flex flex-col bg-zinc-950">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-zinc-800 bg-zinc-900/50 px-4 py-3">
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
                  {format(selectedDate, 'EEEE, MMM d, yyyy')}
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
                      hasScrolledToNow.current = false;
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
              onClick={fetchCalendarData}
              disabled={loading}
              className="text-zinc-400 hover:text-zinc-200"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {/* Stats Overview */}
          {stats && (
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5 text-zinc-400">
                <CalendarIcon className="h-4 w-4" />
                <span className="font-medium text-zinc-200">{stats.totalJobs}</span>
                <span>jobs</span>
              </div>
              <div className="flex items-center gap-1.5 text-zinc-400">
                <Users className="h-4 w-4" />
                <span className="font-medium text-zinc-200">
                  {stats.workersScheduled}/{stats.totalWorkers}
                </span>
                <span>workers</span>
              </div>
              <div className="flex items-center gap-1.5 text-zinc-400">
                <Clock className="h-4 w-4" />
                <span className="font-medium text-zinc-200">{stats.capacityUsed}%</span>
                <span>capacity</span>
              </div>
              {stats.unassignedJobs > 0 && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {stats.unassignedJobs} unassigned
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 flex overflow-hidden">
          {/* Calendar Grid */}
          <div className="flex-1 flex overflow-hidden">
            {loading ? (
              <CalendarSkeleton type="daily" workerCount={5} />
            ) : error ? (
              <NetworkErrorState onRetry={fetchCalendarData} message={error} />
            ) : workers.length === 0 ? (
              <NoWorkersState />
            ) : (
              <div className="flex-1 flex overflow-hidden">
                {/* Time Column + Workers Grid */}
                <div
                  ref={scrollContainerRef}
                  className="flex-1 overflow-auto"
                >
                  <div className="flex min-w-max">
                    {/* Time Column */}
                    <TimeColumn
                      timeSlots={timeSlots}
                      slotHeight={TIME_SLOT_HEIGHT}
                      startHour={CALENDAR_START_HOUR}
                      showCurrentTime={isToday(selectedDate)}
                    />

                    {/* Worker Columns */}
                    {workers.map((worker) => (
                      <WorkerColumn
                        key={worker.id}
                        worker={worker}
                        timeSlots={timeSlots}
                        slotHeight={TIME_SLOT_HEIGHT}
                        startHour={CALENDAR_START_HOUR}
                        endHour={CALENDAR_END_HOUR}
                        onJobClick={onJobClick}
                        showCurrentTime={isToday(selectedDate)}
                        isDragging={isDragging}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Unassigned Jobs Sidebar */}
          {!loading && !error && (
            <UnassignedJobsSidebar
              jobs={unassignedJobs}
              workers={workers}
              collapsed={sidebarCollapsed}
              onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
              onAssignJob={handleAssignJob}
              onAssignCrew={async (jobId, crewId) => {
                try {
                  const res = await fetch(`/api/provider/jobs/${jobId}/assign-crew`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ crewId }),
                  });
                  if (res.ok) {
                    fetchCalendarData();
                  }
                } catch (error) {
                  console.error('Error assigning crew:', error);
                }
              }}
              onJobClick={onJobClick}
              onRefresh={fetchCalendarData}
              providerId={providerId}
              selectedDate={selectedDate}
            />
          )}
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeDragJob && <JobDragPreview job={activeDragJob} />}
        </DragOverlay>
      </DndContext>

      {/* Keyboard Shortcuts Dialog */}
      <KeyboardShortcutsDialog
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />

      {/* Keyboard Shortcuts Button (fixed bottom right) */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowShortcuts(true)}
        className="fixed bottom-4 right-4 bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-zinc-100 z-40"
      >
        <Keyboard className="h-4 w-4 mr-1.5" />
        <span className="text-xs">?</span>
      </Button>
    </div>
  );
}
