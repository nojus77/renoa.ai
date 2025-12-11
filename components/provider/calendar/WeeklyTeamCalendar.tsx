'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { format, addWeeks, subWeeks, startOfWeek, endOfWeek, isThisWeek, parseISO, eachDayOfInterval } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  RefreshCw,
  Keyboard,
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  DndContext,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  pointerWithin,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Import new strategic components
import WeekHeader from './WeekHeader';
import WeeklyWorkerGrid from './WeeklyWorkerGrid';
import WeekInsightsPanel from './WeekInsightsPanel';
import UnassignedJobsPanel, { UnassignedJob } from './UnassignedJobsPanel';
import CalendarSkeleton from './CalendarSkeleton';
import { useKeyboardShortcuts, KeyboardShortcutsDialog } from './KeyboardShortcuts';
import { ScheduleProposalModal } from './ScheduleProposalModal';

// Types
export interface WeeklyJob {
  id: string;
  serviceType: string;
  customerName: string;
  customerAddress: string;
  startTime: string;
  endTime: string;
  duration: number;
  status: string;
  estimatedValue: number | null;
}

export interface WorkerDay {
  date: string;
  dayOfWeek: string;
  isWorkingDay: boolean;
  hours: number;
  capacity: number;
  utilization: number;
  jobs: WeeklyJob[];
  conflicts: Array<{ jobA: string; jobB: string; overlapMinutes: number }>;
}

export interface WeeklyWorker {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  photo: string | null;
  color: string;
  role: string;
  weeklyStats: {
    totalHours: number;
    totalCapacity: number;
    utilization: number;
    jobCount: number;
  };
  days: WorkerDay[];
}

export interface WeekStats {
  totalJobs: number;
  assignedJobs: number;
  unassignedJobs: number;
  totalHours: number;
  totalCapacity: number;
  avgUtilization: number;
  avgCapacity?: number;
  conflictCount: number;
  overbookedWorkers: string[];
  lowUtilizationDays: string[];
  activeWorkers?: number;
  overbookedDays?: number;
  underutilizedDays?: number;
}

interface Problem {
  type: string;
  message: string;
  severity: 'warning' | 'error';
  actionLabel?: string;
  workerId?: string;
  day?: string;
}

interface Suggestion {
  type: string;
  message: string;
  impact?: string;
}

interface Opportunity {
  type: string;
  message: string;
  impact?: string;
}

interface WeekInsights {
  problems: Problem[];
  suggestions: Suggestion[];
  opportunities: Opportunity[];
}

interface WeeklyTeamCalendarProps {
  providerId: string;
  onJobClick?: (jobId: string) => void;
  onDayClick?: (workerId: string, date: string) => void;
  onSwitchToDailyView?: () => void;
}

