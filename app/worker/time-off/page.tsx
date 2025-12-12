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

const REASONS = [
  { value: 'vacation', label: 'Vacation' },
  { value: 'sick', label: 'Sick Leave' },
  { value: 'appointment', label: 'Appointment' },
  { value: 'personal', label: 'Personal' },
  { value: 'other', label: 'Other' },
];

export default function WorkerTimeOff() {
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

  const fetchRequests = useCallback(async (uid: string) => {
    try {
      const res = await fetch(`/api/worker/time-off?userId=${uid}`);
      const data = await res.json();
      if (data.requests) {
        setRequests(data.requests);
      }
    } catch (error) {
      console.error('Error fetching time off requests:', error);
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
    fetchRequests(uid);
  }, [router, fetchRequests]);

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
        fetchRequests(userId);
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
        fetchRequests(userId);
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

  return (
    <WorkerLayout>
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">Time Off</h1>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Request
          </button>
        </div>

        {/* Request Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center sm:items-center">
            <div className="bg-zinc-900 w-full max-w-md rounded-t-2xl sm:rounded-2xl border border-zinc-800">
              <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                <h2 className="text-lg font-semibold text-white">Request Time Off</h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-zinc-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, startDate: e.target.value }))
                      }
                      className="w-full px-3 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, endDate: e.target.value }))
                      }
                      className="w-full px-3 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1">
                    Reason
                  </label>
                  <select
                    value={formData.reason}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, reason: e.target.value }))
                    }
                    className="w-full px-3 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  >
                    {REASONS.map((reason) => (
                      <option key={reason.value} value={reason.value}>
                        {reason.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, notes: e.target.value }))
                    }
                    placeholder="Any additional details..."
                    rows={3}
                    className="w-full px-3 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500 resize-none"
                  />
                </div>

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
              </form>
            </div>
          </div>
        )}

        {/* Requests List */}
        <div className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
          ) : requests.length === 0 ? (
            <div className="bg-zinc-900 rounded-xl p-8 text-center border border-zinc-800">
              <Calendar className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
              <p className="text-zinc-400">No time off requests</p>
              <p className="text-zinc-500 text-sm mt-1">
                Tap the button above to request time off
              </p>
            </div>
          ) : (
            requests.map((request) => (
              <div
                key={request.id}
                className="bg-zinc-900 rounded-xl p-4 border border-zinc-800"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-white">
                        {getReasonLabel(request.reason)}
                      </span>
                      {getStatusBadge(request.status)}
                    </div>
                    <p className="text-zinc-400 text-sm">
                      {formatDate(request.startDate)} - {formatDate(request.endDate)}
                    </p>
                    {request.notes && (
                      <p className="text-zinc-500 text-sm mt-2">{request.notes}</p>
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
    </WorkerLayout>
  );
}
