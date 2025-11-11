"use client"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProviderLayout from '@/components/provider/ProviderLayout';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Plus, Clock } from 'lucide-react';
import { toast } from 'sonner';
import AddJobModal from '@/components/provider/AddJobModal';
import BlockTimeModal from '@/components/provider/BlockTimeModal';
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

export default function ProviderCalendar() {
  const router = useRouter();
  const [providerName, setProviderName] = useState('');
  const [providerId, setProviderId] = useState('');
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAddJobModal, setShowAddJobModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ date: Date; hour: number } | null>(null);
  const [showBlockTimeModal, setShowBlockTimeModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [statusChangeJob, setStatusChangeJob] = useState<Job | null>(null);
  const [targetStatus, setTargetStatus] = useState<string>('');

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
        <div className="border-b border-zinc-800/50 bg-zinc-900/30 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-[1600px] mx-auto px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              {/* Left: Title + Date Range */}
              <div>
                <h1 className="text-2xl font-bold text-zinc-100">Calendar</h1>
                <p className="text-sm text-zinc-400 mt-1">{getDateRangeText()}</p>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => {
                    setSelectedSlot(null);
                    setShowAddJobModal(true);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Job
                </Button>
                <Button
                  onClick={() => setShowBlockTimeModal(true)}
                  variant="outline"
                  className="border-zinc-700 hover:bg-zinc-800"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Block Time
                </Button>
              </div>
            </div>

            {/* View Controls */}
            <div className="flex items-center justify-between">
              {/* View Toggles */}
              <div className="flex items-center gap-2 bg-zinc-900/50 rounded-lg p-1 border border-zinc-800">
                <button
                  onClick={() => setViewMode('day')}
                  className={`px-4 py-1.5 text-sm font-medium rounded transition-all ${
                    viewMode === 'day'
                      ? 'bg-emerald-600 text-white'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Day
                </button>
                <button
                  onClick={() => setViewMode('week')}
                  className={`px-4 py-1.5 text-sm font-medium rounded transition-all ${
                    viewMode === 'week'
                      ? 'bg-emerald-600 text-white'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Week
                </button>
                <button
                  onClick={() => setViewMode('month')}
                  className={`px-4 py-1.5 text-sm font-medium rounded transition-all ${
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
                  className="border-zinc-700 hover:bg-zinc-800"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  onClick={goToToday}
                  size="sm"
                  variant="outline"
                  className="border-zinc-700 hover:bg-zinc-800 px-6"
                >
                  Today
                </Button>
                <Button
                  onClick={navigateNext}
                  size="sm"
                  variant="outline"
                  className="border-zinc-700 hover:bg-zinc-800"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar Views */}
        <div className="max-w-[1600px] mx-auto px-6 py-6">
          {viewMode === 'week' && (
            <WeekView
              jobs={jobs}
              currentDate={currentDate}
              onSlotClick={(date, hour) => {
                setSelectedSlot({ date, hour });
                setShowAddJobModal(true);
              }}
              onJobClick={(job) => setSelectedJob(job)}
              onStatusChange={handleStatusChange}
              onDeleteJob={handleDeleteJob}
            />
          )}
          {viewMode === 'day' && (
            <DayView
              jobs={jobs}
              currentDate={currentDate}
              onSlotClick={(hour) => {
                setSelectedSlot({ date: currentDate, hour });
                setShowAddJobModal(true);
              }}
              onJobClick={(job) => setSelectedJob(job)}
              onStatusChange={handleStatusChange}
              onDeleteJob={handleDeleteJob}
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
          // Refresh calendar to show blocked times
          fetchJobs(providerId);
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
    </ProviderLayout>
  );
}

// Week View Component
function WeekView({ jobs, currentDate, onSlotClick, onJobClick, onStatusChange, onDeleteJob }: { jobs: Job[]; currentDate: Date; onSlotClick: (date: Date, hour: number) => void; onJobClick: (job: Job) => void; onStatusChange: (job: Job, status: string) => void; onDeleteJob: (jobId: string) => void }) {
  const weekStart = getWeekStart(currentDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + i);
    return date;
  });

  const hours = Array.from({ length: 13 }, (_, i) => i + 7); // 7 AM to 7 PM
  const today = new Date();

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

  const isToday = (date: Date) => {
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  return (
    <div className="bg-zinc-900/50 rounded-xl border border-zinc-800/50 overflow-hidden">
      {/* Day Headers */}
      <div className="grid grid-cols-8 border-b border-zinc-800/50 bg-zinc-900/80 sticky top-[140px] z-10">
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

      {/* Time Grid */}
      <div>
        {hours.map(hour => (
          <div key={hour} className="grid grid-cols-8 border-b border-zinc-800/30 min-h-[80px]">
            {/* Time Label */}
            <div className="p-3 border-r border-zinc-800/30 flex items-start">
              <span className="text-xs font-medium text-zinc-500">
                {hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
              </span>
            </div>

            {/* Day Columns */}
            {weekDays.map((date, i) => {
              const dayJobs = getJobsForDateAndHour(date, hour);

              return (
                <div
                  key={i}
                  className={`p-2 border-r border-zinc-800/30 last:border-r-0 hover:bg-zinc-800/20 cursor-pointer transition-colors ${
                    isToday(date) ? 'bg-emerald-500/5' : ''
                  }`}
                  onClick={() => onSlotClick(date, hour)}
                >
                  <div className="space-y-2">
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
      </div>
    </div>
  );
}

// Day View Component
function DayView({ jobs, currentDate, onSlotClick, onJobClick, onStatusChange, onDeleteJob }: { jobs: Job[]; currentDate: Date; onSlotClick: (hour: number) => void; onJobClick: (job: Job) => void; onStatusChange: (job: Job, status: string) => void; onDeleteJob: (jobId: string) => void }) {
  const hours = Array.from({ length: 13 }, (_, i) => i + 7);

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

  return (
    <div className="bg-zinc-900/50 rounded-xl border border-zinc-800/50 overflow-hidden max-w-2xl mx-auto">
      {hours.map(hour => (
        <div key={hour} className="border-b border-zinc-800/30 min-h-[80px] flex">
          <div className="w-24 p-3 border-r border-zinc-800/30 flex items-start">
            <span className="text-xs font-medium text-zinc-500">
              {hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
            </span>
          </div>
          <div className="flex-1 p-2 hover:bg-zinc-800/20 cursor-pointer" onClick={() => onSlotClick(hour)}>
            <div className="space-y-2">
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
      ))}
    </div>
  );
}

// Month View Component
function MonthView({ jobs, currentDate }: { jobs: Job[]; currentDate: Date }) {
  return (
    <div className="bg-zinc-900/50 rounded-xl border border-zinc-800/50 p-6 text-center">
      <p className="text-zinc-400">Month view coming soon</p>
      <p className="text-sm text-zinc-500 mt-2">For now, use Week or Day view</p>
    </div>
  );
}

// Job Card Component
function JobCard({ job, onClick, onStatusChange, onDeleteJob }: { job: Job; onClick?: (job: Job) => void; onStatusChange?: (job: Job, status: string) => void; onDeleteJob?: (jobId: string) => void }) {
  const statusColors = {
    scheduled: 'bg-blue-500/20 border-blue-500/30 text-blue-400',
    in_progress: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400',
    completed: 'bg-green-500/20 border-green-500/30 text-green-400',
    cancelled: 'bg-zinc-500/20 border-zinc-500/30 text-zinc-400',
  };

  const startTime = new Date(job.startTime);
  const endTime = new Date(job.endTime);
  const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60); // hours

  return (
    <div className="relative group" data-job-id={job.id}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (onClick) onClick(job);
        }}
        className={`w-full p-2 rounded-lg border text-left transition-all hover:shadow-lg ${statusColors[job.status]}`}
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
          <div className="mt-1 h-1 bg-current opacity-20 rounded-full" />
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