export default function WeeklyTeamCalendar({
  providerId,
  onJobClick,
  onDayClick,
  onSwitchToDailyView,
}: WeeklyTeamCalendarProps) {
  const [selectedWeekStart, setSelectedWeekStart] = useState<Date>(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [workers, setWorkers] = useState<WeeklyWorker[]>([]);
  const [weekStats, setWeekStats] = useState<WeekStats | null>(null);
  const [insights, setInsights] = useState<WeekInsights>({ problems: [], suggestions: [], opportunities: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [activeDragJob, setActiveDragJob] = useState<WeeklyJob | null>(null);
  const [unassignedJobs, setUnassignedJobs] = useState<UnassignedJob[]>([]);
  const [isAutoAssigning, setIsAutoAssigning] = useState(false);
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [currentProposal, setCurrentProposal] = useState<any>(null);

  // Configure drag sensors
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: { distance: 10 },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 250, tolerance: 5 },
  });
  const sensors = useSensors(mouseSensor, touchSensor);

  // Week navigation
  const weekEnd = endOfWeek(selectedWeekStart, { weekStartsOn: 1 });
  const isCurrentWeek = isThisWeek(selectedWeekStart, { weekStartsOn: 1 });

  // Generate week days array
  const weekDays = useMemo(() => {
    return eachDayOfInterval({ start: selectedWeekStart, end: weekEnd });
  }, [selectedWeekStart, weekEnd]);

  // Fetch weekly data
  const fetchWeeklyData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const dateStr = format(selectedWeekStart, 'yyyy-MM-dd');
      const res = await fetch(
        `/api/provider/calendar/weekly?providerId=${providerId}&startDate=${dateStr}`
      );

      if (!res.ok) {
        throw new Error('Failed to fetch weekly calendar');
      }

      const data = await res.json();
      setWorkers(data.workers);
      setWeekStats(data.weekStats);
      setInsights(data.insights || { problems: [], suggestions: [], opportunities: [] });
      setUnassignedJobs(data.unassignedJobs || []);
    } catch (err) {
      console.error('Error fetching weekly calendar:', err);
      setError('Unable to load weekly schedule. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedWeekStart, providerId]);

  // Refetch data whenever week changes
  useEffect(() => {
    fetchWeeklyData();
  }, [selectedWeekStart, providerId, fetchWeeklyData]);

  // Navigation handlers
  const goToPreviousWeek = () => setSelectedWeekStart(prev => subWeeks(prev, 1));
  const goToNextWeek = () => setSelectedWeekStart(prev => addWeeks(prev, 1));
  const goToCurrentWeek = () => setSelectedWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onJumpToToday: goToCurrentWeek,
    onPreviousDay: goToPreviousWeek,
    onNextDay: goToNextWeek,
    onToggleWeekView: onSwitchToDailyView,
    onRefresh: fetchWeeklyData,
    onShowShortcuts: () => setShowShortcuts(true),
    enabled: !loading,
  });

  // Transform workers for WeeklyWorkerGrid
  const transformedWorkers = useMemo(() => {
    return workers.map(worker => ({
      id: worker.id,
      firstName: worker.firstName,
      lastName: worker.lastName,
      photo: worker.photo,
      color: worker.color,
      role: worker.role,
      weeklyStats: {
        totalHours: worker.weeklyStats.totalHours,
        totalJobs: worker.weeklyStats.jobCount,
        utilization: worker.weeklyStats.utilization,
        avgDailyHours: worker.weeklyStats.totalHours / 7,
      },
      days: worker.days.map(day => ({
        date: new Date(day.date),
        hours: day.hours,
        utilization: day.utilization,
        jobCount: day.jobs.length,
        jobs: day.jobs.map(job => ({
          id: job.id,
          serviceType: job.serviceType,
          customerName: job.customerName,
          startTime: new Date(`${day.date}T${job.startTime}`),
          endTime: new Date(`${day.date}T${job.endTime}`),
          status: job.status,
        })),
        conflicts: day.conflicts,
        isOffDay: !day.isWorkingDay,
      })),
    }));
  }, [workers]);

  // Transform weekStats for WeekHeader
  const headerStats = useMemo(() => {
    if (!weekStats) return null;
    return {
      weekStart: selectedWeekStart,
      weekEnd: weekEnd,
      totalJobs: weekStats.totalJobs,
      totalHours: weekStats.totalHours,
      totalCapacity: weekStats.totalCapacity,
      avgCapacity: weekStats.avgCapacity ?? weekStats.avgUtilization,
      activeWorkers: weekStats.activeWorkers ?? workers.length,
      unassignedJobs: weekStats.unassignedJobs,
      conflicts: weekStats.conflictCount,
      overbookedDays: weekStats.overbookedDays ?? 0,
      underutilizedDays: weekStats.underutilizedDays ?? 0,
    };
  }, [weekStats, selectedWeekStart, weekEnd, workers.length]);

  // Drag handlers
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const dragData = event.active.data.current;
    if (dragData?.type === 'weekly-job' && dragData.job) {
      setActiveDragJob(dragData.job);
    }
  }, []);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragJob(null);

    if (!over || !active.data.current) return;

    const dragData = active.data.current;
    const dropData = over.data.current;

    if (dragData.type !== 'weekly-job') return;

    const job = dragData.job as WeeklyJob;
    const sourceWorkerId = dragData.workerId as string | null;
    const sourceDate = dragData.date as string;
    const isFromUnassignedPanel = dragData.source === 'unassigned-panel';

    if (dropData?.type === 'week-day-cell') {
      const targetWorkerId = dropData.workerId as string;
      const targetDate = dropData.date as string;

      // Skip if same position (only for assigned jobs)
      if (!isFromUnassignedPanel && sourceWorkerId === targetWorkerId && sourceDate === targetDate) return;

      const currentUserId = localStorage.getItem('userId');

      // Calculate new times (keep same time, change date)
      const [hours, minutes] = job.startTime.split(':').map(Number);
      const newStartDate = parseISO(targetDate);
      newStartDate.setHours(hours, minutes, 0, 0);

      const duration = job.duration * 60 * 60 * 1000; // hours to ms
      const newEndDate = new Date(newStartDate.getTime() + duration);

      // Create updated job object
      const updatedJob = {
        ...job,
        startTime: format(newStartDate, 'HH:mm'),
        endTime: format(newEndDate, 'HH:mm'),
      };

      // OPTIMISTIC UPDATE - Update UI immediately
      if (isFromUnassignedPanel) {
        // Remove from unassigned
        setUnassignedJobs((prev) => prev.filter((j) => j.id !== job.id));
      } else if (sourceWorkerId && sourceDate) {
        // Remove from source worker/day
        setWorkers((prev) =>
          prev.map((worker) => {
            if (worker.id === sourceWorkerId) {
              return {
                ...worker,
                days: worker.days.map((day) => {
                  if (day.date === sourceDate) {
                    return {
                      ...day,
                      jobs: day.jobs.filter((j) => j.id !== job.id),
                    };
                  }
                  return day;
                }),
              };
            }
            return worker;
          })
        );
      }

      // Add to target worker/day
      setWorkers((prev) =>
        prev.map((worker) => {
          if (worker.id === targetWorkerId) {
            return {
              ...worker,
              days: worker.days.map((day) => {
                if (day.date === targetDate) {
                  return {
                    ...day,
                    jobs: [...day.jobs, updatedJob],
                  };
                }
                return day;
              }),
            };
          }
          return worker;
        })
      );

      // Now make API calls
      try {
        // Update job time (only if date changed or coming from unassigned)
        if (isFromUnassignedPanel || sourceDate !== targetDate) {
          await fetch(`/api/provider/jobs/${job.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              providerId,
              userId: currentUserId,
              startTime: newStartDate.toISOString(),
              endTime: newEndDate.toISOString(),
            }),
          });
        }

        // Assign to worker (always for unassigned, or if worker changed)
        if (isFromUnassignedPanel || sourceWorkerId !== targetWorkerId) {
          await fetch(`/api/provider/jobs/${job.id}/assign-users`, {
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

        // Fetch fresh data in background to sync any server changes
        fetchWeeklyData();
      } catch (error) {
        console.error('Error moving job:', error);
        toast.error('Failed to move job');

        // REVERT optimistic update on failure
        if (isFromUnassignedPanel) {
          // Put job back in unassigned
          setUnassignedJobs((prev) => [...prev, job]);
        } else if (sourceWorkerId && sourceDate) {
          // Put job back in source worker/day
          setWorkers((prev) =>
            prev.map((worker) => {
              if (worker.id === sourceWorkerId) {
                return {
                  ...worker,
                  days: worker.days.map((day) => {
                    if (day.date === sourceDate) {
                      return {
                        ...day,
                        jobs: [...day.jobs, job],
                      };
                    }
                    return day;
                  }),
                };
              }
              return worker;
            })
          );
        }

        // Remove from target worker/day
        setWorkers((prev) =>
          prev.map((worker) => {
            if (worker.id === targetWorkerId) {
              return {
                ...worker,
                days: worker.days.map((day) => {
                  if (day.date === targetDate) {
                    return {
                      ...day,
                      jobs: day.jobs.filter((j) => j.id !== job.id),
                    };
                  }
                  return day;
                }),
              };
            }
            return worker;
          })
        );
      }
    }
  }, [providerId, fetchWeeklyData]);

  // Handle optimize week action
  const handleOptimizeWeek = async () => {
    // TODO: Implement week optimization
    console.log('Optimizing week...');
    // Call batch auto-assign for the week
    try {
      const currentUserId = localStorage.getItem('userId');
      await fetch('/api/provider/jobs/batch-auto-assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId,
          userId: currentUserId,
          strategy: 'balanced',
          startDate: format(selectedWeekStart, 'yyyy-MM-dd'),
          endDate: format(weekEnd, 'yyyy-MM-dd'),
        }),
      });
      await fetchWeeklyData();
    } catch (error) {
      console.error('Error optimizing week:', error);
    }
  };

  // Handle auto-assign unassigned jobs
  const handleAutoAssignUnassigned = async () => {
    if (unassignedJobs.length === 0) return;

    setIsAutoAssigning(true);
    try {
      const currentUserId = localStorage.getItem('userId');

      // Use the smart scheduler API to generate a proposal
      const response = await fetch('/api/provider/schedule/auto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId,
          date: selectedWeekStart.toISOString(),
          jobIds: unassignedJobs.map(j => j.id),
          createdBy: currentUserId || 'system',
        }),
      });

      const result = await response.json();

      if (result.success && result.proposalId) {
        // Check if any jobs were actually assigned
        if (result.stats.assignedJobs === 0) {
          toast.warning(`No jobs could be assigned. ${result.stats.unassignedJobs} jobs have no suitable workers.`);
          console.log('Scheduling result:', result);
          return;
        }

        // Get full proposal details including job/worker info
        const proposalResponse = await fetch(`/api/provider/schedule/proposals/${result.proposalId}`);
        const proposalData = await proposalResponse.json();

        // Show proposal modal for review
        setCurrentProposal({
          proposalId: result.proposalId,
          assignments: proposalData.assignments,
          unassignedJobs: result.unassignedJobs || [],
          stats: result.stats,
        });
        setShowProposalModal(true);
      } else {
        toast.error('Failed to generate schedule');
        console.error('Smart scheduler failed:', result);
      }
    } catch (error) {
      console.error('Error auto-assigning jobs:', error);
      toast.error('Error auto-assigning jobs');
    } finally {
      setIsAutoAssigning(false);
    }
  };

  // Handle job click from grid
  const handleJobClick = (jobId: string) => {
    onJobClick?.(jobId);
  };

  // Handle day click from grid
  const handleDayClick = (workerId: string, date: Date) => {
    onDayClick?.(workerId, format(date, 'yyyy-MM-dd'));
  };

  // Show loading skeleton
  if (loading && workers.length === 0) {
    return <CalendarSkeleton type="weekly" />;
  }

  return (
    <div className="w-full space-y-3">
      {/* Navigation Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/50 px-4 py-2">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {/* Week Navigation */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={goToPreviousWeek}
              className="border-zinc-700 hover:bg-zinc-800"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="min-w-[280px] justify-start text-left font-medium border-zinc-700 hover:bg-zinc-800"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  Week of {format(selectedWeekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-zinc-900 border-zinc-800" align="start">
                <Calendar
                  mode="single"
                  selected={selectedWeekStart}
                  onSelect={(date) => {
                    if (date) {
                      setSelectedWeekStart(startOfWeek(date, { weekStartsOn: 1 }));
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
              onClick={goToNextWeek}
              className="border-zinc-700 hover:bg-zinc-800"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            {!isCurrentWeek && (
              <Button
                variant="ghost"
                size="sm"
                onClick={goToCurrentWeek}
                className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
              >
                This Week
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={fetchWeeklyData}
              disabled={loading}
              className="text-zinc-400 hover:text-zinc-200"
            >
              <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
            </Button>
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            {onSwitchToDailyView && (
              <Button
                variant="outline"
                size="sm"
                onClick={onSwitchToDailyView}
                className="border-zinc-700 hover:bg-zinc-800"
              >
                Switch to Daily View
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowShortcuts(true)}
              className="text-zinc-400 hover:text-zinc-200"
              title="Keyboard shortcuts (?)"
            >
              <Keyboard className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content - No internal scrolling, flows with page */}
      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {error ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-3 text-zinc-400">
              <div className="text-red-400 font-medium">{error}</div>
              <Button onClick={fetchWeeklyData} variant="outline" size="sm">
                Try Again
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex w-full">
            {/* Left Sidebar - Unassigned Jobs - Touches left edge */}
            <div className="w-72 flex-shrink-0 flex-grow-0 border-r border-zinc-800">
              <div className="px-4 py-4">
                <UnassignedJobsPanel
                  jobs={unassignedJobs}
                  onJobClick={handleJobClick}
                  onAutoAssign={handleAutoAssignUnassigned}
                  isAutoAssigning={isAutoAssigning}
                  isLoading={loading}
                />
              </div>
            </div>

            {/* Main Content - Fills remaining space to right edge */}
            <div className="flex-1 space-y-3 min-w-0 overflow-hidden px-4 py-4">
              {/* Week Header with Stats */}
              {headerStats && (
                <WeekHeader stats={headerStats} problems={insights.problems} />
              )}

              {/* Worker Grid */}
              <WeeklyWorkerGrid
                workers={transformedWorkers}
                weekDays={weekDays}
                onJobClick={handleJobClick}
                onDayClick={handleDayClick}
              />

              {/* Insights Panel */}
              <WeekInsightsPanel
                insights={insights}
                onOptimize={handleOptimizeWeek}
              />
            </div>
          </div>
        )}

        {/* Drag Overlay */}
        <DragOverlay>
          {activeDragJob && (
            <div className="p-2 bg-zinc-800 border border-zinc-600 rounded shadow-lg">
              <div className="text-sm font-medium text-zinc-200">{activeDragJob.serviceType}</div>
              <div className="text-xs text-zinc-400">{activeDragJob.customerName}</div>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Keyboard Shortcuts Dialog */}
      <KeyboardShortcutsDialog
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />

      {/* Schedule Proposal Modal */}
      {currentProposal && (
        <ScheduleProposalModal
          open={showProposalModal}
          onClose={() => {
            setShowProposalModal(false);
            setCurrentProposal(null);
          }}
          proposal={currentProposal}
          jobs={unassignedJobs}
          workers={workers.map(w => ({
            id: w.id,
            firstName: w.firstName,
            lastName: w.lastName,
            color: w.color,
          }))}
          onSuccess={() => {
            setShowProposalModal(false);
            setCurrentProposal(null);
            fetchWeeklyData();
          }}
        />
      )}
    </div>
  );
}
