"use client"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProviderLayout from '@/components/provider/ProviderLayout';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Plus, Clock, Lock, Eye, Users, AlertCircle, DollarSign, TrendingUp, CheckCircle, AlertTriangle, XCircle, TrendingDown } from 'lucide-react';
import { format, isSameDay, startOfDay, differenceInHours } from 'date-fns';
import { toast } from 'sonner';
import AddJobModal from '@/components/provider/AddJobModal';
import BlockTimeModal from '@/components/provider/BlockTimeModal';
import DeleteBlockTimeModal from '@/components/provider/DeleteBlockTimeModal';
import { JobDetailsDrawer } from '@/components/provider/calendar/JobDetailsDrawer';
import StatusChangeDialog from '@/components/provider/StatusChangeDialog';
import JobCardContextMenu from '@/components/provider/JobCardContextMenu';
import TeamDispatchView from '@/components/provider/TeamDispatchView';
import DailyTeamCalendar from '@/components/provider/calendar/DailyTeamCalendar';
import WeeklyTeamCalendar from '@/components/provider/calendar/WeeklyTeamCalendar';
import GanttDailyCalendar from '@/components/provider/calendar/GanttDailyCalendar';
import WorkerProfileModal from '@/components/provider/WorkerProfileModal';
import CalendarSkeleton from '@/components/provider/calendar/CalendarSkeleton';
import { DndContext, DragEndEvent, DragStartEvent, pointerWithin, useDraggable } from '@dnd-kit/core';

type ViewMode = 'day' | 'week' | 'month';
type CalendarViewMode = 'my-schedule' | 'team-schedule';

interface Job {
  id: string;
  customerName: string;
  serviceType: string;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  isRenoaLead: boolean;
  phone: string;
  email: string;
  address: string;
  estimatedValue?: number;
  actualValue?: number;
  createdAt: string;
  notes?: string;
  customerNotes?: string;
  assignedUserIds: string[];
}

interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  email: string;
}

interface BlockedTime {
  id: string;
  fromDate: string;
  toDate: string;
  startTime: string | null;
  endTime: string | null;
  reason: string;
  notes: string | null;
  isRecurring: boolean;
}

