'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import WorkerLayout from '@/components/worker/WorkerLayout';
import {
  Plus,
  Calendar,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  X,
  Trash2,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Briefcase,
} from 'lucide-react';
import { toast } from 'sonner';

interface TimeOffRequest {
  id: string;
  startDate: string;
  endDate: string;
  reason: string | null;
  notes: string | null;
  status: string;
  createdAt: string;
}

interface Job {
  id: string;
  serviceType: string;
  address: string;
  startTime: string;
  endTime: string;
  status: string;
  customer: {
    id: string;
    name: string;
    phone: string | null;
  };
}

const REASONS = [
  { value: 'vacation', label: 'Vacation' },
  { value: 'sick', label: 'Sick Leave' },
  { value: 'appointment', label: 'Appointment' },
  { value: 'personal', label: 'Personal' },
  { value: 'other', label: 'Other' },
];

export default function WorkerSchedule() {
  const router = useRouter();
  const [userId, setUserId] = useState<string>('');
  const [requests, setRequests] = useState<TimeOffRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    reason: 'vacation',
    notes: '',
  });

  // Job schedule state
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobsByDay, setJobsByDay] = useState<Record<string, Job[]>>({});
  const [loadingJobs, setLoadingJobs] = useState(true);

  const fetchJobs = useCallback(async (uid: string, date: Date) => {
    setLoadingJobs(true);
    try {
      if (viewMode === 'week') {
        // Get Monday of the selected week
        const monday = new Date(date);
        const day = monday.getDay();
        const diff = monday.getDate() - day + (day === 0 ? -6 : 1);
        monday.setDate(diff);
        monday.setHours(0, 0, 0, 0);

        const res = await fetch(`/api/worker/jobs/week?userId=${uid}&startDate=${monday.toISOString()}`);
        const data = await res.json();
        if (data.jobs) {
          setJobs(data.jobs);
          setJobsByDay(data.jobsByDay || {});
        }
      } else {
        // Day view - fetch today's jobs
        const res = await fetch(`/api/worker/jobs/today?userId=${uid}`);
        const data = await res.json();
        if (data.jobs) {
          // Filter for selected date
          const dateStr = date.toISOString().split('T')[0];
          const filteredJobs = data.jobs.filter((job: Job) =>
            job.startTime.split('T')[0] === dateStr
          );
          setJobs(filteredJobs);
        }
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoadingJobs(false);
    }
  }, [viewMode]);

  const fetchTimeOff = useCallback(async (uid: string) => {
    try {
      const res = await fetch(`/api/worker/time-off?userId=${uid}`);
      const data = await res.json();
      if (data.requests) {
        setRequests(data.requests);
      }
    } catch (error) {
      console.error('Error fetching time off:', error);
    }
  }, []);

  useEffect(() => {
    const uid = localStorage.getItem('workerUserId');
    if (!uid) {
      router.push('/provider/login');
      return;
    }
    setUserId(uid);

    Promise.all([
      fetchJobs(uid, selectedDate),
      fetchTimeOff(uid),
    ]).finally(() => setLoading(false));
  }, [router, fetchJobs, fetchTimeOff, selectedDate]);

  // Refresh jobs when viewMode or selectedDate changes
  useEffect(() => {
    if (userId) {
      fetchJobs(userId, selectedDate);
    }
  }, [userId, selectedDate, viewMode, fetchJobs]);

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDayHeader = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatShortDay = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    }
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const getWeekDays = () => {
    const monday = new Date(selectedDate);
    const day = monday.getDay();
    const diff = monday.getDate() - day + (day === 0 ? -6 : 1);
    monday.setDate(diff);
    monday.setHours(0, 0, 0, 0);

    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const getJobStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'in_progress':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'on_the_way':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default:
        return 'bg-zinc-700/50 text-zinc-300 border-zinc-600';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.startDate || !formData.endDate) {
      toast.error('Please select start and end dates');
      return;
    }

    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      toast.error('End date must be after start date');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/worker/time-off', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          startDate: formData.startDate,
          endDate: formData.endDate,
          reason: formData.reason,
          notes: formData.notes || null,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success('Time off request submitted!');
        setShowForm(false);
        setFormData({ startDate: '', endDate: '', reason: 'vacation', notes: '' });
        fetchTimeOff(userId);
      } else {
        toast.error(data.error || 'Failed to submit request');
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      toast.error('Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (requestId: string) => {
    try {
      const res = await fetch(`/api/worker/time-off/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success('Request cancelled');
        fetchTimeOff(userId);
      } else {
        toast.error(data.error || 'Failed to cancel request');
      }
    } catch (error) {
      console.error('Error cancelling request:', error);
      toast.error('Something went wrong');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400">
            <CheckCircle className="w-3 h-3" />
            Approved
          </span>
        );
      case 'denied':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
            <XCircle className="w-3 h-3" />
            Denied
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
    }
  };

  const getReasonLabel = (reason: string | null) => {
    return REASONS.find((r) => r.value === reason)?.label || reason || 'Other';
  };

  if (loading) {
    return (
      <WorkerLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        </div>
      </WorkerLayout>
    );
  }

  return (
    <WorkerLayout>
      <div className="p-4 pb-28 space-y-6">
        {/* Header */}
        <h1 className="text-xl font-bold text-white">Schedule</h1>

        {/* Section 1: Job Schedule View */}
        <div className="bg-zinc-900 rounded-xl border border-zinc-800">
          <div className="p-4 border-b border-zinc-800">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-white">My Jobs</h2>
              <div className="flex items-center gap-1 bg-zinc-800 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('day')}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    viewMode === 'day'
                      ? 'bg-emerald-600 text-white'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Day
                </button>
                <button
                  onClick={() => setViewMode('week')}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    viewMode === 'week'
                      ? 'bg-emerald-600 text-white'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Week
                </button>
              </div>
            </div>

            {/* Date Navigation */}
            <div className="flex items-center justify-between mt-3">
              <button
                onClick={() => navigateDate('prev')}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="text-center">
                <p className="font-medium text-white">
                  {viewMode === 'day'
                    ? formatDayHeader(selectedDate)
                    : `Week of ${getWeekDays()[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                  }
                </p>
                <button
                  onClick={goToToday}
                  className="text-xs text-emerald-400 hover:text-emerald-300"
                >
                  Go to Today
                </button>
              </div>
              <button
                onClick={() => navigateDate('next')}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-4">
            {loadingJobs ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
              </div>
            ) : viewMode === 'day' ? (
              // Day View
              jobs.length === 0 ? (
                <div className="text-center py-8">
                  <Briefcase className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
                  <p className="text-zinc-500 text-sm">No jobs scheduled for this day</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {jobs.map((job) => (
                    <button
                      key={job.id}
                      onClick={() => router.push(`/worker/job/${job.id}`)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors hover:bg-zinc-800/50 ${getJobStatusColor(job.status)}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-white">{job.serviceType}</p>
                          <p className="text-sm text-zinc-400">{job.customer.name}</p>
                        </div>
                        <span className="text-sm font-medium">
                          {formatTime(job.startTime)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mt-2 text-zinc-500 text-xs">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{job.address}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )
            ) : (
              // Week View
              <div className="space-y-4">
                {getWeekDays().map((day) => {
                  const dateKey = day.toISOString().split('T')[0];
                  const dayJobs = jobsByDay[dateKey] || [];
                  const isToday = dateKey === new Date().toISOString().split('T')[0];

                  return (
                    <div key={dateKey}>
                      <div className={`flex items-center gap-2 mb-2 ${isToday ? 'text-emerald-400' : 'text-zinc-400'}`}>
                        <span className="text-sm font-medium">
                          {day.toLocaleDateString('en-US', { weekday: 'short' })}
                        </span>
                        <span className={`text-sm ${isToday ? 'bg-emerald-600 text-white px-2 py-0.5 rounded-full' : ''}`}>
                          {day.getDate()}
                        </span>
                        {dayJobs.length > 0 && (
                          <span className="text-xs text-zinc-500">
                            ({dayJobs.length} job{dayJobs.length > 1 ? 's' : ''})
                          </span>
                        )}
                      </div>
                      {dayJobs.length > 0 ? (
                        <div className="space-y-2 pl-2 border-l-2 border-zinc-800">
                          {dayJobs.map((job) => (
                            <button
                              key={job.id}
                              onClick={() => router.push(`/worker/job/${job.id}`)}
                              className={`w-full text-left p-2.5 rounded-lg border transition-colors hover:bg-zinc-800/50 ${getJobStatusColor(job.status)}`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-sm text-white truncate">{job.serviceType}</span>
                                <span className="text-xs ml-2 flex-shrink-0">{formatTime(job.startTime)}</span>
                              </div>
                              <p className="text-xs text-zinc-500 truncate mt-0.5">{job.customer.name}</p>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-zinc-600 pl-2 border-l-2 border-zinc-800 py-2">
                          No jobs
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Time Off Requests */}
        <div className="bg-zinc-900 rounded-xl border border-zinc-800">
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
            <h2 className="font-semibold text-white">Time Off Requests</h2>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded-lg font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Request
            </button>
          </div>
          <div className="p-4 space-y-3">
            {requests.length === 0 ? (
              <div className="text-center py-6">
                <Calendar className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
                <p className="text-zinc-500 text-sm">No time off requests</p>
              </div>
            ) : (
              requests.map((request) => (
                <div
                  key={request.id}
                  className="bg-zinc-800/50 rounded-lg p-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-white text-sm">
                          {getReasonLabel(request.reason)}
                        </span>
                        {getStatusBadge(request.status)}
                      </div>
                      <p className="text-zinc-400 text-sm">
                        {formatDate(request.startDate)} - {formatDate(request.endDate)}
                      </p>
                      {request.notes && (
                        <p className="text-zinc-500 text-sm mt-1">{request.notes}</p>
                      )}
                    </div>
                    {request.status === 'pending' && (
                      <button
                        onClick={() => handleCancel(request.id)}
                        className="p-2 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Request Form Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/60"
              onClick={() => setShowForm(false)}
            />

            {/* Modal */}
            <div className="relative bg-zinc-900 w-full max-w-md rounded-xl max-h-[85vh] flex flex-col border border-zinc-800">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-zinc-800 shrink-0">
                <h2 className="text-lg font-semibold text-white">Request Time Off</h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-zinc-400" />
                </button>
              </div>

              {/* Content */}
              <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-4 overflow-y-auto flex-1 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, startDate: e.target.value }))
                        }
                        className="w-full px-3 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-base text-white focus:outline-none focus:border-emerald-500"
                        style={{ fontSize: '16px' }}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, endDate: e.target.value }))
                        }
                        className="w-full px-3 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-base text-white focus:outline-none focus:border-emerald-500"
                        style={{ fontSize: '16px' }}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Reason
                    </label>
                    <select
                      value={formData.reason}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, reason: e.target.value }))
                      }
                      className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-base text-white focus:outline-none focus:border-emerald-500"
                      style={{ fontSize: '16px' }}
                    >
                      {REASONS.map((reason) => (
                        <option key={reason.value} value={reason.value}>
                          {reason.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Notes (Optional)
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, notes: e.target.value }))
                      }
                      placeholder="Any additional details..."
                      rows={3}
                      className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-base text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500 resize-none"
                      style={{ fontSize: '16px' }}
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-zinc-800 shrink-0">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Request'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </WorkerLayout>
  );
}
