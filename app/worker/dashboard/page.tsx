'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import WorkerLayout from '@/components/worker/WorkerLayout';
import {
  MapPin,
  Phone,
  Clock,
  ChevronRight,
  Navigation,
  CheckCircle2,
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
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
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

  const handleAction = async (job: Job, action: string) => {
    setActionLoading(`${job.id}-${action}`);

    try {
      let endpoint = '';
      let body: Record<string, unknown> = {};

      switch (action) {
        case 'on_the_way':
        case 'arrived':
          endpoint = '/api/worker/jobs/status';
          body = { jobId: job.id, userId, action };
          break;
        case 'start':
          endpoint = '/api/worker/clock-in';
          body = { jobId: job.id, userId, providerId };
          break;
        case 'complete':
          endpoint = '/api/worker/clock-out';
          body = { jobId: job.id, userId };
          break;
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(
          action === 'on_the_way'
            ? 'Marked as on the way!'
            : action === 'arrived'
            ? 'Marked as arrived!'
            : action === 'start'
            ? 'Job started!'
            : `Job completed! Earned $${data.earnings?.toFixed(2) || '0.00'}`
        );
        fetchJobs(userId);
      } else {
        toast.error(data.error || 'Action failed');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Something went wrong');
    } finally {
      setActionLoading(null);
    }
  };

  const openMaps = (address: string) => {
    const encoded = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encoded}`, '_blank');
  };

  const callPhone = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const renderActionButton = (job: Job) => {
    const status = getJobStatus(job);
    const isLoading = (action: string) => actionLoading === `${job.id}-${action}`;

    switch (status) {
      case 'scheduled':
        return (
          <button
            onClick={() => handleAction(job, 'on_the_way')}
            disabled={!!actionLoading}
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
          >
            {isLoading('on_the_way') ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Navigation className="w-5 h-5" />
                On My Way
              </>
            )}
          </button>
        );
      case 'on_the_way':
        return (
          <button
            onClick={() => handleAction(job, 'arrived')}
            disabled={!!actionLoading}
            className="w-full py-4 bg-orange-600 hover:bg-orange-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
          >
            {isLoading('arrived') ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <MapPin className="w-5 h-5" />
                I&apos;ve Arrived
              </>
            )}
          </button>
        );
      case 'arrived':
        return (
          <button
            onClick={() => handleAction(job, 'start')}
            disabled={!!actionLoading}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
          >
            {isLoading('start') ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Clock className="w-5 h-5" />
                Start Job
              </>
            )}
          </button>
        );
      case 'working':
        return (
          <button
            onClick={() => handleAction(job, 'complete')}
            disabled={!!actionLoading}
            className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
          >
            {isLoading('complete') ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Complete Job
              </>
            )}
          </button>
        );
      case 'completed':
        return (
          <div className="w-full py-3 bg-zinc-800 text-emerald-400 font-semibold rounded-xl flex items-center justify-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            Completed
          </div>
        );
    }
  };

  const getStatusBadge = (job: Job) => {
    const status = getJobStatus(job);
    const styles: Record<string, string> = {
      scheduled: 'bg-zinc-700 text-zinc-300',
      on_the_way: 'bg-blue-500/20 text-blue-400',
      arrived: 'bg-orange-500/20 text-orange-400',
      working: 'bg-[#a3e635]/20 text-[#a3e635]',
      completed: 'bg-purple-500/20 text-purple-400',
    };
    const labels: Record<string, string> = {
      scheduled: 'Scheduled',
      on_the_way: 'On the way',
      arrived: 'Arrived',
      working: 'In Progress',
      completed: 'Completed',
    };

    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
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
        {/* Header with Clock */}
        <div className="flex items-center justify-between">
          {/* Clock Display */}
          <div>
            <p className="text-3xl font-bold text-[#a3e635]">
              {currentTime.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              })}
            </p>
            <p className="text-sm text-gray-400">
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
                <div
                  key={job.id}
                  className="bg-[#2a2a2a] rounded-xl overflow-hidden"
                >
                  {/* Job Card - Clean Design */}
                  <button
                    onClick={() => setExpandedJobId(expandedJobId === job.id ? null : job.id)}
                    className="w-full py-4 px-5 text-left flex items-center justify-between"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-semibold text-white">{job.serviceType}</span>
                        {getStatusBadge(job)}
                      </div>
                      <p className="text-base text-gray-300">{job.customer.name}</p>
                      <p className="text-sm text-gray-500">
                        {formatTime(job.startTime)} - {formatTime(job.endTime)}
                      </p>
                    </div>
                    <ChevronRight
                      className={`w-5 h-5 text-gray-500 transition-transform ${
                        expandedJobId === job.id ? 'rotate-90' : ''
                      }`}
                    />
                  </button>

                  {/* Expanded Content */}
                  {expandedJobId === job.id && (
                    <div className="px-5 pb-5 space-y-4 border-t border-zinc-800 pt-4">
                      {/* Address */}
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-gray-300 text-sm">{job.address}</p>
                          <button
                            onClick={() => openMaps(job.address)}
                            className="text-[#a3e635] text-sm mt-1 hover:underline"
                          >
                            Open in Maps
                          </button>
                        </div>
                      </div>

                      {/* Phone */}
                      {job.customer.phone && (
                        <div className="flex items-center gap-3">
                          <Phone className="w-5 h-5 text-gray-400" />
                          <button
                            onClick={() => callPhone(job.customer.phone!)}
                            className="text-[#a3e635] text-sm hover:underline"
                          >
                            {job.customer.phone}
                          </button>
                        </div>
                      )}

                      {/* Notes */}
                      {(job.customerNotes || job.internalNotes) && (
                        <div className="bg-zinc-800/50 rounded-lg p-3 text-sm">
                          {job.customerNotes && (
                            <p className="text-gray-300">
                              <span className="text-gray-500">Customer: </span>
                              {job.customerNotes}
                            </p>
                          )}
                          {job.internalNotes && (
                            <p className="text-gray-300 mt-1">
                              <span className="text-gray-500">Notes: </span>
                              {job.internalNotes}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Action Button */}
                      {renderActionButton(job)}
                    </div>
                  )}
                </div>
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
                  onClick={() => router.push(`/worker/job/${job.id}`)}
                  className="w-full bg-[#2a2a2a] rounded-xl py-4 px-5 text-left flex items-center justify-between hover:bg-zinc-700/50 transition-colors"
                >
                  <div className="space-y-1 flex-1 min-w-0">
                    <p className="text-sm text-[#a3e635] font-medium">
                      {formatUpcomingDate(job.startTime)}
                    </p>
                    <p className="text-base text-gray-300">
                      {job.serviceType} - {job.customer.name}
                    </p>
                    <p className="text-sm text-gray-500 truncate">{job.address}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-500 flex-shrink-0 ml-3" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Job Modal */}
      {showCreateJob && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-zinc-900 w-full max-w-md max-h-[90vh] rounded-t-2xl sm:rounded-2xl border border-zinc-800 flex flex-col">
            {/* Modal Header */}
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

            {/* Modal Content */}
            <div className="p-4 pb-8 space-y-4 overflow-y-auto flex-1">
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

              {/* Submit Button */}
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
