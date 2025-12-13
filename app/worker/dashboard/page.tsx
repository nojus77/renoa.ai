'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import WorkerLayout from '@/components/worker/WorkerLayout';
import {
  ChevronRight,
  Loader2,
  RefreshCw,
  DollarSign,
  Briefcase,
  Plus,
  X,
  Search,
  User,
  Calendar,
  CalendarX,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';

interface Job {
  id: string;
  serviceType: string;
  address: string;
  startTime: string;
  endTime: string;
  status: string;
  onTheWayAt: string | null;
  arrivedAt: string | null;
  completedAt: string | null;
  customerNotes: string | null;
  internalNotes: string | null;
  customer: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
  };
  workLogs: {
    id: string;
    clockIn: string;
    clockOut: string | null;
    hoursWorked: number | null;
    earnings: number | null;
  }[];
}

interface UpcomingJob {
  id: string;
  serviceType: string;
  address: string;
  startTime: string;
  customer: {
    name: string;
  };
}

interface DayStats {
  jobsCount: number;
  hoursWorked: number;
  earnings: number;
}

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  address: string;
}

export default function WorkerDashboard() {
  const router = useRouter();
  const [userId, setUserId] = useState<string>('');
  const [providerId, setProviderId] = useState<string>('');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [upcomingJobs, setUpcomingJobs] = useState<UpcomingJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DayStats>({ jobsCount: 0, hoursWorked: 0, earnings: 0 });
  const [canCreateJobs, setCanCreateJobs] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Job creation modal state
  const [showCreateJob, setShowCreateJob] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [creatingJob, setCreatingJob] = useState(false);
  const [newJob, setNewJob] = useState({
    serviceType: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '10:00',
    notes: '',
  });

  const fetchJobs = useCallback(async (uid: string) => {
    try {
      const res = await fetch(`/api/worker/jobs/today?userId=${uid}`);
      const data = await res.json();

      if (data.jobs) {
        setJobs(data.jobs);
        // Calculate stats
        const completed = data.jobs.filter((j: Job) => j.status === 'completed');
        const hours = completed.reduce((sum: number, j: Job) => {
          const log = j.workLogs?.[0];
          return sum + (log?.hoursWorked || 0);
        }, 0);
        const earnings = completed.reduce((sum: number, j: Job) => {
          const log = j.workLogs?.[0];
          return sum + (log?.earnings || 0);
        }, 0);
        setStats({
          jobsCount: data.jobs.length,
          hoursWorked: Math.round(hours * 100) / 100,
          earnings: Math.round(earnings * 100) / 100,
        });
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUpcomingJobs = useCallback(async (uid: string) => {
    try {
      const res = await fetch(`/api/worker/jobs/upcoming?userId=${uid}&limit=3`);
      const data = await res.json();
      if (data.jobs) {
        setUpcomingJobs(data.jobs);
      }
    } catch (error) {
      console.error('Error fetching upcoming jobs:', error);
    }
  }, []);

  const fetchWorkerPermissions = useCallback(async (uid: string) => {
    try {
      const res = await fetch(`/api/worker/profile?userId=${uid}`);
      const data = await res.json();
      // Check provider-level permission (applies to ALL workers)
      if (data.user?.provider?.workersCanCreateJobs) {
        setCanCreateJobs(true);
      }
    } catch (error) {
      console.error('Error fetching worker permissions:', error);
    }
  }, []);

  const fetchCustomers = useCallback(async (pid: string, search: string = '') => {
    try {
      const res = await fetch(`/api/provider/customers?providerId=${pid}&search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (data.customers) {
        setCustomers(data.customers.slice(0, 10)); // Limit to 10 results
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  }, []);

  useEffect(() => {
    const uid = localStorage.getItem('workerUserId');
    const pid = localStorage.getItem('workerProviderId');

    if (!uid || !pid) {
      router.push('/provider/login');
      return;
    }

    setUserId(uid);
    setProviderId(pid);
    fetchJobs(uid);
    fetchUpcomingJobs(uid);
    fetchWorkerPermissions(uid);
  }, [router, fetchJobs, fetchUpcomingJobs, fetchWorkerPermissions]);

  // Live clock update every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Customer search with debounce
  useEffect(() => {
    if (showCreateJob && providerId) {
      const timer = setTimeout(() => {
        fetchCustomers(providerId, customerSearch);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [customerSearch, showCreateJob, providerId, fetchCustomers]);

  const handleCreateJob = async () => {
    if (!selectedCustomer) {
      toast.error('Please select a customer');
      return;
    }
    if (!newJob.serviceType.trim()) {
      toast.error('Please enter a service type');
      return;
    }

    setCreatingJob(true);
    try {
      const startDateTime = new Date(`${newJob.date}T${newJob.startTime}`);
      const endDateTime = new Date(`${newJob.date}T${newJob.endTime}`);

      const res = await fetch('/api/worker/jobs/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          providerId,
          customerId: selectedCustomer.id,
          serviceType: newJob.serviceType.trim(),
          address: selectedCustomer.address,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          notes: newJob.notes.trim() || null,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(data.message);
        setShowCreateJob(false);
        setSelectedCustomer(null);
        setCustomerSearch('');
        setNewJob({
          serviceType: '',
          date: new Date().toISOString().split('T')[0],
          startTime: '09:00',
          endTime: '10:00',
          notes: '',
        });
        fetchJobs(userId);
        fetchUpcomingJobs(userId);
      } else {
        toast.error(data.error || 'Failed to create job');
      }
    } catch (error) {
      console.error('Error creating job:', error);
      toast.error('Something went wrong');
    } finally {
      setCreatingJob(false);
    }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatUpcomingDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Check if tomorrow
    if (date.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow, ${formatTime(dateStr)}`;
    }

    // Check if within this week
    const daysUntil = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntil <= 7) {
      return date.toLocaleDateString('en-US', { weekday: 'long' }) + ', ' + formatTime(dateStr);
    }

    // Otherwise show date
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ', ' + formatTime(dateStr);
  };

  const getJobStatus = (job: Job) => {
    if (job.completedAt) return 'completed';
    if (job.workLogs?.some((l) => l.clockIn && !l.clockOut)) return 'working';
    if (job.arrivedAt) return 'arrived';
    if (job.onTheWayAt) return 'on_the_way';
    return 'scheduled';
  };

  // Navigate to job details
  const handleJobClick = (jobId: string) => {
    router.push(`/worker/job/${jobId}`);
  };

  // Get left border color based on status
  const getLeftBorderColor = (job: Job) => {
    const status = getJobStatus(job);
    switch (status) {
      case 'completed':
        return 'border-l-purple-500';
      case 'working':
        return 'border-l-[#a3e635]';
      case 'on_the_way':
      case 'arrived':
        return 'border-l-blue-500';
      default:
        return 'border-l-[#a3e635]';
    }
  };

  // Get status badge for completed/cancelled jobs only
  const getStatusBadge = (job: Job) => {
    const status = getJobStatus(job);
    if (status === 'completed') {
      return (
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400">
          completed
        </span>
      );
    }
    if (status === 'working') {
      return (
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#a3e635]/20 text-[#a3e635]">
          in progress
        </span>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <WorkerLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-[#a3e635]" />
        </div>
      </WorkerLayout>
    );
  }

  return (
    <WorkerLayout>
      <div className="p-4 space-y-8">
        {/* Elegant Clock Header */}
        <div className="flex items-start justify-between">
          {/* Clock Display - Apple Watch Style */}
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-light text-[#a3e635]">
                {currentTime.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: false,
                }).split(':')[0]}
              </span>
              <span className="text-5xl font-light text-[#a3e635]">:</span>
              <span className="text-5xl font-light text-[#a3e635]">
                {currentTime.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: false,
                }).split(':')[1]}
              </span>
              <span className="text-xl font-light text-[#a3e635]/80 ml-1">
                {currentTime.getHours() >= 12 ? 'PM' : 'AM'}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {currentTime.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {canCreateJobs && (
              <button
                onClick={() => setShowCreateJob(true)}
                className="p-2.5 bg-[#a3e635] hover:bg-[#8bc934] rounded-xl transition-colors"
              >
                <Plus className="w-5 h-5 text-zinc-900" />
              </button>
            )}
            <button
              onClick={() => {
                fetchJobs(userId);
                fetchUpcomingJobs(userId);
              }}
              className="p-2.5 bg-[#2a2a2a] rounded-xl hover:bg-zinc-700 transition-colors"
            >
              <RefreshCw className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Refined Stat Cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-[#2a2a2a] rounded-xl p-4 text-center">
            <Briefcase className="w-6 h-6 text-[#a3e635] mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{stats.jobsCount}</p>
            <p className="text-xs text-gray-500">Jobs Today</p>
          </div>
          <div className="bg-[#2a2a2a] rounded-xl p-4 text-center">
            <Clock className="w-6 h-6 text-[#a3e635] mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{stats.hoursWorked}h</p>
            <p className="text-xs text-gray-500">Hours</p>
          </div>
          <div className="bg-[#2a2a2a] rounded-xl p-4 text-center">
            <DollarSign className="w-6 h-6 text-[#a3e635] mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">${stats.earnings}</p>
            <p className="text-xs text-gray-500">Earned</p>
          </div>
        </div>

        {/* Today's Jobs Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Today&apos;s Jobs</h2>

          {jobs.length === 0 ? (
            <div className="bg-[#2a2a2a] rounded-xl py-12 text-center">
              <CalendarX className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No jobs scheduled for today</p>
              <p className="text-gray-500 text-sm mt-1">Enjoy your day off!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => (
                <button
                  key={job.id}
                  onClick={() => handleJobClick(job.id)}
                  className={`w-full bg-[#2a2a2a] rounded-xl py-4 px-5 text-left border-l-[3px] ${getLeftBorderColor(job)} hover:bg-zinc-700/50 transition-colors active:scale-[0.99]`}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1 min-w-0">
                      {/* Time - Lime green */}
                      <p className="text-sm font-medium text-[#a3e635]">
                        {formatTime(job.startTime)} - {formatTime(job.endTime)}
                      </p>
                      {/* Service Type + Customer */}
                      <p className="text-base font-medium text-white">
                        {job.serviceType} - {job.customer.name}
                      </p>
                      {/* Address */}
                      <p className="text-sm text-gray-400 truncate">{job.address}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-3 shrink-0">
                      {getStatusBadge(job)}
                      <ChevronRight className="w-5 h-5 text-gray-500" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Jobs Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Upcoming Jobs</h2>

          {upcomingJobs.length === 0 ? (
            <div className="bg-[#2a2a2a] rounded-xl py-8 text-center">
              <p className="text-gray-500">No upcoming jobs scheduled</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingJobs.map((job) => (
                <button
                  key={job.id}
                  onClick={() => handleJobClick(job.id)}
                  className="w-full bg-[#2a2a2a] rounded-xl py-4 px-5 text-left border-l-[3px] border-l-[#a3e635] hover:bg-zinc-700/50 transition-colors active:scale-[0.99]"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1 min-w-0">
                      {/* Date/Time - Lime green */}
                      <p className="text-sm font-medium text-[#a3e635]">
                        {formatUpcomingDate(job.startTime)}
                      </p>
                      {/* Service Type + Customer */}
                      <p className="text-base font-medium text-white">
                        {job.serviceType} - {job.customer.name}
                      </p>
                      {/* Address */}
                      <p className="text-sm text-gray-400 truncate">{job.address}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-500 flex-shrink-0 ml-3" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Job Modal */}
      {showCreateJob && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => {
              setShowCreateJob(false);
              setSelectedCustomer(null);
              setCustomerSearch('');
            }}
          />

          {/* Modal */}
          <div className="relative bg-zinc-900 w-full sm:max-w-md sm:rounded-xl rounded-t-xl max-h-[85vh] flex flex-col border border-zinc-800">
            {/* Header - fixed */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-800 shrink-0">
              <h2 className="text-lg font-semibold text-white">Add New Job</h2>
              <button
                onClick={() => {
                  setShowCreateJob(false);
                  setSelectedCustomer(null);
                  setCustomerSearch('');
                }}
                className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>

            {/* Content - scrollable */}
            <div className="p-4 overflow-y-auto flex-1 space-y-4">
              {/* Customer Selection */}
              <div className="space-y-2">
                <label className="text-base font-medium text-zinc-300">Customer</label>
                {selectedCustomer ? (
                  <div className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg border border-[#a3e635]/30">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#a3e635]/20 flex items-center justify-center">
                        <User className="w-5 h-5 text-[#a3e635]" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{selectedCustomer.name}</p>
                        <p className="text-zinc-400 text-sm">{selectedCustomer.address}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedCustomer(null)}
                      className="p-1 hover:bg-zinc-700 rounded"
                    >
                      <X className="w-4 h-4 text-zinc-400" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                      <input
                        type="text"
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                        placeholder="Search customers..."
                        className="w-full pl-10 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-base text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#a3e635]"
                        style={{ fontSize: '16px' }}
                      />
                    </div>
                    {customers.length > 0 && (
                      <div className="bg-zinc-800 rounded-lg border border-zinc-700 max-h-48 overflow-y-auto">
                        {customers.map((customer) => (
                          <button
                            key={customer.id}
                            onClick={() => {
                              setSelectedCustomer(customer);
                              setCustomerSearch('');
                            }}
                            className="w-full p-3 text-left hover:bg-zinc-700 border-b border-zinc-700 last:border-b-0 transition-colors"
                          >
                            <p className="text-white font-medium">{customer.name}</p>
                            <p className="text-zinc-400 text-sm truncate">{customer.address}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Service Type */}
              <div className="space-y-2">
                <label className="text-base font-medium text-zinc-300">Service Type</label>
                <input
                  type="text"
                  value={newJob.serviceType}
                  onChange={(e) => setNewJob({ ...newJob, serviceType: e.target.value })}
                  placeholder="e.g. Window Cleaning, Lawn Care"
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-base text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#a3e635]"
                  style={{ fontSize: '16px' }}
                />
              </div>

              {/* Date */}
              <div className="space-y-2">
                <label className="text-base font-medium text-zinc-300">Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                  <input
                    type="date"
                    value={newJob.date}
                    onChange={(e) => setNewJob({ ...newJob, date: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-base text-white focus:outline-none focus:border-[#a3e635]"
                    style={{ fontSize: '16px' }}
                  />
                </div>
              </div>

              {/* Time Range */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-base font-medium text-zinc-300">Start Time</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                    <input
                      type="time"
                      value={newJob.startTime}
                      onChange={(e) => setNewJob({ ...newJob, startTime: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-base text-white focus:outline-none focus:border-[#a3e635]"
                      style={{ fontSize: '16px' }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-base font-medium text-zinc-300">End Time</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                    <input
                      type="time"
                      value={newJob.endTime}
                      onChange={(e) => setNewJob({ ...newJob, endTime: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-base text-white focus:outline-none focus:border-[#a3e635]"
                      style={{ fontSize: '16px' }}
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <label className="text-base font-medium text-zinc-300">Notes (optional)</label>
                <textarea
                  value={newJob.notes}
                  onChange={(e) => setNewJob({ ...newJob, notes: e.target.value })}
                  placeholder="Any additional notes..."
                  rows={3}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-base text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#a3e635] resize-none"
                  style={{ fontSize: '16px' }}
                />
              </div>
            </div>

            {/* Footer with button - fixed at bottom */}
            <div className="p-4 border-t border-zinc-800 bg-zinc-900 shrink-0">
              <button
                onClick={handleCreateJob}
                disabled={creatingJob || !selectedCustomer || !newJob.serviceType.trim()}
                className="w-full py-4 bg-[#a3e635] hover:bg-[#8bc934] disabled:bg-zinc-700 disabled:text-zinc-500 text-zinc-900 font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                {creatingJob ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    Create Job
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </WorkerLayout>
  );
}
