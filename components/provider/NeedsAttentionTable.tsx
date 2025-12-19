"use client";

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';
import {
  ChevronRight,
  AlertCircle,
  CalendarX,
  ClockAlert,
  UserX,
  FileWarning,
  CheckCircle2,
  Clock
} from 'lucide-react';

interface WorkerAlert {
  id: string;
  name: string;
  jobCount: number;
}

interface Alerts {
  scheduleConflicts: number;
  scheduleConflictsLatest?: string | null;
  overloadedWorkers: WorkerAlert[];
  underutilizedWorkers: WorkerAlert[];
  unassignedJobs: number;
  unassignedJobsLatest?: string | null;
  unconfirmedSoonJobs: number;
  unconfirmedSoonLatest?: string | null;
  overdueInvoices: number;
  overdueInvoicesLatest?: string | null;
  overdueJobs: number;
  overdueJobsLatest?: string | null;
}

export type AlertType = 'schedule-conflicts' | 'overdue-jobs' | 'unconfirmed-soon' | 'unassigned-jobs' | 'overdue-invoices';

interface NeedsAttentionTableProps {
  alerts: Alerts;
  onAlertClick?: (alertType: AlertType, alertDetails: { count: number; href: string }) => void;
}

type Priority = 'urgent' | 'medium' | 'low';

interface AlertRow {
  id: AlertType;
  type: string;
  icon: React.ReactNode;
  details: string;
  priority: Priority;
  href: string;
  count: number;
  latestDate: Date | null;
}

const priorityColors: Record<Priority, { bg: string; text: string; badge: string }> = {
  urgent: { bg: 'bg-red-500/10', text: 'text-red-600', badge: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300' },
  medium: { bg: 'bg-orange-500/10', text: 'text-orange-600', badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300' },
  low: { bg: 'bg-amber-500/10', text: 'text-amber-600', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300' },
};

const priorityOrder: Record<Priority, number> = {
  urgent: 0,
  medium: 1,
  low: 2,
};

function formatRelativeDate(date: Date | null): string {
  if (!date) return '';

  if (isToday(date)) {
    return formatDistanceToNow(date, { addSuffix: true });
  }
  if (isYesterday(date)) {
    return 'Yesterday';
  }
  // If within last 7 days, show relative
  const daysDiff = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (daysDiff < 7) {
    return formatDistanceToNow(date, { addSuffix: true });
  }
  // Otherwise show date
  return format(date, 'MMM d');
}

export default function NeedsAttentionTable({ alerts, onAlertClick }: NeedsAttentionTableProps) {
  const router = useRouter();

  // Build and sort alert rows by latest date (most recent first), then by priority
  const alertRows = useMemo(() => {
    const rows: AlertRow[] = [];

    if (alerts.scheduleConflicts > 0) {
      rows.push({
        id: 'schedule-conflicts',
        type: 'Schedule Conflicts',
        icon: <AlertCircle className="h-4 w-4" />,
        details: `${alerts.scheduleConflicts} overlapping ${alerts.scheduleConflicts === 1 ? 'job' : 'jobs'}`,
        priority: 'urgent',
        href: '/provider/calendar',
        count: alerts.scheduleConflicts,
        latestDate: alerts.scheduleConflictsLatest ? new Date(alerts.scheduleConflictsLatest) : null,
      });
    }

    if (alerts.overdueJobs > 0) {
      rows.push({
        id: 'overdue-jobs',
        type: 'Overdue Jobs',
        icon: <CalendarX className="h-4 w-4" />,
        details: `${alerts.overdueJobs} past scheduled time`,
        priority: 'urgent',
        href: '/provider/jobs?status=overdue',
        count: alerts.overdueJobs,
        latestDate: alerts.overdueJobsLatest ? new Date(alerts.overdueJobsLatest) : null,
      });
    }

    if (alerts.unconfirmedSoonJobs > 0) {
      rows.push({
        id: 'unconfirmed-soon',
        type: 'Starting Soon',
        icon: <ClockAlert className="h-4 w-4" />,
        details: `${alerts.unconfirmedSoonJobs} within 2 hours`,
        priority: 'urgent', // Upgraded to urgent since they're imminent
        href: '/provider/jobs?status=pending',
        count: alerts.unconfirmedSoonJobs,
        latestDate: alerts.unconfirmedSoonLatest ? new Date(alerts.unconfirmedSoonLatest) : null,
      });
    }

    if (alerts.unassignedJobs > 0) {
      rows.push({
        id: 'unassigned-jobs',
        type: 'Unassigned Jobs',
        icon: <UserX className="h-4 w-4" />,
        details: `${alerts.unassignedJobs} ${alerts.unassignedJobs === 1 ? 'job needs' : 'jobs need'} worker`,
        priority: 'medium',
        href: '/provider/calendar',
        count: alerts.unassignedJobs,
        latestDate: alerts.unassignedJobsLatest ? new Date(alerts.unassignedJobsLatest) : null,
      });
    }

    if (alerts.overdueInvoices > 0) {
      rows.push({
        id: 'overdue-invoices',
        type: 'Overdue Invoices',
        icon: <FileWarning className="h-4 w-4" />,
        details: `${alerts.overdueInvoices} unpaid 30+ days`,
        priority: 'low',
        href: '/provider/invoices?status=overdue',
        count: alerts.overdueInvoices,
        latestDate: alerts.overdueInvoicesLatest ? new Date(alerts.overdueInvoicesLatest) : null,
      });
    }

    // Sort by:
    // 1. Priority (urgent > medium > low)
    // 2. Latest date (most recent first)
    return rows.sort((a, b) => {
      // First sort by priority
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Then by latest date (most recent first)
      const aTime = a.latestDate?.getTime() || 0;
      const bTime = b.latestDate?.getTime() || 0;
      return bTime - aTime;
    });
  }, [alerts]);

  const handleAlertClick = (alert: AlertRow) => {
    if (onAlertClick) {
      onAlertClick(alert.id, { count: alert.count, href: alert.href });
    } else {
      router.push(alert.href);
    }
  };

  // Empty state
  if (alertRows.length === 0) {
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
          {alertRows.length} {alertRows.length === 1 ? 'issue' : 'issues'}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/30">
            <tr>
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Alert Type</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Details</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Latest</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Priority</th>
              <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {alertRows.map((alert, index) => {
              const colors = priorityColors[alert.priority];
              return (
                <tr
                  key={alert.id}
                  onClick={() => handleAlertClick(alert)}
                  className={`cursor-pointer hover:bg-muted/40 transition-colors ${
                    index % 2 === 0 ? 'bg-background' : 'bg-muted/20'
                  }`}
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${colors.bg}`}>
                        <span className={colors.text}>{alert.icon}</span>
                      </div>
                      <span className="text-sm font-medium text-foreground">{alert.type}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm text-muted-foreground">
                    {alert.details}
                  </td>
                  <td className="px-5 py-3">
                    {alert.latestDate ? (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{formatRelativeDate(alert.latestDate)}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors.badge}`}>
                      {alert.priority === 'urgent' ? 'Urgent' : alert.priority === 'medium' ? 'Medium' : 'Low'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <ChevronRight className={`h-4 w-4 inline-block ${colors.text}`} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
