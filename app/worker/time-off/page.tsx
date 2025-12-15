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
  ChevronDown,
  Save,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
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

const DAYS = [
  { key: 'monday', label: 'Monday', short: 'Mon' },
  { key: 'tuesday', label: 'Tuesday', short: 'Tue' },
  { key: 'wednesday', label: 'Wednesday', short: 'Wed' },
  { key: 'thursday', label: 'Thursday', short: 'Thu' },
  { key: 'friday', label: 'Friday', short: 'Fri' },
  { key: 'saturday', label: 'Saturday', short: 'Sat' },
  { key: 'sunday', label: 'Sunday', short: 'Sun' },
];

const TIME_OPTIONS = [
  '05:00', '05:30', '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00',
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

  // Working hours state
  const [workingHoursExpanded, setWorkingHoursExpanded] = useState(false);
  const [scheduleForm, setScheduleForm] = useState<Record<string, { enabled: boolean; start: string; end: string }>>({});
  const [initialScheduleForm, setInitialScheduleForm] = useState<Record<string, { enabled: boolean; start: string; end: string }>>({});
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [hasScheduleChanges, setHasScheduleChanges] = useState(false);

  const fetchJobs = useCallback(async (uid: string, date: Date) => {
    setLoadingJobs(true);
    try {
      // Always use the week endpoint - it supports any date range
      // For day view, we'll filter client-side to just the selected day
      const monday = new Date(date);
      const day = monday.getDay();
      const diff = monday.getDate() - day + (day === 0 ? -6 : 1);
      monday.setDate(diff);
      monday.setHours(0, 0, 0, 0);

      const res = await fetch(`/api/worker/jobs/week?userId=${uid}&startDate=${monday.toISOString()}`);
      const data = await res.json();
      if (data.jobs) {
        setJobsByDay(data.jobsByDay || {});

        if (viewMode === 'week') {
          setJobs(data.jobs);
        } else {
          // Day view - filter for selected date only
          const dateStr = date.toISOString().split('T')[0];
          const dayJobs = data.jobsByDay?.[dateStr] || [];
          setJobs(dayJobs);
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

  const fetchWorkingHours = useCallback(async (uid: string) => {
    try {
      const res = await fetch(`/api/worker/profile?userId=${uid}`);
      const data = await res.json();
      if (data.user) {
        const schedule: Record<string, { enabled: boolean; start: string; end: string }> = {};
        DAYS.forEach(({ key }) => {
          const hours = data.user.workingHours?.[key];
          schedule[key] = {
            enabled: !!hours,
            start: hours?.start || '08:00',
            end: hours?.end || '17:00',
          };
        });
        setScheduleForm(schedule);
        setInitialScheduleForm(JSON.parse(JSON.stringify(schedule)));
      }
    } catch (error) {
      console.error('Error fetching working hours:', error);
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
      fetchWorkingHours(uid),
    ]).finally(() => setLoading(false));
  }, [router, fetchJobs, fetchTimeOff, fetchWorkingHours, selectedDate]);

  // Track schedule changes
  useEffect(() => {
    const hasChanges = DAYS.some(({ key }) => {
      const initial = initialScheduleForm[key];
      const form = scheduleForm[key];
      if (!form || !initial) return false;
      if (form.enabled !== initial.enabled) return true;
      if (form.enabled) {
        return form.start !== initial.start || form.end !== initial.end;
      }
      return false;
    });
    setHasScheduleChanges(hasChanges);
  }, [scheduleForm, initialScheduleForm]);

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
        return 'bg-[#C4F542]/20 text-[#C4F542] border-[#C4F542]/30';
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
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-[#C4F542]/20 text-[#C4F542]">
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

  const handleSaveSchedule = async () => {
    if (!userId) return;
    setSavingSchedule(true);

    try {
      const workingHours: Record<string, { start: string; end: string }> = {};
      Object.entries(scheduleForm).forEach(([day, data]) => {
        if (data.enabled) {
          workingHours[day] = { start: data.start, end: data.end };
        }
      });

      const res = await fetch('/api/worker/availability', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          workingHours: Object.keys(workingHours).length > 0 ? workingHours : null,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setInitialScheduleForm(JSON.parse(JSON.stringify(scheduleForm)));
        toast.success('Working hours updated');
      } else {
        toast.error(data.error || 'Failed to update working hours');
      }
    } catch {
      toast.error('Connection error');
    } finally {
      setSavingSchedule(false);
    }
  };

  if (loading) {
    return (
      <WorkerLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-[#C4F542]" />
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
        <div className="bg-[#1F1F1F] rounded-xl border border-[#2A2A2A]">
          <div className="p-4 border-b border-[#2A2A2A]">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-white">My Jobs</h2>
              <div className="flex items-center gap-1 bg-[#2A2A2A] rounded-lg p-1">
                <button
                  onClick={() => setViewMode('day')}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    viewMode === 'day'
                      ? 'bg-[#C4F542] text-white'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Day
                </button>
                <button
                  onClick={() => setViewMode('week')}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    viewMode === 'week'
                      ? 'bg-[#C4F542] text-white'
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
                className="p-2 text-zinc-400 hover:text-white hover:bg-[#2A2A2A] rounded-lg"
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
                  className="text-xs text-[#C4F542] hover:text-[#B3E232]"
                >
                  Go to Today
                </button>
              </div>
              <button
                onClick={() => navigateDate('next')}
                className="p-2 text-zinc-400 hover:text-white hover:bg-[#2A2A2A] rounded-lg"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-4">
            {loadingJobs ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-[#C4F542]" />
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
                      className={`w-full text-left p-3 rounded-lg border transition-colors hover:bg-[#2A2A2A]/50 ${getJobStatusColor(job.status)}`}
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
                      <div className={`flex items-center gap-2 mb-2 ${isToday ? 'text-[#C4F542]' : 'text-zinc-400'}`}>
                        <span className="text-sm font-medium">
                          {day.toLocaleDateString('en-US', { weekday: 'short' })}
                        </span>
                        <span className={`text-sm ${isToday ? 'bg-[#C4F542] text-white px-2 py-0.5 rounded-full' : ''}`}>
                          {day.getDate()}
                        </span>
                        {dayJobs.length > 0 && (
                          <span className="text-xs text-zinc-500">
                            ({dayJobs.length} job{dayJobs.length > 1 ? 's' : ''})
                          </span>
                        )}
                      </div>
                      {dayJobs.length > 0 ? (
                        <div className="space-y-2 pl-2 border-l-2 border-[#2A2A2A]">
                          {dayJobs.map((job) => (
                            <button
                              key={job.id}
                              onClick={() => router.push(`/worker/job/${job.id}`)}
                              className={`w-full text-left p-2.5 rounded-lg border transition-colors hover:bg-[#2A2A2A]/50 ${getJobStatusColor(job.status)}`}
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
                        <p className="text-xs text-zinc-600 pl-2 border-l-2 border-[#2A2A2A] py-2">
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
        <div className="bg-[#1F1F1F] rounded-xl border border-[#2A2A2A]">
          <div className="p-4 border-b border-[#2A2A2A] flex items-center justify-between">
            <h2 className="font-semibold text-white">Time Off Requests</h2>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#C4F542] hover:bg-[#B3E232] text-white text-sm rounded-lg font-medium transition-colors"
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
                  className="bg-[#2A2A2A]/50 rounded-lg p-3"
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
                        className="p-2 text-zinc-500 hover:text-red-400 hover:bg-[#2A2A2A] rounded-lg transition-colors"
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

        {/* Section 3: My Working Hours (Collapsible) */}
        <div className="bg-[#1F1F1F] rounded-xl border border-[#2A2A2A]">
          <button
            onClick={() => setWorkingHoursExpanded(!workingHoursExpanded)}
            className="w-full p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-400" />
              <h2 className="font-semibold text-white">My Working Hours</h2>
            </div>
            <ChevronDown
              className={`w-5 h-5 text-zinc-400 transition-transform duration-200 ${
                workingHoursExpanded ? 'rotate-180' : ''
              }`}
            />
          </button>

          {workingHoursExpanded && (
            <div className="px-4 pb-4 border-t border-[#2A2A2A] pt-4 space-y-4">
              {DAYS.map(({ key, label }) => (
                <div key={key} className="flex items-center gap-4">
                  <div className="w-24 flex items-center gap-3">
                    <Switch
                      checked={scheduleForm[key]?.enabled || false}
                      onCheckedChange={(checked) => setScheduleForm({
                        ...scheduleForm,
                        [key]: { ...scheduleForm[key], enabled: checked }
                      })}
                      className="data-[state=checked]:bg-[#C4F542]"
                    />
                    <span className={`text-sm font-medium ${scheduleForm[key]?.enabled ? 'text-white' : 'text-zinc-600'}`}>
                      {label.slice(0, 3)}
                    </span>
                  </div>
                  {scheduleForm[key]?.enabled ? (
                    <div className="flex items-center gap-2 flex-1">
                      <select
                        value={scheduleForm[key]?.start || '08:00'}
                        onChange={(e) => setScheduleForm({
                          ...scheduleForm,
                          [key]: { ...scheduleForm[key], start: e.target.value }
                        })}
                        className="h-9 px-3 bg-[#2A2A2A] border border-[#3A3A3A] rounded-lg text-sm text-white focus:border-[#C4F542] focus:outline-none"
                      >
                        {TIME_OPTIONS.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                      <span className="text-zinc-500 text-sm">to</span>
                      <select
                        value={scheduleForm[key]?.end || '17:00'}
                        onChange={(e) => setScheduleForm({
                          ...scheduleForm,
                          [key]: { ...scheduleForm[key], end: e.target.value }
                        })}
                        className="h-9 px-3 bg-[#2A2A2A] border border-[#3A3A3A] rounded-lg text-sm text-white focus:border-[#C4F542] focus:outline-none"
                      >
                        {TIME_OPTIONS.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <span className="text-sm text-zinc-600 flex-1">Off</span>
                  )}
                </div>
              ))}

              <button
                onClick={handleSaveSchedule}
                disabled={savingSchedule || !hasScheduleChanges}
                className="w-full h-11 mt-4 bg-[#C4F542] hover:bg-[#B3E232] disabled:bg-[#2A2A2A] disabled:text-zinc-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {savingSchedule ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Working Hours
                  </>
                )}
              </button>
            </div>
          )}
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
            <div className="relative bg-[#1F1F1F] w-full max-w-md rounded-xl max-h-[85vh] flex flex-col border border-[#2A2A2A]">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-[#2A2A2A] shrink-0">
                <h2 className="text-lg font-semibold text-white">Request Time Off</h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="p-2 hover:bg-[#2A2A2A] rounded-lg transition-colors"
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
                        className="w-full px-3 py-3 bg-[#2A2A2A] border border-[#3A3A3A] rounded-lg text-base text-white focus:outline-none focus:border-[#C4F542]"
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
                        className="w-full px-3 py-3 bg-[#2A2A2A] border border-[#3A3A3A] rounded-lg text-base text-white focus:outline-none focus:border-[#C4F542]"
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
                      className="w-full px-4 py-3 bg-[#2A2A2A] border border-[#3A3A3A] rounded-lg text-base text-white focus:outline-none focus:border-[#C4F542]"
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
                      className="w-full px-4 py-3 bg-[#2A2A2A] border border-[#3A3A3A] rounded-lg text-base text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#C4F542] resize-none"
                      style={{ fontSize: '16px' }}
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-[#2A2A2A] shrink-0">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-4 bg-[#C4F542] hover:bg-[#B3E232] disabled:opacity-50 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
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
