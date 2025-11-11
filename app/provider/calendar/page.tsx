"use client"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProviderLayout from '@/components/provider/ProviderLayout';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Plus, Clock, Lock } from 'lucide-react';
import { toast } from 'sonner';
import AddJobModal from '@/components/provider/AddJobModal';
import BlockTimeModal from '@/components/provider/BlockTimeModal';
import DeleteBlockTimeModal from '@/components/provider/DeleteBlockTimeModal';
import JobDetailPanel from '@/components/provider/JobDetailPanel';
import StatusChangeDialog from '@/components/provider/StatusChangeDialog';
import JobCardContextMenu from '@/components/provider/JobCardContextMenu';

type ViewMode = 'day' | 'week' | 'month';

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
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('week');
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

  useEffect(() => {
    const id = localStorage.getItem('providerId');
    const name = localStorage.getItem('providerName');

    if (!id || !name) {
      router.push('/provider/login');
      return;
    }

    setProviderId(id);
    setProviderName(name);
    fetchJobs(id);
    fetchBlockedTimes(id);
  }, [router]);

  const fetchJobs = async (id: string) => {
    try {
      const res = await fetch(`/api/provider/jobs?providerId=${id}`);
      const data = await res.json();

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

  const handleStatusChange = (job: Job, status: string) => {
    setStatusChangeJob(job);
    setTargetStatus(status);
    setShowStatusDialog(true);
  };

  const handleDeleteJob = async (jobId: string) => {
    try {
      const res = await fetch(`/api/provider/jobs/${jobId}`, {
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

  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
    return new Date(d.setDate(diff));
  };

  if (loading) {
    return (
      <ProviderLayout providerName={providerName}>
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        </div>
      </ProviderLayout>
    );
  }

  return (
    <ProviderLayout providerName={providerName}>
      <div className="min-h-screen bg-zinc-950">
        {/* Header */}
        <div className="border-b border-zinc-800/50 bg-zinc-900/30 backdrop-blur-sm">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
              {/* Left: Title + Date Range */}
              <div>
                <h1 className="text-2xl font-bold text-zinc-100">Calendar</h1>
                <p className="text-sm text-zinc-400 mt-1">{getDateRangeText()}</p>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Button
                  onClick={() => {
                    setSelectedSlot(null);
                    setShowAddJobModal(true);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white flex-1 sm:flex-none"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Job
                </Button>
                <Button
                  onClick={() => setShowBlockTimeModal(true)}
                  variant="outline"
                  className="border-zinc-700 hover:bg-zinc-800 flex-1 sm:flex-none"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Block Time
                </Button>
              </div>
            </div>

            {/* View Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              {/* View Toggles */}
              <div className="flex items-center gap-2 bg-zinc-900/50 rounded-lg p-1 border border-zinc-800">
                <button
                  onClick={() => setViewMode('day')}
                  className={`flex-1 sm:flex-none px-4 py-1.5 text-sm font-medium rounded transition-all ${
                    viewMode === 'day'
                      ? 'bg-emerald-600 text-white'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Day
                </button>
                <button
                  onClick={() => setViewMode('week')}
                  className={`flex-1 sm:flex-none px-4 py-1.5 text-sm font-medium rounded transition-all ${
                    viewMode === 'week'
                      ? 'bg-emerald-600 text-white'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Week
                </button>
                <button
                  onClick={() => setViewMode('month')}
                  className={`flex-1 sm:flex-none px-4 py-1.5 text-sm font-medium rounded transition-all ${
                    viewMode === 'month'
                      ? 'bg-emerald-600 text-white'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Month
                </button>
              </div>

              {/* Navigation */}
              <div className="flex items-center gap-2">
                <Button
                  onClick={navigatePrev}
                  size="sm"
                  variant="outline"
                  className="border-zinc-700 hover:bg-zinc-800 flex-1 sm:flex-none"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  onClick={goToToday}
                  size="sm"
                  variant="outline"
                  className="border-zinc-700 hover:bg-zinc-800 px-6 flex-1 sm:flex-none"
                >
                  Today
                </Button>
                <Button
                  onClick={navigateNext}
                  size="sm"
                  variant="outline"
                  className="border-zinc-700 hover:bg-zinc-800 flex-1 sm:flex-none"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar Views */}
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
          {viewMode === 'week' && (
            <WeekView
              jobs={jobs}
              blockedTimes={blockedTimes}
              currentDate={currentDate}
              onSlotClick={(date, hour) => {
                setSelectedSlot({ date, hour });
                setShowAddJobModal(true);
              }}
              onJobClick={(job) => setSelectedJob(job)}
              onStatusChange={handleStatusChange}
              onDeleteJob={handleDeleteJob}
              onBlockClick={handleBlockClick}
            />
          )}
          {viewMode === 'day' && (
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
          {viewMode === 'month' && <MonthView jobs={jobs} currentDate={currentDate} />}
        </div>
      </div>

      {/* Add Job Modal */}
      <AddJobModal
        isOpen={showAddJobModal}
        onClose={() => {
          setShowAddJobModal(false);
          setSelectedSlot(null);
        }}
        providerId={providerId}
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

      {/* Job Detail Panel */}
      <JobDetailPanel
        job={selectedJob}
        isOpen={!!selectedJob}
        onClose={() => setSelectedJob(null)}
        onJobUpdated={() => fetchJobs(providerId)}
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
      const blockStart = new Date(block.fromDate);
      const blockEnd = new Date(block.toDate);

      // Calculate start hour (clamp to 7 AM - 7 PM range)
      const startHour = Math.max(7, Math.min(19, blockStart.getHours()));
      const endHour = Math.max(7, Math.min(20, blockEnd.getHours() + 1)); // +1 to include the end hour

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
      <div className="overflow-auto max-h-[calc(100vh-250px)]">
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
                            {block.startHour === 12 ? '12 PM' : block.startHour > 12 ? `${block.startHour - 12} PM` : `${block.startHour} AM`} - {block.endHour === 12 ? '12 PM' : block.endHour > 12 ? `${block.endHour - 12} PM` : `${block.endHour} AM`}
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
      const blockStart = new Date(block.fromDate);
      const blockEnd = new Date(block.toDate);

      // Calculate start hour (clamp to 7 AM - 7 PM range)
      const startHour = Math.max(7, Math.min(19, blockStart.getHours()));
      const endHour = Math.max(7, Math.min(20, blockEnd.getHours() + 1)); // +1 to include the end hour

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
              {block.startHour === 12 ? '12 PM' : block.startHour > 12 ? `${block.startHour - 12} PM` : `${block.startHour} AM`} - {block.endHour === 12 ? '12 PM' : block.endHour > 12 ? `${block.endHour - 12} PM` : `${block.endHour} AM`}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// FIXED: Month View - Proper implementation with job indicators
function MonthView({ jobs, currentDate }: { jobs: Job[]; currentDate: Date }) {
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
