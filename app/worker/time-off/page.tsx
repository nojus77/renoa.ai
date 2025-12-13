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
  Save,
} from 'lucide-react';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';

interface TimeOffRequest {
  id: string;
  startDate: string;
  endDate: string;
  reason: string | null;
  notes: string | null;
  status: string;
  createdAt: string;
}

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

  // Working hours state
  const [workingHours, setWorkingHours] = useState<Record<string, { start: string; end: string } | null>>({});
  const [scheduleForm, setScheduleForm] = useState<Record<string, { enabled: boolean; start: string; end: string }>>({});
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [hasScheduleChanges, setHasScheduleChanges] = useState(false);
  const [canEditAvailability, setCanEditAvailability] = useState(false);

  const fetchData = useCallback(async (uid: string) => {
    try {
      // Fetch time off requests
      const timeOffRes = await fetch(`/api/worker/time-off?userId=${uid}`);
      const timeOffData = await timeOffRes.json();
      if (timeOffData.requests) {
        setRequests(timeOffData.requests);
      }

      // Fetch profile for working hours
      const profileRes = await fetch(`/api/worker/profile?userId=${uid}`);
      const profileData = await profileRes.json();
      if (profileData.user) {
        const hours = profileData.user.workingHours || {};
        setWorkingHours(hours);
        setCanEditAvailability(profileData.user.provider?.workersCanEditAvailability || false);

        // Initialize schedule form
        const schedule: Record<string, { enabled: boolean; start: string; end: string }> = {};
        DAYS.forEach(({ key }) => {
          const dayHours = hours[key];
          schedule[key] = {
            enabled: !!dayHours,
            start: dayHours?.start || '08:00',
            end: dayHours?.end || '17:00',
          };
        });
        setScheduleForm(schedule);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const uid = localStorage.getItem('workerUserId');
    if (!uid) {
      router.push('/provider/login');
      return;
    }
    setUserId(uid);
    fetchData(uid);
  }, [router, fetchData]);

  // Track schedule changes
  useEffect(() => {
    const hasChanges = DAYS.some(({ key }) => {
      const current = workingHours[key];
      const form = scheduleForm[key];
      if (!form) return false;
      if (form.enabled !== !!current) return true;
      if (form.enabled && current) {
        return form.start !== current.start || form.end !== current.end;
      }
      return false;
    });
    setHasScheduleChanges(hasChanges);
  }, [scheduleForm, workingHours]);

  const formatTime12 = (time24: string) => {
    const [hours, minutes] = time24.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${h12}:${minutes} ${ampm}`;
  };

  const handleSaveSchedule = async () => {
    setSavingSchedule(true);
    try {
      const newWorkingHours: Record<string, { start: string; end: string }> = {};
      DAYS.forEach(({ key }) => {
        const form = scheduleForm[key];
        if (form?.enabled) {
          newWorkingHours[key] = {
            start: form.start,
            end: form.end,
          };
        }
      });

      const res = await fetch('/api/worker/schedule', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          workingHours: newWorkingHours,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setWorkingHours(newWorkingHours);
        toast.success('Schedule updated!');
      } else {
        toast.error(data.error || 'Failed to update schedule');
      }
    } catch {
      toast.error('Connection error');
    } finally {
      setSavingSchedule(false);
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
        fetchData(userId);
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
        fetchData(userId);
      } else {
        toast.error(data.error || 'Failed to cancel request');
      }
    } catch (error) {
      console.error('Error cancelling request:', error);
      toast.error('Something went wrong');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
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

        {/* Section 1: Working Hours */}
        <div className="bg-zinc-900 rounded-xl border border-zinc-800">
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
            <h2 className="font-semibold text-white">My Working Hours</h2>
            {canEditAvailability && hasScheduleChanges && (
              <button
                onClick={handleSaveSchedule}
                disabled={savingSchedule}
                className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded-lg font-medium transition-colors"
              >
                {savingSchedule ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save
              </button>
            )}
          </div>
          <div className="p-4 space-y-3">
            {!canEditAvailability && (
              <p className="text-zinc-500 text-sm mb-3">
                Contact your manager to update your schedule
              </p>
            )}
            {DAYS.map(({ key, short }) => (
              <div key={key} className="flex items-center gap-3">
                <Switch
                  checked={scheduleForm[key]?.enabled || false}
                  onCheckedChange={(checked) => {
                    if (!canEditAvailability) return;
                    setScheduleForm((prev) => ({
                      ...prev,
                      [key]: { ...prev[key], enabled: checked },
                    }));
                  }}
                  disabled={!canEditAvailability}
                />
                <span className="w-10 text-sm text-zinc-300">{short}</span>
                {scheduleForm[key]?.enabled ? (
                  <div className="flex items-center gap-2">
                    <select
                      value={scheduleForm[key]?.start || '08:00'}
                      onChange={(e) => {
                        if (!canEditAvailability) return;
                        setScheduleForm((prev) => ({
                          ...prev,
                          [key]: { ...prev[key], start: e.target.value },
                        }));
                      }}
                      disabled={!canEditAvailability}
                      className="px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-sm text-white disabled:opacity-50"
                    >
                      {TIME_OPTIONS.map((t) => (
                        <option key={t} value={t}>{formatTime12(t)}</option>
                      ))}
                    </select>
                    <span className="text-zinc-500">to</span>
                    <select
                      value={scheduleForm[key]?.end || '17:00'}
                      onChange={(e) => {
                        if (!canEditAvailability) return;
                        setScheduleForm((prev) => ({
                          ...prev,
                          [key]: { ...prev[key], end: e.target.value },
                        }));
                      }}
                      disabled={!canEditAvailability}
                      className="px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-sm text-white disabled:opacity-50"
                    >
                      {TIME_OPTIONS.map((t) => (
                        <option key={t} value={t}>{formatTime12(t)}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <span className="text-zinc-500 text-sm">Off</span>
                )}
              </div>
            ))}
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
