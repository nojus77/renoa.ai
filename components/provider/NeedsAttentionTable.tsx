"use client";

import { useMemo, useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import {
  ChevronRight,
  CheckCircle2,
  Clock,
  X,
  UserX,
  AlertTriangle,
  CalendarX,
  ClockAlert,
} from 'lucide-react';

// Job with a problem that needs attention
interface AlertJob {
  id: string;
  startTime: string;
  endTime?: string | null;
  serviceType: string;
  customerName: string;
  address: string;
  problem: 'overdue' | 'no-worker' | 'conflict' | 'starting-soon';
}

interface WorkerAlert {
  id: string;
  name: string;
  jobCount: number;
}

interface Alerts {
  scheduleConflicts: number;
  scheduleConflictsLatest?: string | null;
  scheduleConflictsJobs?: AlertJob[];
  overloadedWorkers: WorkerAlert[];
  underutilizedWorkers: WorkerAlert[];
  unassignedJobs: number;
  unassignedJobsLatest?: string | null;
  unassignedJobsList?: AlertJob[];
  unconfirmedSoonJobs: number;
  unconfirmedSoonLatest?: string | null;
  unconfirmedSoonJobsList?: AlertJob[];
  overdueInvoices: number;
  overdueInvoicesLatest?: string | null;
  overdueJobs: number;
  overdueJobsLatest?: string | null;
  overdueJobsList?: AlertJob[];
}

export type AlertType = 'schedule-conflicts' | 'overdue-jobs' | 'unconfirmed-soon' | 'unassigned-jobs' | 'overdue-invoices' | 'overloaded-workers' | 'underutilized-workers' | 'today-jobs';

interface NeedsAttentionTableProps {
  alerts: Alerts;
  onAlertClick?: (alertType: AlertType, alertDetails: { count: number; href: string }) => void;
  onJobClick?: (job: AlertJob) => void;
  onDismissAlert?: (alertType: AlertType) => void;
  onDismissJob?: (jobId: string) => void;
}

type ProblemType = 'overdue' | 'no-worker' | 'conflict' | 'starting-soon';

const problemConfig: Record<ProblemType, { label: string; color: string; icon: React.ReactNode; priority: number }> = {
  'overdue': {
    label: 'Overdue',
    color: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
    icon: <CalendarX className="h-3 w-3" />,
    priority: 0,
  },
  'conflict': {
    label: 'Conflict',
    color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300',
    icon: <AlertTriangle className="h-3 w-3" />,
    priority: 1,
  },
  'starting-soon': {
    label: 'Starting Soon',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
    icon: <ClockAlert className="h-3 w-3" />,
    priority: 2,
  },
  'no-worker': {
    label: 'No Worker',
    color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300',
    icon: <UserX className="h-3 w-3" />,
    priority: 3,
  },
};

export default function NeedsAttentionTable({ alerts, onJobClick, onDismissJob }: NeedsAttentionTableProps) {
  const [dismissedJobIds, setDismissedJobIds] = useState<Set<string>>(new Set());
  const [dismissingJobId, setDismissingJobId] = useState<string | null>(null);
  const [confirmingDismissId, setConfirmingDismissId] = useState<string | null>(null);
  const confirmPopupRef = useRef<HTMLDivElement>(null);

  // Close confirmation popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (confirmPopupRef.current && !confirmPopupRef.current.contains(event.target as Node)) {
        setConfirmingDismissId(null);
      }
    };

    if (confirmingDismissId) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [confirmingDismissId]);

  // Combine all job alerts into a flat list
  const allAlertJobs = useMemo(() => {
    const jobs: AlertJob[] = [];

    // Add overdue jobs
    if (alerts.overdueJobsList) {
      jobs.push(...alerts.overdueJobsList);
    }

    // Add schedule conflicts
    if (alerts.scheduleConflictsJobs) {
      jobs.push(...alerts.scheduleConflictsJobs);
    }

    // Add starting soon jobs
    if (alerts.unconfirmedSoonJobsList) {
      jobs.push(...alerts.unconfirmedSoonJobsList);
    }

    // Add unassigned jobs
    if (alerts.unassignedJobsList) {
      jobs.push(...alerts.unassignedJobsList);
    }

    // Filter out dismissed jobs and sort by priority
    return jobs
      .filter(job => !dismissedJobIds.has(job.id))
      .sort((a, b) => {
        const priorityDiff = problemConfig[a.problem].priority - problemConfig[b.problem].priority;
        if (priorityDiff !== 0) return priorityDiff;
        // Secondary sort by start time (soonest first)
        return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
      });
  }, [alerts, dismissedJobIds]);

  const handleDismissClick = (e: React.MouseEvent, jobId: string) => {
    e.stopPropagation();
    // Show confirmation popup
    setConfirmingDismissId(confirmingDismissId === jobId ? null : jobId);
  };

  const handleConfirmDismiss = async (e: React.MouseEvent, jobId: string) => {
    e.stopPropagation();
    setConfirmingDismissId(null);
    setDismissingJobId(jobId);

    try {
      // Optimistic UI update
      setDismissedJobIds(prev => new Set(Array.from(prev).concat(jobId)));

      // Call parent callback if provided
      if (onDismissJob) {
        onDismissJob(jobId);
      }

      // API call to persist dismissal (optional - can be job-specific)
      const providerId = localStorage.getItem('providerId');
      await fetch('/api/provider/alerts/dismiss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId, alertType: `job-${jobId}` }),
      });
    } catch (error) {
      // Revert on error
      setDismissedJobIds(prev => {
        const next = new Set(prev);
        next.delete(jobId);
        return next;
      });
      console.error('Failed to dismiss job alert:', error);
    } finally {
      setDismissingJobId(null);
    }
  };

  const handleCancelDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmingDismissId(null);
  };

  const handleJobClick = (job: AlertJob) => {
    if (confirmingDismissId) {
      setConfirmingDismissId(null);
      return;
    }
    if (onJobClick) {
      onJobClick(job);
    }
  };

  const formatTime = (dateStr: string) => {
    return format(new Date(dateStr), 'h:mm a');
  };

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), 'MMM d');
  };

  // Empty state
  if (allAlertJobs.length === 0) {
    return (
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-base font-semibold text-foreground">Needs Attention</h3>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <CheckCircle2 className="h-10 w-10 mb-3 text-emerald-500 opacity-60" />
          <p className="text-sm font-medium text-foreground">All clear!</p>
          <p className="text-xs text-muted-foreground mt-1">No items need attention</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <h3 className="text-base font-semibold text-foreground">Needs Attention</h3>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
          {allAlertJobs.length} {allAlertJobs.length === 1 ? 'job' : 'jobs'}
        </span>
      </div>
      <div className="max-h-[400px] overflow-y-auto">
        <div className="divide-y divide-border">
          {allAlertJobs.map((job) => {
            const config = problemConfig[job.problem];
            const isConfirming = confirmingDismissId === job.id;
            return (
              <div
                key={`${job.id}-${job.problem}`}
                onClick={() => handleJobClick(job)}
                className="px-4 py-3 hover:bg-muted/40 transition-colors cursor-pointer group flex items-center gap-3 relative"
              >
                {/* Job Info */}
                <div className="flex-1 min-w-0">
                  {/* Row 1: Customer + Service + Problem Badge */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-foreground truncate">
                      {job.customerName}
                    </span>
                    <span className="text-xs text-primary">
                      {job.serviceType}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${config.color}`}>
                      {config.icon}
                      {config.label}
                    </span>
                  </div>
                  {/* Row 2: Date/Time */}
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{formatDate(job.startTime)} at {formatTime(job.startTime)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0 relative">
                  <button
                    onClick={(e) => handleDismissClick(e, job.id)}
                    disabled={dismissingJobId === job.id}
                    className={`p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors ${
                      isConfirming ? 'opacity-100 text-red-500 bg-red-500/10' : 'opacity-0 group-hover:opacity-100'
                    }`}
                    title="Dismiss"
                  >
                    <X className="h-4 w-4" />
                  </button>

                  {/* Confirmation Popup */}
                  {isConfirming && (
                    <div
                      ref={confirmPopupRef}
                      className="absolute right-0 top-full mt-1 z-50 bg-[#1a1a1a] border border-border rounded-xl shadow-xl p-3 w-48"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <p className="text-sm text-foreground mb-3">Remove this alert?</p>
                      <div className="flex gap-2">
                        <button
                          onClick={handleCancelDismiss}
                          className="flex-1 px-3 py-1.5 bg-muted hover:bg-muted/80 text-foreground text-xs font-medium rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={(e) => handleConfirmDismiss(e, job.id)}
                          className="flex-1 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded-lg transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  )}

                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
