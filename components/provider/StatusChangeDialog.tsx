'use client'

import { useState } from 'react';
import { X, Clock, CheckCircle, AlertCircle, Upload, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface StatusChangeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentStatus: string;
  targetStatus: string;
  jobId: string;
  jobName: string;
  estimatedValue?: number;
  onStatusChanged: () => void;
}

export default function StatusChangeDialog({
  isOpen,
  onClose,
  currentStatus,
  targetStatus,
  jobId,
  jobName,
  estimatedValue,
  onStatusChanged,
}: StatusChangeDialogProps) {
  const [loading, setLoading] = useState(false);
  const [clockIn, setClockIn] = useState(false);
  const [actualCost, setActualCost] = useState(estimatedValue?.toString() || '');
  const [timeSpent, setTimeSpent] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [cancelNotes, setCancelNotes] = useState('');
  const [afterPhotos, setAfterPhotos] = useState<File[]>([]);

  if (!isOpen) return null;

  const handleStatusChange = async () => {
    // Validation
    if (targetStatus === 'completed' && afterPhotos.length === 0) {
      toast.error('Please upload at least one "After" photo');
      return;
    }

    if (targetStatus === 'cancelled' && !cancelReason) {
      toast.error('Please select a cancellation reason');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('status', targetStatus);

      if (targetStatus === 'in_progress') {
        formData.append('clockIn', clockIn.toString());
        if (clockIn) {
          formData.append('startTime', new Date().toISOString());
        }
      }

      if (targetStatus === 'completed') {
        if (actualCost) formData.append('actualCost', actualCost);
        if (timeSpent) formData.append('timeSpent', timeSpent);
        afterPhotos.forEach((photo, index) => {
          formData.append(`afterPhoto${index}`, photo);
        });
      }

      if (targetStatus === 'cancelled') {
        formData.append('cancelReason', cancelReason);
        if (cancelNotes) formData.append('cancelNotes', cancelNotes);
      }

      const res = await fetch(`/api/provider/jobs/${jobId}/status`, {
        method: 'PUT',
        body: formData,
      });

      if (!res.ok) throw new Error('Failed to update status');

      toast.success(`Status updated to ${targetStatus.replace('_', ' ')}`);

      // Show next action prompt based on status
      if (targetStatus === 'completed') {
        setTimeout(() => {
          if (confirm('Job marked as complete! Want to send invoice now?')) {
            toast.info('Invoice feature coming soon');
          }
        }, 500);
      }

      onStatusChanged();
      onClose();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAfterPhotos(Array.from(e.target.files));
    }
  };

  const getDialogConfig = () => {
    switch (targetStatus) {
      case 'in_progress':
        return {
          title: 'Start this job now?',
          icon: Clock,
          iconColor: 'text-orange-400',
          confirmText: 'Start Job',
          confirmColor: 'bg-orange-600 hover:bg-orange-500',
        };
      case 'completed':
        return {
          title: 'Mark job as complete?',
          icon: CheckCircle,
          iconColor: 'text-emerald-400',
          confirmText: 'Complete Job',
          confirmColor: 'bg-emerald-600 hover:bg-emerald-500',
        };
      case 'cancelled':
        return {
          title: 'Cancel this job?',
          icon: AlertCircle,
          iconColor: 'text-red-400',
          confirmText: 'Cancel Job',
          confirmColor: 'bg-red-600 hover:bg-red-500',
        };
      default:
        return {
          title: 'Change status?',
          icon: Clock,
          iconColor: 'text-blue-400',
          confirmText: 'Confirm',
          confirmColor: 'bg-blue-600 hover:bg-blue-500',
        };
    }
  };

  const config = getDialogConfig();
  const Icon = config.icon;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-50 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-zinc-800/50 ${config.iconColor}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-zinc-100">{config.title}</h2>
              <p className="text-sm text-zinc-400">{jobName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* In Progress Dialog */}
          {targetStatus === 'in_progress' && (
            <div className="space-y-4">
              <p className="text-sm text-zinc-300">
                This will mark the job as in progress and notify the customer that you&apos;re on your way.
              </p>

              <label className="flex items-center gap-3 p-3 bg-zinc-800/30 border border-zinc-800 rounded-lg cursor-pointer hover:bg-zinc-800/50 transition-colors">
                <input
                  type="checkbox"
                  checked={clockIn}
                  onChange={(e) => setClockIn(e.target.checked)}
                  className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-emerald-600 focus:ring-emerald-500 focus:ring-offset-0"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-zinc-400" />
                    <span className="text-sm font-medium text-zinc-200">Clock in</span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5">Start tracking time for this job</p>
                </div>
              </label>
            </div>
          )}

          {/* Completed Dialog */}
          {targetStatus === 'completed' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2 flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  After Photos <span className="text-red-400">*</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-200 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-emerald-600 file:text-white hover:file:bg-emerald-500 cursor-pointer"
                />
                {afterPhotos.length > 0 && (
                  <p className="text-xs text-emerald-400 mt-2">
                    {afterPhotos.length} photo{afterPhotos.length > 1 ? 's' : ''} selected
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Time Spent (hours)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={timeSpent}
                  onChange={(e) => setTimeSpent(e.target.value)}
                  placeholder="e.g., 2.5"
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Actual Cost
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={actualCost}
                  onChange={(e) => setActualCost(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                />
                {estimatedValue && (
                  <p className="text-xs text-zinc-500 mt-1">
                    Estimated: ${estimatedValue.toFixed(2)}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Cancelled Dialog */}
          {targetStatus === 'cancelled' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Reason <span className="text-red-400">*</span>
                </label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-red-500"
                >
                  <option value="">Select a reason...</option>
                  <option value="customer_cancelled">Customer Cancelled</option>
                  <option value="weather">Weather</option>
                  <option value="equipment">Equipment Issues</option>
                  <option value="rescheduled">Rescheduled</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Notes (optional)
                </label>
                <textarea
                  value={cancelNotes}
                  onChange={(e) => setCancelNotes(e.target.value)}
                  placeholder="Add any additional details..."
                  rows={3}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-red-500 resize-none"
                />
              </div>

              <div className="p-3 bg-zinc-800/30 border border-zinc-700/50 rounded-lg">
                <p className="text-xs text-zinc-400">
                  The customer will be notified about the cancellation.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-zinc-900 border-t border-zinc-800 p-4 flex items-center justify-end gap-3">
          <Button
            onClick={onClose}
            variant="outline"
            className="border-zinc-700 hover:bg-zinc-800"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleStatusChange}
            disabled={loading}
            className={`text-white ${config.confirmColor}`}
          >
            {loading ? 'Processing...' : config.confirmText}
          </Button>
        </div>
      </div>
    </>
  );
}