export default function ProviderCalendar() {
  const router = useRouter();
  const [providerName, setProviderName] = useState('');
  const [providerId, setProviderId] = useState('');
  const [userId, setUserId] = useState('');
  const [userRole, setUserRole] = useState('');
  const [providerServiceTypes, setProviderServiceTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  // Default to team schedule - my-schedule is for mobile field worker view
  const [calendarViewMode, setCalendarViewMode] = useState<CalendarViewMode>('team-schedule');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAddJobModal, setShowAddJobModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ date: Date; hour: number } | null>(null);
  const [showBlockTimeModal, setShowBlockTimeModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [statusChangeJob, setStatusChangeJob] = useState<Job | null>(null);
  const [targetStatus, setTargetStatus] = useState<string>('');
  const [showDeleteBlockModal, setShowDeleteBlockModal] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<BlockedTime | null>(null);
  const [activeDragJob, setActiveDragJob] = useState<Job | null>(null);
  const [profileWorkerId, setProfileWorkerId] = useState<string | null>(null);

  // Set default view mode based on screen size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setViewMode('day');
      }
    };

    // Set initial view mode
    handleResize();

    // Listen for window resize
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const id = localStorage.getItem('providerId');
    const name = localStorage.getItem('providerName');
    const uid = localStorage.getItem('userId');
    const role = localStorage.getItem('userRole');

    if (!id || !name) {
      router.push('/provider/login');
      return;
    }

    setProviderId(id);
    setProviderName(name);
    setUserId(uid || '');
    setUserRole(role || 'owner');
    fetchProviderDetails(id);
    fetchJobs(id);
    fetchBlockedTimes(id);
    fetchTeamMembers(id);
  }, [router]);

  const fetchProviderDetails = async (id: string) => {
    try {
      const res = await fetch(`/api/provider/details?providerId=${id}`);
      const data = await res.json();

      if (data.provider && data.provider.serviceTypes) {
        setProviderServiceTypes(data.provider.serviceTypes);
      }
    } catch (error) {
      console.error('Failed to load provider details:', error);
    }
  };

  const fetchJobs = async (id: string) => {
    try {
      const res = await fetch(`/api/provider/jobs?providerId=${id}`);
      const data = await res.json();

      console.log('[Calendar] Jobs fetched:', {
        count: data.jobs?.length || 0,
        jobs: data.jobs?.slice(0, 5).map((j: Job) => ({
          id: j.id.slice(-6),
          service: j.serviceType,
          startTime: j.startTime,
          status: j.status,
        })),
      });

      if (data.jobs) {
        setJobs(data.jobs);
      }
    } catch (error) {
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const fetchBlockedTimes = async (id: string) => {
    try {
      const res = await fetch(`/api/provider/availability/block?providerId=${id}`);
      const data = await res.json();

      if (data.blockedTimes) {
        setBlockedTimes(data.blockedTimes);
      }
    } catch (error) {
      console.error('Failed to load blocked times:', error);
    }
  };

  const fetchTeamMembers = async (id: string) => {
    try {
      const res = await fetch(`/api/provider/team?providerId=${id}`);
      const data = await res.json();

      if (data.users) {
        setTeamMembers(data.users);
      }
    } catch (error) {
      console.error('Failed to load team members:', error);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const job = jobs.find(j => j.id === active.id);
    if (job) {
      setActiveDragJob(job);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragJob(null);

    if (!over) {
      console.log('No drop target');
      return;
    }

    const jobId = active.id as string;
    const dropData = over.id.toString().split('_');

    // Format: timeslot_YYYY-MM-DD_HH_userId
    if (dropData[0] === 'timeslot') {
      const dateStr = dropData[1];
      const hour = Number(dropData[2]);
      const droppedUserId = dropData[3];

      const job = jobs.find(j => j.id === jobId);
      if (!job) return;

      // Calculate job duration
      const jobDuration = (new Date(job.endTime).getTime() - new Date(job.startTime).getTime()) / (1000 * 60 * 60);

      // Create new start time
      const [year, month, day] = dateStr.split('-').map(Number);
      const newStartTime = new Date(year, month - 1, day, hour, 0, 0);

      // Update job via API
      try {
        const res = await fetch('/api/provider/jobs/bulk-update', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            providerId,
            userId,
            updates: [{
              id: jobId,
              startTime: newStartTime.toISOString(),
              duration: jobDuration,
              assignedUserIds: droppedUserId ? [droppedUserId] : job.assignedUserIds,
            }],
          }),
        });

        if (!res.ok) {
          throw new Error('Failed to update job');
        }

        toast.success('Job updated successfully');
        await fetchJobs(providerId);
      } catch (error) {
        console.error('Failed to update job:', error);
        toast.error('Failed to update job');
      }
    }
  };

  const handleStatusChange = (job: Job, status: string) => {
    setStatusChangeJob(job);
    setTargetStatus(status);
    setShowStatusDialog(true);
  };

  const handleDeleteJob = async (jobId: string) => {
    try {
      const res = await fetch(`/api/provider/jobs/${jobId}?providerId=${providerId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete job');

      toast.success('Job deleted successfully');
      fetchJobs(providerId);
    } catch (error) {
      toast.error('Failed to delete job');
    }
  };

  const handleBlockClick = (block: BlockedTime) => {
    setSelectedBlock(block);
    setShowDeleteBlockModal(true);
  };

  const navigatePrev = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() - 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() + 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getDateRangeText = () => {
    if (viewMode === 'day') {
      return currentDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    } else if (viewMode === 'week') {
      const weekStart = getWeekStart(currentDate);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } else {
      return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
  };

  // Calculate comprehensive daily stats for selected date (matching weekly view)
  // NOTE: Stats show metrics for the SELECTED DATE only.
  // The Gantt calendar sidebar may show all unassigned jobs for convenience,
  // but this stats calculation only counts jobs scheduled for the selected date.
  const getDailyStats = () => {
    if (viewMode !== 'day') return null;

    // Filter jobs for selected date that are not cancelled
    const selectedDateJobs = jobs.filter(job => {
      const jobDate = new Date(job.startTime);
      return (
        isSameDay(jobDate, currentDate) &&
        job.status !== 'cancelled'
      );
    });

    // Find next/prev dates with jobs for navigation hints
    const futureJobs = jobs
      .filter(j => new Date(j.startTime) > currentDate && j.status !== 'cancelled')
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    const pastJobs = jobs
      .filter(j => new Date(j.startTime) < startOfDay(currentDate) && j.status !== 'cancelled')
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

    const nextJobDate = futureJobs[0]?.startTime ? new Date(futureJobs[0].startTime) : null;
    const prevJobDate = pastJobs[0]?.startTime ? new Date(pastJobs[0].startTime) : null;

    // Calculate total hours scheduled
    const totalHours = Math.round(selectedDateJobs.reduce((sum, j) => {
      const start = new Date(j.startTime);
      const end = new Date(j.endTime);
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      return sum + hours;
    }, 0));

    // Count active workers (workers with jobs today)
    const activeWorkerIds = new Set(
      selectedDateJobs
        .filter(j => j.assignedUserIds && j.assignedUserIds.length > 0)
        .flatMap(j => j.assignedUserIds || [])
    );
    const activeWorkers = activeWorkerIds.size;

    // Total capacity (8 hours per active worker, or total team if no assignments yet)
    const totalCapacity = Math.max(activeWorkers, teamMembers.length) * 8;
    const avgCapacity = totalCapacity > 0 ? Math.round((totalHours / totalCapacity) * 100) : 0;

    // Unassigned jobs - ONLY for the selected date, excluding cancelled/completed
    const unassignedJobs = selectedDateJobs.filter(
      j => (!j.assignedUserIds || j.assignedUserIds.length === 0)
    ).length;

    // Detect conflicts (overlapping jobs for same worker)
    let conflicts = 0;
    const workerJobsMap = new Map<string, Job[]>();

    selectedDateJobs.forEach(job => {
      if (job.assignedUserIds) {
        job.assignedUserIds.forEach(workerId => {
          if (!workerJobsMap.has(workerId)) {
            workerJobsMap.set(workerId, []);
          }
          workerJobsMap.get(workerId)!.push(job);
        });
      }
    });

    workerJobsMap.forEach(workerJobs => {
      const sorted = workerJobs.sort((a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      );
      for (let i = 0; i < sorted.length - 1; i++) {
        const current = sorted[i];
        const next = sorted[i + 1];
        if (new Date(current.endTime) > new Date(next.startTime)) {
          conflicts++;
        }
      }
    });

    // Calculate worker utilization
    const workerUtilization = new Map<string, number>();
    workerJobsMap.forEach((workerJobs, workerId) => {
      const hours = workerJobs.reduce((sum, j) => {
        const start = new Date(j.startTime);
        const end = new Date(j.endTime);
        return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      }, 0);
      workerUtilization.set(workerId, (hours / 8) * 100);
    });

    const overbookedWorkers = Array.from(workerUtilization.values()).filter(util => util > 90).length;
    const underutilizedWorkers = Array.from(workerUtilization.values()).filter(util => util < 40).length;

    return {
      totalJobs: selectedDateJobs.length,
      totalHours,
      totalCapacity,
      avgCapacity,
      activeWorkers,
      unassignedJobs,
      conflicts,
      overbookedWorkers,
      underutilizedWorkers,
      nextJobDate,
      prevJobDate,
      totalJobsInSystem: jobs.filter(j => j.status !== 'cancelled').length,
    };
  };

  // Get monthly stats for the month view
  const getMonthlyStats = () => {
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    // Filter jobs for the month
    const monthJobs = jobs.filter(job => {
      const jobDate = new Date(job.startTime);
      return jobDate >= monthStart && jobDate <= monthEnd;
    });

    // Calculate total revenue (actualValue for completed jobs)
    const totalRevenue = monthJobs
      .filter(j => j.status === 'completed')
      .reduce((sum, j) => sum + (j.actualValue || j.estimatedValue || 0), 0);

    // Count completed jobs
    const completedJobs = monthJobs.filter(j => j.status === 'completed').length;

    // Count all scheduled jobs (not cancelled)
    const scheduledJobs = monthJobs.filter(j => j.status !== 'cancelled').length;

    // Calculate utilization (hours worked / available hours)
    const totalHoursWorked = monthJobs
      .filter(j => j.status === 'completed')
      .reduce((sum, j) => {
        const start = new Date(j.startTime);
        const end = new Date(j.endTime);
        return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      }, 0);

    // Calculate available hours (8 hours per worker per working day)
    // Assume 5 working days per week, ~22 working days per month
    const workingDaysInMonth = 22;
    const availableHours = teamMembers.length * 8 * workingDaysInMonth;
    const utilizationPercent = availableHours > 0 ? Math.round((totalHoursWorked / availableHours) * 100) : 0;

    return {
      totalRevenue,
      completedJobs,
      scheduledJobs,
      utilizationPercent,
    };
  };

  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
    return new Date(d.setDate(diff));
  };

  if (loading) {
    return (
      <ProviderLayout providerName={providerName}>
        <CalendarSkeleton type={viewMode === 'week' ? 'weekly' : 'daily'} />
      </ProviderLayout>
    );
  }

  return (
    <ProviderLayout providerName={providerName}>
      <div className="min-h-screen bg-zinc-950">
        {/* Header */}
        <div className="border-b border-zinc-800/50 bg-zinc-900/30 backdrop-blur-sm">
          <div className="w-full px-4 py-3">
            {/* Top Row: View Controls + Action Buttons */}
            <div className="flex items-center justify-between gap-2 mb-3">
              {/* View Toggles */}
              <div className="flex items-center gap-1 md:gap-2 bg-zinc-900/50 rounded-lg p-1 border border-zinc-800">
                <button
                  onClick={() => setViewMode('day')}
                  className={`px-3 md:px-4 py-2 md:py-1.5 text-xs md:text-sm font-medium rounded transition-all ${
                    viewMode === 'day'
                      ? 'bg-emerald-600 text-white'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Day
                </button>
                <button
                  onClick={() => setViewMode('week')}
                  className={`px-3 md:px-4 py-2 md:py-1.5 text-xs md:text-sm font-medium rounded transition-all ${
                    viewMode === 'week'
                      ? 'bg-emerald-600 text-white'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Week
                </button>
                <button
                  onClick={() => setViewMode('month')}
                  className={`px-3 md:px-4 py-2 md:py-1.5 text-xs md:text-sm font-medium rounded transition-all ${
                    viewMode === 'month'
                      ? 'bg-emerald-600 text-white'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Month
                </button>
              </div>

              {/* Date Navigation */}
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => {
                    const newDate = new Date(currentDate);
                    if (viewMode === 'day') {
                      newDate.setDate(newDate.getDate() - 1);
                    } else if (viewMode === 'week') {
                      newDate.setDate(newDate.getDate() - 7);
                    } else {
                      newDate.setMonth(newDate.getMonth() - 1);
                    }
                    setCurrentDate(newDate);
                  }}
                  variant="outline"
                  size="icon"
                  className="border-zinc-700 hover:bg-zinc-800"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => setCurrentDate(new Date())}
                  variant="outline"
                  size="sm"
                  className="border-zinc-700 hover:bg-zinc-800"
                >
                  Today
                </Button>
                <Button
                  onClick={() => {
                    const newDate = new Date(currentDate);
                    if (viewMode === 'day') {
                      newDate.setDate(newDate.getDate() + 1);
                    } else if (viewMode === 'week') {
                      newDate.setDate(newDate.getDate() + 7);
                    } else {
                      newDate.setMonth(newDate.getMonth() + 1);
                    }
                    setCurrentDate(newDate);
                  }}
                  variant="outline"
                  size="icon"
                  className="border-zinc-700 hover:bg-zinc-800"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => {
                    // Pre-fill date based on view mode
                    if (viewMode === 'week') {
                      // Use Monday of the current week
                      const weekStart = getWeekStart(currentDate);
                      setSelectedSlot({ date: weekStart, hour: 9 });
                    } else if (viewMode === 'month') {
                      // Use first day of current month
                      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                      setSelectedSlot({ date: monthStart, hour: 9 });
                    } else {
                      // Day view - use current date
                      setSelectedSlot({ date: currentDate, hour: 9 });
                    }
                    setShowAddJobModal(true);
                  }}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  Add Job
                </Button>
                <Button
                  onClick={() => setShowBlockTimeModal(true)}
                  size="sm"
                  variant="outline"
                  className="border-zinc-700 hover:bg-zinc-800 hidden md:flex"
                >
                  <Clock className="h-4 w-4 mr-1.5" />
                  Block Time
                </Button>
              </div>
            </div>

            {/* Daily Stats Section (Day view only) - Matches Weekly View */}
            {viewMode === 'day' && (() => {
              const stats = getDailyStats();
              if (!stats) return null;

              const capacityColor =
                stats.avgCapacity > 90
                  ? 'text-red-400'
                  : stats.avgCapacity > 70
                    ? 'text-yellow-400'
                    : 'text-emerald-400';

              return (
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                  {/* Title Row */}
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-zinc-100">
                        {format(currentDate, 'EEEE, MMMM d, yyyy')}
                      </h2>
                      <p className="text-zinc-400 mt-1">
                        {stats.totalJobs} jobs scheduled across {stats.activeWorkers} workers
                        {stats.totalJobs === 0 && stats.totalJobsInSystem > 0 && (
                          <span className="text-zinc-500 ml-2">
                            ({stats.totalJobsInSystem} total jobs in system)
                          </span>
                        )}
                      </p>
                      {/* Navigation hints when no jobs for selected date */}
                      {stats.totalJobs === 0 && (stats.nextJobDate || stats.prevJobDate) && (
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-zinc-500">Jump to:</span>
                          {stats.nextJobDate && (
                            <button
                              onClick={() => setCurrentDate(stats.nextJobDate!)}
                              className="text-xs px-2 py-1 bg-emerald-600/20 text-emerald-400 rounded hover:bg-emerald-600/30 transition-colors"
                            >
                              Next job: {format(stats.nextJobDate, 'MMM d')}
                            </button>
                          )}
                          {stats.prevJobDate && (
                            <button
                              onClick={() => setCurrentDate(stats.prevJobDate!)}
                              className="text-xs px-2 py-1 bg-zinc-700/50 text-zinc-400 rounded hover:bg-zinc-700 transition-colors"
                            >
                              Previous: {format(stats.prevJobDate, 'MMM d')}
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Average capacity badge */}
                    <div className="text-center">
                      <div className={`text-4xl font-bold ${capacityColor}`}>
                        {stats.avgCapacity}%
                      </div>
                      <div className="text-sm text-zinc-500">Avg Capacity</div>
                    </div>
                  </div>

                  {/* Stat Cards Row - 5 cards matching weekly view */}
                  <div className="grid grid-cols-5 gap-4">
                    {/* Total Hours */}
                    <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="h-4 w-4 text-zinc-300 opacity-70" />
                        <span className="text-xs font-medium text-zinc-300 opacity-70">Total Hours</span>
                      </div>
                      <div className="text-2xl font-bold text-zinc-300">{stats.totalHours}h</div>
                      <div className="text-xs text-zinc-300 opacity-60 mt-0.5">
                        of {stats.totalCapacity}h capacity
                      </div>
                    </div>

                    {/* Unassigned */}
                    <div className={`rounded-lg border p-3 ${
                      stats.unassignedJobs > 0
                        ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                        : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        {stats.unassignedJobs > 0 ? (
                          <AlertTriangle className="h-4 w-4 opacity-70" />
                        ) : (
                          <CheckCircle className="h-4 w-4 opacity-70" />
                        )}
                        <span className="text-xs font-medium opacity-70">Unassigned</span>
                      </div>
                      <div className="text-2xl font-bold">{stats.unassignedJobs}</div>
                      <div className="text-xs opacity-60 mt-0.5">jobs need workers</div>
                    </div>

                    {/* Conflicts */}
                    <div className={`rounded-lg border p-3 ${
                      stats.conflicts > 0
                        ? 'bg-red-500/10 border-red-500/30 text-red-400'
                        : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        {stats.conflicts > 0 ? (
                          <XCircle className="h-4 w-4 opacity-70" />
                        ) : (
                          <CheckCircle className="h-4 w-4 opacity-70" />
                        )}
                        <span className="text-xs font-medium opacity-70">Conflicts</span>
                      </div>
                      <div className="text-2xl font-bold">{stats.conflicts}</div>
                      <div className="text-xs opacity-60 mt-0.5">scheduling conflicts</div>
                    </div>

                    {/* Overbooked */}
                    <div className={`rounded-lg border p-3 ${
                      stats.overbookedWorkers > 0
                        ? 'bg-red-500/10 border-red-500/30 text-red-400'
                        : 'bg-zinc-800 border-zinc-700 text-zinc-300'
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <Users className="h-4 w-4 opacity-70" />
                        <span className="text-xs font-medium opacity-70">Overbooked</span>
                      </div>
                      <div className="text-2xl font-bold">{stats.overbookedWorkers}</div>
                      <div className="text-xs opacity-60 mt-0.5">workers &gt;90%</div>
                    </div>

                    {/* Underutilized */}
                    <div className={`rounded-lg border p-3 ${
                      stats.underutilizedWorkers > 0
                        ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                        : 'bg-zinc-800 border-zinc-700 text-zinc-300'
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingDown className="h-4 w-4 opacity-70" />
                        <span className="text-xs font-medium opacity-70">Underutilized</span>
                      </div>
                      <div className="text-2xl font-bold">{stats.underutilizedWorkers}</div>
                      <div className="text-xs opacity-60 mt-0.5">workers &lt;40%</div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Calendar Views - Wrapped in DndContext */}
        <DndContext
          collisionDetection={pointerWithin}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="w-full py-2">
            {viewMode === 'week' && (
              <WeeklyTeamCalendar
                providerId={providerId}
                onJobClick={(jobId) => {
                  const job = jobs.find(j => j.id === jobId);
                  if (job) setSelectedJob(job);
                }}
                onDayClick={(workerId, date) => {
                  // Switch to daily view for the selected day
                  setCurrentDate(new Date(date));
                  setViewMode('day');
                  setCalendarViewMode('team-schedule');
                }}
              />
            )}
            {viewMode === 'day' && calendarViewMode === 'my-schedule' && (
              <DayView
                jobs={jobs}
                blockedTimes={blockedTimes}
                currentDate={currentDate}
                onSlotClick={(hour) => {
                  setSelectedSlot({ date: currentDate, hour });
                  setShowAddJobModal(true);
                }}
                onJobClick={(job) => setSelectedJob(job)}
                onStatusChange={handleStatusChange}
                onDeleteJob={handleDeleteJob}
                onBlockClick={handleBlockClick}
              />
            )}
            {viewMode === 'day' && calendarViewMode === 'team-schedule' && (
              <GanttDailyCalendar
                providerId={providerId}
                initialDate={currentDate}
                onJobClick={(jobId) => {
                  const job = jobs.find(j => j.id === jobId);
                  if (job) setSelectedJob(job);
                }}
                onWorkerClick={(workerId) => setProfileWorkerId(workerId)}
                onAddJob={(workerId, hour) => {
                  if (hour !== undefined) {
                    setSelectedSlot({ date: currentDate, hour });
                  }
                  setShowAddJobModal(true);
                }}
              />
            )}
            {viewMode === 'month' && <MonthView jobs={jobs} currentDate={currentDate} stats={getMonthlyStats()} />}
          </div>

        </DndContext>
      </div>

      {/* Add Job Modal */}
      <AddJobModal
        isOpen={showAddJobModal}
        onClose={() => {
          setShowAddJobModal(false);
          setSelectedSlot(null);
        }}
        providerId={providerId}
        providerServiceTypes={providerServiceTypes}
        onJobCreated={() => fetchJobs(providerId)}
        selectedDate={selectedSlot?.date}
        selectedHour={selectedSlot?.hour}
      />

      {/* Block Time Modal */}
      <BlockTimeModal
        isOpen={showBlockTimeModal}
        onClose={() => setShowBlockTimeModal(false)}
        providerId={providerId}
        onTimeBlocked={() => {
          fetchBlockedTimes(providerId);
        }}
      />

      {/* Job Details Drawer */}
      <JobDetailsDrawer
        job={selectedJob}
        isOpen={!!selectedJob}
        onClose={() => setSelectedJob(null)}
        onDelete={handleDeleteJob}
      />

      {/* Status Change Dialog */}
      {statusChangeJob && (
        <StatusChangeDialog
          isOpen={showStatusDialog}
          onClose={() => {
            setShowStatusDialog(false);
            setStatusChangeJob(null);
            setTargetStatus('');
          }}
          currentStatus={statusChangeJob.status}
          targetStatus={targetStatus}
          jobId={statusChangeJob.id}
          jobName={statusChangeJob.customerName}
          estimatedValue={statusChangeJob.estimatedValue}
          onStatusChanged={() => {
            fetchJobs(providerId);
            setShowStatusDialog(false);
            setStatusChangeJob(null);
            setTargetStatus('');
          }}
        />
      )}

      {/* Delete Block Time Modal */}
      {selectedBlock && (
        <DeleteBlockTimeModal
          isOpen={showDeleteBlockModal}
          onClose={() => {
            setShowDeleteBlockModal(false);
            setSelectedBlock(null);
          }}
          blockId={selectedBlock.id}
          reason={selectedBlock.reason}
          dateRange={`${new Date(selectedBlock.fromDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${new Date(selectedBlock.toDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
          onDeleted={() => {
            fetchBlockedTimes(providerId);
            setShowDeleteBlockModal(false);
            setSelectedBlock(null);
          }}
        />
      )}

      {/* Worker Profile Modal */}
      <WorkerProfileModal
        workerId={profileWorkerId}
        isOpen={!!profileWorkerId}
        onClose={() => setProfileWorkerId(null)}
      />
    </ProviderLayout>
  );
}

// Week View Component - FIXED: Headers now sticky and above time slots, continuous blocked time blocks
function WeekView({ jobs, blockedTimes, currentDate, onSlotClick, onJobClick, onStatusChange, onDeleteJob, onBlockClick }: {
  jobs: Job[];
  blockedTimes: BlockedTime[];
  currentDate: Date;
  onSlotClick: (date: Date, hour: number) => void;
  onJobClick: (job: Job) => void;
  onStatusChange: (job: Job, status: string) => void;
  onDeleteJob: (jobId: string) => void;
  onBlockClick: (block: BlockedTime) => void
}) {
  const weekStart = getWeekStart(currentDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + i);
    return date;
  });

  const hours = Array.from({ length: 13 }, (_, i) => i + 7); // 7 AM to 7 PM
  const today = new Date();
  const HOUR_HEIGHT = 80; // min-h-[80px]

  const getJobsForDateAndHour = (date: Date, hour: number) => {
    return jobs.filter(job => {
      const jobStart = new Date(job.startTime);
      return (
        jobStart.getDate() === date.getDate() &&
        jobStart.getMonth() === date.getMonth() &&
        jobStart.getFullYear() === date.getFullYear() &&
        jobStart.getHours() === hour
      );
    });
  };

  // Get blocked time blocks for a specific date, with position and height
  const getBlockedTimesForDate = (date: Date) => {
    return blockedTimes.filter(block => {
      const blockStart = new Date(block.fromDate);
      const blockEnd = new Date(block.toDate);

      // Check if this date falls within the blocked time range
      const dateStart = new Date(date);
      dateStart.setHours(0, 0, 0, 0);
      const dateEnd = new Date(date);
      dateEnd.setHours(23, 59, 59, 999);

      return (blockStart <= dateEnd && blockEnd >= dateStart);
    }).map(block => {
      // Check if this is an all-day block (no specific times set)
      const isAllDay = !block.startTime || !block.endTime;

      let startHour: number;
      let endHour: number;

      if (isAllDay) {
        // All-day block: span entire calendar (7 AM - 8 PM)
        startHour = 7;
        endHour = 20; // 8 PM
      } else {
        // Specific time block: parse the time strings
        const [startTimeHour, startTimeMin] = block.startTime!.split(':').map(Number);
        const [endTimeHour, endTimeMin] = block.endTime!.split(':').map(Number);

        // Clamp to calendar range (7 AM - 8 PM)
        startHour = Math.max(7, Math.min(19, startTimeHour));
        endHour = Math.max(7, Math.min(20, endTimeHour === 0 && endTimeMin === 0 ? 24 : endTimeHour));
      }

      // Calculate position from top (0 = 7 AM)
      const topPosition = (startHour - 7) * HOUR_HEIGHT;
      const duration = endHour - startHour;
      const height = duration * HOUR_HEIGHT;

      return {
        ...block,
        topPosition,
        height,
        startHour,
        endHour,
        isAllDay,
      };
    });
  };

  const isHourBlocked = (date: Date, hour: number) => {
    return blockedTimes.some(block => {
      const blockStart = new Date(block.fromDate);
      const blockEnd = new Date(block.toDate);
      const checkTime = new Date(date);
      checkTime.setHours(hour, 0, 0, 0);
      return checkTime >= blockStart && checkTime <= blockEnd;
    });
  };

  const isToday = (date: Date) => {
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  return (
    <div className="bg-zinc-900/50 rounded-xl border border-zinc-800/50 overflow-hidden">
      <div className="overflow-x-auto">
        {/* FIXED: Day Headers - Now sticky and above grid */}
        <div className="grid grid-cols-8 border-b border-zinc-800/50 bg-zinc-900 sticky top-0 z-20">
          <div className="p-3 border-r border-zinc-800/30">
            <span className="text-xs font-medium text-zinc-500">TIME</span>
          </div>
          {weekDays.map((date, i) => (
            <div
              key={i}
              className={`p-3 text-center border-r border-zinc-800/30 last:border-r-0 ${
                isToday(date) ? 'bg-emerald-500/10' : ''
              }`}
            >
              <div className={`text-xs font-medium ${isToday(date) ? 'text-emerald-400' : 'text-zinc-400'}`}>
                {date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}
              </div>
              <div className={`text-xl font-bold mt-1 ${isToday(date) ? 'text-emerald-400' : 'text-zinc-100'}`}>
                {date.getDate()}
              </div>
            </div>
          ))}
        </div>

        {/* Time Grid with continuous blocked time blocks */}
        <div className="relative">
          {hours.map(hour => (
            <div key={hour} className="grid grid-cols-8 border-b border-zinc-800/30 min-h-[80px]">
              {/* Time Label */}
              <div className="p-3 border-r border-zinc-800/30 flex items-start bg-zinc-900/50">
                <span className="text-xs font-medium text-zinc-500">
                  {hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                </span>
              </div>

              {/* Day Columns */}
              {weekDays.map((date, dayIndex) => {
                const dayJobs = getJobsForDateAndHour(date, hour);
                const isBlocked = isHourBlocked(date, hour);

                return (
                  <div
                    key={dayIndex}
                    className={`relative p-2 border-r border-zinc-800/30 last:border-r-0 hover:bg-zinc-800/20 cursor-pointer transition-colors ${
                      isToday(date) ? 'bg-emerald-500/5' : ''
                    }`}
                    onClick={() => !isBlocked && onSlotClick(date, hour)}
                  >
                    <div className="space-y-2 relative z-10">
                      {dayJobs.map(job => (
                        <JobCard
                          key={job.id}
                          job={job}
                          onClick={onJobClick}
                          onStatusChange={onStatusChange}
                          onDeleteJob={onDeleteJob}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          {/* FIXED: Render continuous blocked time blocks as overlays */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="grid grid-cols-8 h-full">
              {/* Empty space for time labels */}
              <div></div>

              {/* Blocked time overlays for each day */}
              {weekDays.map((date, dayIndex) => {
                const blockedBlocks = getBlockedTimesForDate(date);

                return (
                  <div key={dayIndex} className="relative border-r border-zinc-800/30 last:border-r-0">
                    {blockedBlocks.map((block, blockIndex) => (
                      <div
                        key={blockIndex}
                        onClick={() => onBlockClick(block)}
                        className="absolute left-0 right-0 bg-red-900/20 border-2 border-dashed border-red-500/40 flex items-center justify-center pointer-events-auto cursor-pointer hover:bg-red-900/30 transition-colors"
                        style={{
                          top: `${block.topPosition}px`,
                          height: `${block.height}px`,
                        }}
                      >
                        <div className="text-center">
                          <Lock className="h-5 w-5 text-red-400 mx-auto mb-1" />
                          <span className="text-xs text-red-400 font-semibold">
                            {block.reason}
                          </span>
                          <p className="text-[10px] text-red-400/70 mt-0.5">
                            {block.isAllDay ? '🔒 All Day' : `${block.startHour === 12 ? '12 PM' : block.startHour > 12 ? `${block.startHour - 12} PM` : `${block.startHour} AM`} - ${block.endHour === 12 ? '12 PM' : block.endHour > 12 ? `${block.endHour - 12} PM` : `${block.endHour} AM`}`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Day View Component - FIXED: Continuous blocked time blocks
function DayView({ jobs, blockedTimes, currentDate, onSlotClick, onJobClick, onStatusChange, onDeleteJob, onBlockClick }: {
  jobs: Job[];
  blockedTimes: BlockedTime[];
  currentDate: Date;
  onSlotClick: (hour: number) => void;
  onJobClick: (job: Job) => void;
  onStatusChange: (job: Job, status: string) => void;
  onDeleteJob: (jobId: string) => void;
  onBlockClick: (block: BlockedTime) => void
}) {
  const hours = Array.from({ length: 13 }, (_, i) => i + 7);
  const HOUR_HEIGHT = 80; // min-h-[80px]

  const getJobsForHour = (hour: number) => {
    return jobs.filter(job => {
      const jobStart = new Date(job.startTime);
      return (
        jobStart.getDate() === currentDate.getDate() &&
        jobStart.getMonth() === currentDate.getMonth() &&
        jobStart.getFullYear() === currentDate.getFullYear() &&
        jobStart.getHours() === hour
      );
    });
  };

  const isHourBlocked = (hour: number) => {
    return blockedTimes.some(block => {
      const blockStart = new Date(block.fromDate);
      const blockEnd = new Date(block.toDate);
      const checkTime = new Date(currentDate);
      checkTime.setHours(hour, 0, 0, 0);
      return checkTime >= blockStart && checkTime <= blockEnd;
    });
  };

  // Get blocked time blocks for current date with position and height
  const getBlockedTimesForDate = () => {
    return blockedTimes.filter(block => {
      const blockStart = new Date(block.fromDate);
      const blockEnd = new Date(block.toDate);

      // Check if current date falls within the blocked time range
      const dateStart = new Date(currentDate);
      dateStart.setHours(0, 0, 0, 0);
      const dateEnd = new Date(currentDate);
      dateEnd.setHours(23, 59, 59, 999);

      return (blockStart <= dateEnd && blockEnd >= dateStart);
    }).map(block => {
      // Check if this is an all-day block (no specific times set)
      const isAllDay = !block.startTime || !block.endTime;

      let startHour: number;
      let endHour: number;

      if (isAllDay) {
        // All-day block: span entire calendar (7 AM - 8 PM)
        startHour = 7;
        endHour = 20; // 8 PM
      } else {
        // Specific time block: parse the time strings
        const [startTimeHour, startTimeMin] = block.startTime!.split(':').map(Number);
        const [endTimeHour, endTimeMin] = block.endTime!.split(':').map(Number);

        // Clamp to calendar range (7 AM - 8 PM)
        startHour = Math.max(7, Math.min(19, startTimeHour));
        endHour = Math.max(7, Math.min(20, endTimeHour === 0 && endTimeMin === 0 ? 24 : endTimeHour));
      }

      // Calculate position from top (0 = 7 AM)
      const topPosition = (startHour - 7) * HOUR_HEIGHT;
      const duration = endHour - startHour;
      const height = duration * HOUR_HEIGHT;

      return {
        ...block,
        topPosition,
        height,
        startHour,
        endHour,
        isAllDay,
      };
    });
  };

  const blockedBlocks = getBlockedTimesForDate();

  return (
    <div className="bg-zinc-900/50 rounded-xl border border-zinc-800/50 overflow-hidden max-w-2xl mx-auto relative">
      {hours.map(hour => {
        const isBlocked = isHourBlocked(hour);

        return (
          <div key={hour} className="border-b border-zinc-800/30 min-h-[80px] flex">
            <div className="w-24 p-3 border-r border-zinc-800/30 flex items-start bg-zinc-900/50">
              <span className="text-xs font-medium text-zinc-500">
                {hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
              </span>
            </div>
            <div
              className="relative flex-1 p-2 hover:bg-zinc-800/20 cursor-pointer"
              onClick={() => !isBlocked && onSlotClick(hour)}
            >
              <div className="space-y-2 relative z-10">
                {getJobsForHour(hour).map(job => (
                  <JobCard
                    key={job.id}
                    job={job}
                    onClick={onJobClick}
                    onStatusChange={onStatusChange}
                    onDeleteJob={onDeleteJob}
                  />
                ))}
              </div>
            </div>
          </div>
        );
      })}

      {/* FIXED: Render continuous blocked time blocks as overlay */}
      {blockedBlocks.map((block, blockIndex) => (
        <div
          key={blockIndex}
          onClick={() => onBlockClick(block)}
          className="absolute bg-red-900/20 border-2 border-dashed border-red-500/40 flex items-center justify-center pointer-events-auto cursor-pointer hover:bg-red-900/30 transition-colors"
          style={{
            top: `${block.topPosition}px`,
            height: `${block.height}px`,
            left: '96px', // w-24 = 96px for time label
            right: '0',
          }}
        >
          <div className="text-center">
            <Lock className="h-5 w-5 text-red-400 mx-auto mb-1" />
            <span className="text-xs text-red-400 font-semibold">
              {block.reason}
            </span>
            <p className="text-[10px] text-red-400/70 mt-0.5">
              {block.isAllDay ? '🔒 All Day' : `${block.startHour === 12 ? '12 PM' : block.startHour > 12 ? `${block.startHour - 12} PM` : `${block.startHour} AM`} - ${block.endHour === 12 ? '12 PM' : block.endHour > 12 ? `${block.endHour - 12} PM` : `${block.endHour} AM`}`}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// Month View with stats summary
interface MonthStats {
  totalRevenue: number;
  completedJobs: number;
  scheduledJobs: number;
  utilizationPercent: number;
}

function MonthView({ jobs, currentDate, stats }: { jobs: Job[]; currentDate: Date; stats: MonthStats }) {
  const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startDay = monthStart.getDay();
  const daysInMonth = monthEnd.getDate();
  const today = new Date();

  const weeks: Date[][] = [];
  let currentWeek: Date[] = [];

  // Fill empty days at the start
  for (let i = 0; i < startDay; i++) {
    const date = new Date(monthStart);
    date.setDate(date.getDate() - (startDay - i));
    currentWeek.push(date);
  }

  // Fill days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    currentWeek.push(date);

    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  // Fill remaining days
  if (currentWeek.length > 0) {
    const remaining = 7 - currentWeek.length;
    for (let i = 1; i <= remaining; i++) {
      const date = new Date(monthEnd);
      date.setDate(monthEnd.getDate() + i);
      currentWeek.push(date);
    }
    weeks.push(currentWeek);
  }

  const getJobsForDate = (date: Date) => {
    return jobs.filter(job => {
      const jobDate = new Date(job.startTime);
      return (
        jobDate.getDate() === date.getDate() &&
        jobDate.getMonth() === date.getMonth() &&
        jobDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const isToday = (date: Date) => {
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  return (
    <div className="space-y-4">
      {/* Monthly Stats Summary */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-zinc-100">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
            <p className="text-zinc-400 mt-1">
              Monthly overview
            </p>
          </div>
          <div className="text-center">
            <div className={`text-4xl font-bold ${stats.utilizationPercent > 70 ? 'text-emerald-400' : stats.utilizationPercent > 40 ? 'text-yellow-400' : 'text-zinc-400'}`}>
              {stats.utilizationPercent}%
            </div>
            <div className="text-sm text-zinc-500">Utilization</div>
          </div>
        </div>

        {/* Stat Cards Row - 4 cards for monthly view */}
        <div className="grid grid-cols-4 gap-4">
          {/* Total Revenue */}
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-emerald-400 opacity-70" />
              <span className="text-xs font-medium text-emerald-400 opacity-70">Revenue</span>
            </div>
            <div className="text-2xl font-bold text-emerald-400">
              ${stats.totalRevenue.toLocaleString()}
            </div>
            <div className="text-xs text-emerald-400 opacity-60 mt-0.5">this month</div>
          </div>

          {/* Completed Jobs */}
          <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="h-4 w-4 text-zinc-300 opacity-70" />
              <span className="text-xs font-medium text-zinc-300 opacity-70">Completed</span>
            </div>
            <div className="text-2xl font-bold text-zinc-300">{stats.completedJobs}</div>
            <div className="text-xs text-zinc-300 opacity-60 mt-0.5">jobs done</div>
          </div>

          {/* Scheduled Jobs */}
          <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-zinc-300 opacity-70" />
              <span className="text-xs font-medium text-zinc-300 opacity-70">Scheduled</span>
            </div>
            <div className="text-2xl font-bold text-zinc-300">{stats.scheduledJobs}</div>
            <div className="text-xs text-zinc-300 opacity-60 mt-0.5">total jobs</div>
          </div>

          {/* Completion Rate */}
          <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-zinc-300 opacity-70" />
              <span className="text-xs font-medium text-zinc-300 opacity-70">Completion</span>
            </div>
            <div className="text-2xl font-bold text-zinc-300">
              {stats.scheduledJobs > 0 ? Math.round((stats.completedJobs / stats.scheduledJobs) * 100) : 0}%
            </div>
            <div className="text-xs text-zinc-300 opacity-60 mt-0.5">rate</div>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-zinc-900/50 rounded-xl border border-zinc-800/50 overflow-hidden">
        {/* Day of week headers */}
        <div className="grid grid-cols-7 border-b border-zinc-800/50 bg-zinc-900">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-3 text-center border-r border-zinc-800/30 last:border-r-0">
              <span className="text-xs font-medium text-zinc-400">{day}</span>
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div>
          {weeks.map((week, weekIdx) => (
            <div key={weekIdx} className="grid grid-cols-7 border-b border-zinc-800/30 last:border-b-0">
              {week.map((date, dayIdx) => {
                const dayJobs = getJobsForDate(date);
                const jobCount = dayJobs.length;

                return (
                  <div
                    key={dayIdx}
                    className={`min-h-[100px] p-2 border-r border-zinc-800/30 last:border-r-0 ${
                      isCurrentMonth(date) ? '' : 'bg-zinc-950/50'
                    } ${isToday(date) ? 'bg-emerald-500/5' : ''}`}
                  >
                    <div className={`text-sm font-medium mb-2 ${
                      isToday(date) ? 'text-emerald-400' : isCurrentMonth(date) ? 'text-zinc-300' : 'text-zinc-600'
                    }`}>
                      {date.getDate()}
                    </div>

                    {/* Job indicators */}
                    <div className="space-y-1">
                      {dayJobs.slice(0, 3).map(job => (
                        <div
                          key={job.id}
                          className={`text-[10px] px-2 py-1 rounded truncate ${
                            job.status === 'scheduled' ? 'bg-blue-500/20 text-blue-400' :
                            job.status === 'in_progress' ? 'bg-yellow-500/20 text-yellow-400' :
                            job.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                            'bg-zinc-500/20 text-zinc-400'
                          }`}
                        >
                          {job.customerName}
                        </div>
                      ))}
                      {jobCount > 3 && (
                        <div className="text-[10px] text-zinc-500 pl-2">
                          +{jobCount - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// FIXED: Job Card Component - Better height sizing based on duration
function JobCard({ job, onClick, onStatusChange, onDeleteJob }: {
  job: Job;
  onClick?: (job: Job) => void;
  onStatusChange?: (job: Job, status: string) => void;
  onDeleteJob?: (jobId: string) => void
}) {
  const statusColors = {
    scheduled: 'bg-blue-500/20 border-blue-500/30 text-blue-400',
    in_progress: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400',
    completed: 'bg-green-500/20 border-green-500/30 text-green-400',
    cancelled: 'bg-zinc-500/20 border-zinc-500/30 text-zinc-400',
  };

  const startTime = new Date(job.startTime);
  const endTime = new Date(job.endTime);
  const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60); // hours

  // FIXED: Calculate height based on duration
  const heightClass = duration >= 2 ? 'min-h-[60px]' : '';

  return (
    <div className="relative group" data-job-id={job.id}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (onClick) onClick(job);
        }}
        className={`w-full p-2 rounded-lg border text-left transition-all hover:shadow-lg ${statusColors[job.status]} ${heightClass}`}
      >
        <div className="flex items-start justify-between mb-1">
          <p className="text-xs font-semibold truncate flex-1 pr-6">{job.customerName}</p>
          {job.isRenoaLead && (
            <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded ml-2 whitespace-nowrap">
              Renoa
            </span>
          )}
        </div>
        <p className="text-[10px] opacity-75 truncate mb-1">{job.serviceType}</p>
        <p className="text-[10px] opacity-60">
          {startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
          {' - '}
          {endTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
        </p>
        {duration > 1 && (
          <div className="mt-1 text-[10px] opacity-50">
            ({duration.toFixed(1)}h)
          </div>
        )}
      </button>

      {/* Context Menu Button */}
      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {onStatusChange && onDeleteJob && (
          <JobCardContextMenu
            job={job}
            onStatusChange={(status) => onStatusChange(job, status)}
            onEdit={() => onClick && onClick(job)}
            onDelete={() => onDeleteJob(job.id)}
          />
        )}
      </div>
    </div>
  );
}

// Helper function
function getWeekStart(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}
